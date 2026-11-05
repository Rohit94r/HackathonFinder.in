import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  // Light is the default; the toggle sets data-theme="dark" on <html> (see app/layout.tsx).
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      // One accent (indigo #635BFF) on cool neutrals. Neutrals are CSS variables (globals.css) so they flip in dark mode.
      colors: {
        // Primary text, and the base for ink/[alpha] tints and hairlines.
        ink: {
          DEFAULT: 'rgb(var(--hf-ink) / <alpha-value>)',
          800: 'rgb(var(--hf-ink-800) / <alpha-value>)',
          700: 'rgb(var(--hf-ink-700) / <alpha-value>)',
        },
        // Secondary text (#686D7D in light mode).
        muted: 'rgb(var(--hf-muted) / <alpha-value>)',
        // Borders and dividers (#E8EAF0 in light mode).
        line: 'rgb(var(--hf-line) / <alpha-value>)',
        // Fixed dark text for light fills in both themes.
        navy: '#171923',
        // Accent scale for tints, borders and links.
        brand: {
          50: '#eeefff',
          100: '#e0e1ff',
          200: '#c7c8ff',
          300: '#a5a3ff',
          400: '#8580ff',
          500: '#7069ff',
          600: '#635bff',
          700: '#5047e5',
          800: '#4038b8',
          900: '#332d8f',
        },
        // Primary buttons, links and highlights. White text on it.
        accent: {
          DEFAULT: '#635bff',
          soft: '#eeefff',
          dark: '#5047e5',
        },
        success: { DEFAULT: '#15803d', soft: '#dcfce7' },
        warning: { DEFAULT: '#b45309', soft: '#fef3c7' },
        danger: { DEFAULT: '#dc2626', soft: '#fee2e2' },
        // White fills (badges on images), with dark text on them.
        pop: {
          DEFAULT: '#ffffff',
          soft: '#f4f5f8',
          dark: '#52525b',
        },
        // Older accent names, kept as aliases.
        lime: {
          DEFAULT: '#ffffff',
          soft: '#f4f5f8',
        },
        turquoise: '#635bff',
        // Page background, and the surface colour for cards, inputs and menus. Both flip in dark mode.
        surface: 'rgb(var(--hf-surface) / <alpha-value>)',
        card: 'rgb(var(--hf-card) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        // Headings use the same family; kept as a name so older markup still resolves.
        display: ['var(--font-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(23, 25, 35, 0.04)',
        lift: '0 1px 2px rgba(23, 25, 35, 0.04), 0 12px 32px -8px rgba(23, 25, 35, 0.12)',
        glow: '0 0 0 3px rgba(99, 91, 255, 0.18)',
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        marquee: 'marquee 45s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
