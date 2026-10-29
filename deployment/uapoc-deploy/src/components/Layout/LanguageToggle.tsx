import React, { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * LanguageToggle — invisible Google Translate integration.
 *
 * Clicking the globe switches the whole page between English and Spanish using
 * Google's free client-side website-translation widget (no API key, no backend).
 * Every Google UI element (banner, dropdown, "powered by Google" branding) is
 * hidden with CSS so the translation looks native.
 * See GOOGLE_TRANSLATE_GUIDE.md for the full explanation.
 *
 * How the language is driven:
 *   - We translate by setting Google's hidden <select class="goog-te-combo">
 *     and firing a `change` event (the reliable in-page mechanism). We poll for
 *     that select to appear instead of guessing a fixed delay.
 *   - We persist the choice in the `googtrans` cookie so it survives reloads,
 *     and re-apply it on mount. No URL hash is ever used (`#googtrans(...)`).
 */

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: any;
  }
}

const STYLE_ID = 'google-translate-hide-styles';
const API_SCRIPT_ID = 'google-translate-api';
const SPANISH_COOKIE = '/en/es';

// --- googtrans cookie helpers (persisted target language; no URL hash) -------
const readGoogTrans = (): string | null => {
  const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
};

const writeGoogTrans = (value: string | null) => {
  // Write/clear across the bare path, the host, and the dot-host so it sticks
  // regardless of how the app is served (localhost, IP, real domain).
  const host = window.location.hostname;
  const scopes = ['', `;domain=${host}`, `;domain=.${host}`];
  const body =
    value === null
      ? 'googtrans=;expires=Thu, 01 Jan 1970 00:00:00 GMT'
      : `googtrans=${value}`;
  scopes.forEach((scope) => {
    document.cookie = `${body};path=/${scope}`;
  });
};

// --- Find / wait for Google's hidden language <select> -----------------------
const findCombo = () =>
  document.querySelector('.goog-te-combo') as HTMLSelectElement | null;

const whenComboReady = (
  cb: (combo: HTMLSelectElement) => void,
  tries = 100 // ~15s at 150ms — generous for slow connections / first click
) => {
  const combo = findCombo();
  if (combo) {
    cb(combo);
    return;
  }
  if (tries <= 0) return;
  window.setTimeout(() => whenComboReady(cb, tries - 1), 150);
};

// Switch language by driving Google's hidden <select>.
const applyLanguage = (lang: 'en' | 'es') => {
  whenComboReady((combo) => {
    combo.value = lang;
    combo.dispatchEvent(new Event('change'));
  });
};

// --- Inject the CSS that hides every Google UI element / banner --------------
const addHideStyles = () => {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    iframe.VIpgJd-ZVi9od-ORHb-OEVmcd,
    iframe.skiptranslate,
    .VIpgJd-ZVi9od-ORHb-OEVmcd,
    div.skiptranslate,
    div.skiptranslate iframe,
    .goog-te-banner-frame,
    .goog-te-banner-frame.skiptranslate,
    iframe.goog-te-banner-frame,
    .goog-te-gadget,
    .goog-te-combo,
    .goog-te-gadget-simple,
    .goog-te-gadget-icon,
    .goog-te-ftab,
    .goog-te-balloon-frame,
    .goog-te-menu-frame {
      display: none !important;
      visibility: hidden !important;
      height: 0px !important;
      width: 0px !important;
      margin: 0px !important;
      padding: 0px !important;
      position: absolute !important;
      top: -9999px !important;
      left: -9999px !important;
      z-index: -9999 !important;
    }
    body { top: 0 !important; margin-top: 0 !important; padding-top: 0 !important; }
    html { margin-top: 0 !important; padding-top: 0 !important; }
  `;
  document.head.appendChild(style);
};

// --- Load Google Translate (injects the loader + init callback) --------------
const initializeGoogleTranslate = () => {
  addHideStyles();

  // Already loaded? nothing to do.
  if (window.google?.translate || document.getElementById(API_SCRIPT_ID)) return;

  window.googleTranslateElementInit = () => {
    // NOTE: we deliberately do NOT pass `layout: SIMPLE`. The simple layout
    // renders a link-style gadget with no <select>, which leaves us nothing to
    // drive. The default layout renders `<select class="goog-te-combo">`, which
    // we set programmatically (and hide with CSS) to switch EN <-> ES live.
    // eslint-disable-next-line new-cap
    new window.google.translate.TranslateElement(
      {
        pageLanguage: 'en',
        includedLanguages: 'en,es',
        autoDisplay: false,
      },
      'google_translate_element'
    );
  };

  const apiScript = document.createElement('script');
  apiScript.id = API_SCRIPT_ID;
  apiScript.src =
    '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  apiScript.async = true;
  document.body.appendChild(apiScript);
};

const LanguageToggle: React.FC = () => {
  // is the page currently showing Spanish (persisted in the googtrans cookie)
  const [isSpanish, setIsSpanish] = useState(false);

  useEffect(() => {
    // Strip any leftover `#googtrans(...)` hash from the URL (older versions
    // used it). Keep path + query, drop the hash without a reload.
    if (window.location.hash.toLowerCase().includes('googtrans')) {
      window.history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search
      );
    }

    // Always load the widget so toggling is instant.
    initializeGoogleTranslate();

    // Restore the saved choice: if Spanish, re-apply once the widget is ready.
    const spanish = readGoogTrans() === SPANISH_COOKIE;
    setIsSpanish(spanish);
    if (spanish) applyLanguage('es');
  }, []);

  // Toggle EN <-> ES in place — persist in the cookie, drive the hidden select.
  const handleToggle = () => {
    const next = !isSpanish;
    writeGoogTrans(next ? SPANISH_COOKIE : null);
    applyLanguage(next ? 'es' : 'en');
    setIsSpanish(next);
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleToggle}
        title={isSpanish ? 'Switch to English' : 'Translate page to Spanish'}
        className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-primary-700 hover:bg-primary-600 rounded-lg transition-all duration-300 border border-accent-blue/20"
        style={{
          boxShadow:
            '0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(96,165,250,0.12)',
        }}
      >
        <Globe className="h-4 w-4 text-text-primary" />
        {/* notranslate keeps Google from rewriting our own label */}
        <span
          className="notranslate text-sm text-text-primary font-medium"
          translate="no"
        >
          {isSpanish ? 'Spanish' : 'English'}
        </span>
      </motion.button>

      {/* Hidden mount point Google Translate renders its widget into. */}
      <div
        id="google_translate_element"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </>
  );
};

export default LanguageToggle;
