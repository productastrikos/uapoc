/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      /* ---------------------------------------------------------------------
       * Type scale, enlarged for control-room use.
       *
       * These screens are read on wall displays and on laptops the operators
       * drive at 67-75% browser zoom to fit a whole console in view. At 67%
       * Tailwind's stock `text-xs` lands at ~8 CSS px, which is unreadable, so
       * the whole scale is rebuilt rather than patched per component.
       *
       * The working sizes (xs-xl), where every label, KPI caption and table
       * cell lives, are a straight 1.5x. The display sizes taper — a 1.5x
       * `text-3xl` heading would push the header and every modal title out of
       * its row without making anything easier to read.
       *
       * Arbitrary sizes (`text-[10px]` and friends) were swept by the same
       * 1.5x factor in the components themselves; they cannot be reached from
       * here because Tailwind emits them literally.
       * ------------------------------------------------------------------ */
      fontSize: {
        xs: ['calc(0.75rem*var(--fs))', { lineHeight: 'calc(1rem*var(--fs))' }],
        sm: ['calc(0.875rem*var(--fs))', { lineHeight: 'calc(1.25rem*var(--fs))' }],
        base: ['calc(1rem*var(--fs))', { lineHeight: 'calc(1.5rem*var(--fs))' }],
        lg: ['calc(1.125rem*var(--fs))', { lineHeight: 'calc(1.75rem*var(--fs))' }],
        xl: ['calc(1.25rem*var(--fs))', { lineHeight: 'calc(1.75rem*var(--fs))' }],
        // Display sizes taper. A heading is already legible at 67% zoom; scaled
        // at the full factor it only steals rows from the content under it.
        '2xl': ['calc(1.5rem*var(--fs)*0.92)', { lineHeight: 'calc(2rem*var(--fs)*0.92)' }],
        '3xl': ['calc(1.875rem*var(--fs)*0.86)', { lineHeight: 'calc(2.25rem*var(--fs)*0.86)' }],
        '4xl': ['calc(2.25rem*var(--fs)*0.82)', { lineHeight: 'calc(2.5rem*var(--fs)*0.82)' }],
        '5xl': ['calc(3rem*var(--fs)*0.78)', { lineHeight: '1' }],
        '6xl': ['calc(3.75rem*var(--fs)*0.75)', { lineHeight: '1' }],
        '7xl': ['calc(4.5rem*var(--fs)*0.72)', { lineHeight: '1' }],
      },
      colors: {
        /* The whole-platform revamp palette — ten exact hexes the user chose
         * (#2078CF..#C1E8FF), ordered dark-to-light and mapped onto the
         * existing primary/accent/text roles so every component that already
         * reads `primary-800`, `accent-blue`, `text-primary` etc. picks up
         * the new look with no call-site changes. */
        primary: {
          900: 'rgb(var(--c-primary-900) / <alpha-value>)', // Page background — near-black navy
          800: 'rgb(var(--c-primary-800) / <alpha-value>)', // Panel background
          700: 'rgb(var(--c-primary-700) / <alpha-value>)', // Panel mid / hover
          600: 'rgb(var(--c-primary-600) / <alpha-value>)', // Panel light / active border
          /* `primary-500` is referenced by 28 components (mostly as a border
           * tint) but was never defined in this ramp — every one of those
           * classes was silently failing to generate and falling back to the
           * browser's default grey/black border. This is almost certainly a
           * chunk of the "random grey borders" the user kept finding that no
           * white/grey-literal grep ever caught. One step lighter than 600,
           * one step darker than the accent, so it reads as "a brighter
           * panel edge" rather than a second accent color. */
          500: 'rgb(var(--c-primary-500) / <alpha-value>)',
          DEFAULT: 'rgb(var(--c-primary) / <alpha-value>)', // Accent blue
        },
        accent: {
          gold: 'rgb(var(--c-accent-gold) / <alpha-value>)',
          teal: 'rgb(var(--c-accent-teal) / <alpha-value>)',
          purple: 'rgb(var(--c-accent-purple) / <alpha-value>)',
          /* The one accent color for every button/active-state/highlight in
           * the app. Hover is the next step down the palette (deeper, not
           * lighter) so a press reads as "pushed in". */
          blue: 'rgb(var(--c-accent-blue) / <alpha-value>)',
          blueHover: 'rgb(var(--c-accent-blueHover) / <alpha-value>)',
          /* The palette's lightest step — glow text, standout numbers, a
           * bright edge on a glass card. Used sparingly; it is a highlight,
           * not a body-text color. */
          glow: 'rgb(var(--c-accent-glow) / <alpha-value>)',
        },

        /* Everything the *model* says wears this ramp, and nothing else does.
         * Teal is a live tag, gold is a threshold, red is a fired alarm — an
         * inference is none of those, and an operator should be able to tell
         * at a glance which colour is a measurement and which is an opinion. */
        ai: {
          200: 'rgb(var(--c-ai-200) / <alpha-value>)',
          300: 'rgb(var(--c-ai-300) / <alpha-value>)',
          400: 'rgb(var(--c-ai-400) / <alpha-value>)',
          500: 'rgb(var(--c-ai-500) / <alpha-value>)',
          600: 'rgb(var(--c-ai-600) / <alpha-value>)',
          700: 'rgb(var(--c-ai-700) / <alpha-value>)',
          900: 'rgb(var(--c-ai-900) / <alpha-value>)',
        },
        /* Blue-tinted instead of neutral grey-white — small, but it's the
         * difference between "dark theme" and "blue platform throughout",
         * which was the explicit ask. */
        text: {
          primary: 'rgb(var(--c-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--c-text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--c-text-muted) / <alpha-value>)',
        },
        /* A specific 5-color set the user chose, replacing the generic
         * traffic-light red/green/yellow. Every status.* reference across
         * the app routes through this one block, so this single edit
         * recolors every severity badge/bar/dot in the product at once.
         *   success      — general "good / operational" reading
         *   successDark  — a deeper tone for a filled/active success state
         *   warning      — unchanged role, just the given gold
         *   error        — general "critical / fault" reading
         *   errorBright  — an engaged/active danger state (e.g. an alarm
         *                  that has actually fired), one step more urgent
         *                  than the idle `error` tone */
        status: {
          success: '#0C6B37', // Deep Green
          successDark: '#094A25', // Dark Forest Green
          warning: '#F8B324', // Golden Yellow
          error: '#BC2023', // Dark Red
          errorBright: '#EB442C', // Orange Red
          info: '#3B82F6',
          /* The default "nothing's wrong" reading — operational, normal,
           * resolved-and-done, idle-good. Red/green/yellow are now reserved
           * for a state that actually demands attention (a fired alarm, an
           * active threshold breach, a live critical incident); everything
           * that used to paint itself green just because it was fine uses
           * this instead, so the traffic-light colors stay rare and meaningful
           * and the rest of the UI reads as "calm blue platform." */
          neutral: '#7DA0CA',
        },

        /* ------------------------------------------------------------------
         * Simulation palettes (used only by src/simulations/**).
         * These are full 50-950 ramps derived from the TAMS brand colours so
         * the ported AirOps simulation screens can keep their original
         * light/dark shading while rendering in the UPOC/TAMS look.
         *   sim      -> neutral surfaces + text (replaces Tailwind `slate`)
         *   simteal  -> primary accent        (replaces `blue`/`indigo`/`cyan`)
         *   simgold  -> secondary accent      (replaces `orange`/`amber`/`purple`)
         * ------------------------------------------------------------------ */
        sim: {
          50: 'rgb(var(--c-sim-50) / <alpha-value>)',
          100: 'rgb(var(--c-sim-100) / <alpha-value>)', // = text.primary
          200: 'rgb(var(--c-sim-200) / <alpha-value>)',
          300: 'rgb(var(--c-sim-300) / <alpha-value>)', // = text.secondary
          400: 'rgb(var(--c-sim-400) / <alpha-value>)', // = text.muted
          500: 'rgb(var(--c-sim-500) / <alpha-value>)',
          600: 'rgb(var(--c-sim-600) / <alpha-value>)', // = primary.600
          700: 'rgb(var(--c-sim-700) / <alpha-value>)', // = primary.700
          800: 'rgb(var(--c-sim-800) / <alpha-value>)', // = primary.800
          900: 'rgb(var(--c-sim-900) / <alpha-value>)', // = primary.900
          950: 'rgb(var(--c-sim-950) / <alpha-value>)',
        },
        simteal: {
          50: '#E6FAFA',
          100: '#C7F4F2',
          200: '#9BEAE8',
          300: '#5FDCDA',
          400: '#22C7C6',
          500: '#01A3A4', // = accent.teal
          600: '#018587',
          700: '#016E70',
          800: '#045055',
          900: '#03383E',
          950: '#02282E',
        },
        simgold: {
          50: '#FEF9EF',
          100: '#FCF3E2',
          200: '#F9E9C9',
          300: '#F5DCA8',
          400: '#EFCB82',
          500: '#E6B85C', // = accent.gold
          600: '#C09429',
          700: '#96701D',
          800: '#6B4E15',
          900: '#4A360F',
          950: '#2B1F08',
        },
      },
      backgroundImage: {
        /* "Glassmorphism at peak" means the glass has to have something
         * vivid to show through it — a flat navy backdrop makes even a
         * well-built frosted panel read as just a dark grey box. This is
         * four overlapping glows at real strength (not a 10% hint) sitting
         * behind every glass surface in the app, still entirely inside the
         * given blue palette (#2078CF/#0E4EB2/#5483B3 + the page's own near-
         * black base) so it reads as "dramatic blue light," not noise. */
        'gradient-mesh': 'radial-gradient(circle at 12% 15%, rgba(32, 120, 207, 0.55) 0%, transparent 48%), radial-gradient(circle at 88% 12%, rgba(14, 78, 178, 0.5) 0%, transparent 46%), radial-gradient(circle at 50% 95%, rgba(84, 131, 179, 0.4) 0%, transparent 50%), radial-gradient(circle at 95% 85%, rgba(32, 120, 207, 0.35) 0%, transparent 42%)',
        'runway-pattern': 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(230, 184, 92, 0.1) 10px, rgba(230, 184, 92, 0.1) 20px)',
        /* A faint grain, the one texture every reference board shared — it
         * keeps a flat navy panel from looking like a solid color swatch. */
        'grain': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")",
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-up': 'fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 0px rgba(32, 120, 207, 0)' },
          '50%': { boxShadow: '0 0 24px rgba(32, 120, 207, 0.35)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      }
    },
  },
  plugins: [],
};