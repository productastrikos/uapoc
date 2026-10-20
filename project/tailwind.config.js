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
        primary: {
          900: '#071028', // Background
          800: '#08203A', // Panel dark
          700: '#0A3A52', // Panel mid
          600: '#0E556A', // Panel light
          DEFAULT: '#01A3A4', // Accent teal
        },
        accent: {
          gold: '#E6B85C',
          teal: '#01A3A4',
          purple: '#A855F7',
          /* The standard button/action color going forward — a clean, calm
           * blue rather than the red/amber/purple variety that was scattered
           * across modules for no semantic reason. Red and amber stay, but
           * only for a short, deliberate list of genuinely critical/warning
           * actions; everything else routes through this one blue. */
          blue: '#3B82F6',
          blueHover: '#2563EB',
        },

        /* Everything the *model* says wears this ramp, and nothing else does.
         * Teal is a live tag, gold is a threshold, red is a fired alarm — an
         * inference is none of those, and an operator should be able to tell
         * at a glance which colour is a measurement and which is an opinion. */
        ai: {
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',
          700: '#7E22CE',
          900: '#3B0764',
        },
        text: {
          primary: '#E6EEF6',
          secondary: '#B8C5D1',
          muted: '#8A9BA8',
        },
        /* Softer, less saturated than the stock Tailwind 500-weights, and
         * picked to sit comfortably next to accent.blue instead of fighting
         * it — the brief was "blueish, not neon traffic-light colours". */
        status: {
          success: '#34D399',
          warning: '#E6B85C',
          error: '#F87171',
          info: '#3B82F6',
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
          50: '#F2F7FB',
          100: '#E6EEF6', // = text.primary
          200: '#D6E2EC',
          300: '#B8C5D1', // = text.secondary
          400: '#8A9BA8', // = text.muted
          500: '#14708A',
          600: '#0E556A', // = primary.600
          700: '#0A3A52', // = primary.700
          800: '#08203A', // = primary.800
          900: '#071028', // = primary.900
          950: '#04101F',
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
        /* A single calm teal glow over the navy base, echoing the CCMS
         * reference look, instead of three overlapping teal/gold/blue
         * blotches competing for attention. */
        'gradient-mesh': 'radial-gradient(circle at 50% 0%, rgba(1, 163, 164, 0.12) 0%, transparent 55%)',
        'runway-pattern': 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(230, 184, 92, 0.1) 10px, rgba(230, 184, 92, 0.1) 20px)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
};