# Google Translate Integration — How It Works

This document explains how the **invisible Google Translate** feature works in Astrikos Sentinel:
how clicking a button changes the page language, and how the "Translated by Google"
watermark/banner is hidden with CSS so the translation looks native.

> **Core idea:** We embed Google's free *website* translation widget, but we **never show
> Google's UI**. We drive it programmatically from our own button and hide every Google
> element (banner, dropdown, "powered by Google" branding) with CSS. To the end user it
> just looks like the app supports English ↔ Spanish natively.

---

## 1. Where the code lives

| File | Role |
|------|------|
| [src/components/Layout/LanguageToggle.tsx](../src/components/Layout/LanguageToggle.tsx) | The whole feature: loads Google's script, drives translation, and injects the hide-styles. |
| [src/components/Layout/Header.tsx](../src/components/Layout/Header.tsx#L62) | Renders `<LanguageToggle />` in the top bar. |
| [src/index.css](../src/index.css#L93-L130) | A **second, global copy** of the Google-element hide rules (defense in depth). |

The feature is self-contained in **`LanguageToggle.tsx`**. There is no API key and no backend —
it uses Google's public, client-side widget (`translate.google.com/translate_a/element.js`).

---

## 2. The big picture (lifecycle)

```
User clicks "Change Language"  ──►  translation system ENABLED  (saved to localStorage)
        │
        ├─► Google Translate <script> is injected into <head>
        ├─► google.translate.TranslateElement is created (hidden)
        ├─► CSS is injected to hide every Google UI element / banner
        └─► The "ES" button becomes active

User clicks the "ES" globe button  ──►  page text switches EN → ES (or back)
        │
        └─► We set the hidden <select class="goog-te-combo"> to 'es' and fire a change event.
            Google rewrites the page text in-place. No Google branding is visible.
```

There are **two separate toggles**, which is the part people find confusing:

1. **"Change Language" button** → turns the *translation system* on/off
   (`toggleTranslationSystem`). This loads or unloads Google entirely.
2. **The globe "ES" button** → actually *switches the language* between English and Spanish
   (`toggleTranslation`). It only works once the system is enabled and ready.

---

## 3. Step-by-step: what each part does

### 3.1 State (top of the component)

```tsx
const [isTranslationEnabled, setIsTranslationEnabled] = useState(false); // system loaded?
const [isTranslationOn, setIsTranslationOn]           = useState(false); // currently Spanish?
const [isTranslateReady, setIsTranslateReady]         = useState(false); // Google script done loading?
```

- `isTranslationEnabled` — has the user opted into translation at all (persisted in `localStorage`).
- `isTranslateReady` — Google's script finished downloading and the hidden widget exists.
- `isTranslationOn` — is the page currently showing Spanish.

### 3.2 On mount — restore the user's choice

```tsx
useEffect(() => {
  const translationEnabled = localStorage.getItem('translationEnabled') === 'true';
  setIsTranslationEnabled(translationEnabled);
  if (translationEnabled) initializeGoogleTranslate();
  else                    disableTranslation();
}, []);
```

The preference survives page reloads via `localStorage['translationEnabled']`.

### 3.3 Loading Google Translate — `initializeGoogleTranslate()`

This injects **two** `<script>` tags into `<head>`:

1. An **inline init script** that defines the callback Google calls when it loads:

   ```js
   function googleTranslateElementInit() {
     new google.translate.TranslateElement({
       pageLanguage: 'en',          // source language of the app
       includedLanguages: 'en,es',  // only offer English + Spanish
       layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
       autoDisplay: false           // do NOT auto-pop the Google bar
     }, 'google_translate_element'); // mount point (a hidden <div>)
   }
   ```

2. The **Google widget loader**, which calls that callback when ready:

   ```js
   apiScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
   ```

   After it loads we wait ~1s, then set `isTranslateReady = true` so the button enables.

Finally it calls `addHideStyles()` to inject the CSS that hides Google's UI (see §4).

The mount point is a deliberately hidden div rendered by the component:

```tsx
<div id="google_translate_element" style={{ display: 'none', visibility: 'hidden' }} />
```

### 3.4 Switching language — `toggleTranslation()` (the globe "ES" button)

This is the key trick. When Google's widget initializes, it creates a hidden
`<select class="goog-te-combo">` dropdown. Normally a user would pick a language from it.
Instead, **we set its value in code and dispatch a `change` event**, so Google translates the
page without the user ever seeing or touching Google's dropdown:

```tsx
const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
if (selectElement) {
  if (!isTranslationOn) {
    selectElement.value = 'es';                          // English → Spanish
    selectElement.dispatchEvent(new Event('change'));     // triggers Google's translation
    setIsTranslationOn(true);
  } else {
    selectElement.value = 'en';                          // Spanish → English
    selectElement.dispatchEvent(new Event('change'));
    setIsTranslationOn(false);
  }
}
```

**Fallback:** if the dropdown isn't present yet, it falls back to the URL-hash method that
Google also supports, then reloads:

```tsx
window.location.hash = '#googtrans(en|es)'; // forces Spanish on reload
window.location.reload();
```

### 3.5 Detecting the current language — `MutationObserver`

When Google translates a page it adds the class `translated-ltr` (or `translated-rtl`) to
`<body>`. We watch for that to keep our button's ON/OFF indicator in sync, even if the state
changed via the URL hash:

```tsx
const observer = new MutationObserver(checkTranslationState);
observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
// checkTranslationState() sets isTranslationOn based on body.classList / location.hash
```

### 3.6 Turning it all off — `disableTranslation()`

Clicking "Change Language" again disables the system completely:

- Removes both injected `<script>` tags.
- Clears `window.location.hash`.
- Removes the `translated-ltr` / `translated-rtl` classes from `<body>` and `<html>`.
- Empties the `#google_translate_element` div.
- Removes **every** leftover Google node: `document.querySelectorAll('[class*="goog-"], [id*="goog-"], iframe[class*="goog-"]')`.
- Then `window.location.reload()` to wipe any remaining translated text.

---

## 4. Hiding the "Translated by Google" watermark/banner (the CSS trick)

Google's widget injects several visible UI pieces:

- A top **banner bar** ("This page has been translated by Google…") — `.goog-te-banner-frame`, `.skiptranslate` iframe.
- The **language dropdown gadget** — `.goog-te-gadget`, `.goog-te-combo`, `.goog-te-gadget-icon`.
- A **floating "powered by Google" balloon/menu** — `.goog-te-balloon-frame`, `.goog-te-menu-frame`.
- Newer obfuscated class names like `VIpgJd-ZVi9od-ORHb-OEVmcd` (the top iframe banner).

We suppress all of them with `!important` rules so the translation appears seamless and
unbranded. The styles are applied in **two places** for reliability:

**(a) Injected at runtime** by `addHideStyles()` (only when translation is enabled), and
**(b) Always present globally** in [src/index.css](../src/index.css#L93-L130).

```css
iframe.VIpgJd-ZVi9od-ORHb-OEVmcd,   /* new Google top-banner iframe */
iframe.skiptranslate,
.VIpgJd-ZVi9od-ORHb-OEVmcd,
div.skiptranslate,
div.skiptranslate iframe,
.goog-te-banner-frame,              /* the "translated by Google" bar */
.goog-te-banner-frame.skiptranslate,
iframe.goog-te-banner-frame,
.goog-te-gadget,                    /* the dropdown gadget container */
.goog-te-combo,                     /* the <select> dropdown itself */
.goog-te-gadget-simple,
.goog-te-gadget-icon,               /* the little Google "G" icon */
.goog-te-ftab,
.goog-te-balloon-frame,             /* floating "powered by Google" balloon */
.goog-te-menu-frame {               /* the language menu popup */
  display: none !important;
  visibility: hidden !important;
  height: 0px !important;
  width: 0px !important;
  margin: 0px !important;
  padding: 0px !important;
  position: absolute !important;
  top: -9999px !important;          /* shove off-screen as a backup to display:none */
  left: -9999px !important;
  z-index: -9999 !important;
}

/* Google pushes the page down to make room for its banner — undo that */
body { top: 0 !important; margin-top: 0 !important; padding-top: 0 !important; }
html { margin-top: 0 !important; padding-top: 0 !important; }
```

**Why the `body { top: 0 }` rules matter:** Google's banner normally shifts the whole page
down by ~40px (it sets `body { top: 40px }`). Hiding the banner alone would leave an ugly gap,
so we force the page back to the top.

**Why both `display:none` *and* `top:-9999px`:** belt-and-suspenders. If a future Google class
name slips past one selector, the off-screen positioning still keeps stray pieces invisible.

---

## 5. How to change / extend it

### Add another language (e.g. French)

1. In `initializeGoogleTranslate()`, widen `includedLanguages`:
   ```js
   includedLanguages: 'en,es,fr',
   ```
2. In `toggleTranslation()`, set the desired code, e.g. `selectElement.value = 'fr';`.
   (For more than two languages you'd replace the simple ON/OFF toggle with a small menu.)

### Change the default behaviour

- To translate **automatically** on load, set `autoDisplay: true` and call the toggle after
  `isTranslateReady` becomes true.
- To translate a **different source language**, change `pageLanguage: 'en'`.

### If a new Google banner appears (Google changed their markup)

Open DevTools, inspect the stray element, copy its class/id, and add a matching selector to
**both** the `addHideStyles()` block in `LanguageToggle.tsx` *and* the block in `index.css`.

---

## 6. Gotchas & notes

- **No API key / no cost:** this is the free client-side widget. It is best-effort machine
  translation, not a paid API. Quality and availability are entirely Google's.
- **Network required:** the `translate.google.com` script must load; offline = no translation.
- **First load is slow:** there's an intentional ~1s delay (`setTimeout(... , 1000)`) before
  the button enables, to give Google time to build the hidden `<select>`.
- **The two buttons are easy to confuse:** "Change Language" = load/unload the *engine*; the
  globe "ES" = actually flip the *language*. The globe is disabled until the engine is ready.
- **Branding / ToS:** hiding Google's attribution is done purely with CSS. Be aware Google's
  widget terms generally expect the attribution to remain; this is a product/legal decision,
  not a technical one.
- **SPA caveat:** because Google rewrites the live DOM, React re-renders can occasionally
  revert some translated text; the `MutationObserver` and reload-based fallbacks exist to keep
  state consistent.
