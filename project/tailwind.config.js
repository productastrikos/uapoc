/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
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
        },
        text: {
          primary: '#E6EEF6',
          secondary: '#B8C5D1',
          muted: '#8A9BA8',
        },
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
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
        'gradient-mesh': 'radial-gradient(circle at 20% 50%, rgba(1, 163, 164, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(230, 184, 92, 0.2) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(14, 85, 106, 0.4) 0%, transparent 50%)',
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