import type { Config } from 'tailwindcss';

/**
 * HackathonFinder design system.
 *
 * One idea: red and white, with warm neutrals for structure. No decorative art,
 * no second typeface, no colour noise. Everything here is meant to be reused by
 * the public site, account pages and admin.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  // The public site is light. Dark values stay available for the admin area and
  // for anyone who explicitly sets data-theme="dark" on <html>.
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Text. Flips to white in dark mode, set from globals.css.
        ink: {
          DEFAULT: 'rgb(var(--hf-ink) / <alpha-value>)',
          800: 'rgb(var(--hf-ink-800) / <alpha-value>)',
          700: 'rgb(var(--hf-ink-700) / <alpha-value>)',
        },
        // Fixed near-black for text on white fills in both themes.
        navy: '#101014',
        // Brand red, as a scale for tints, borders and links.
        brand: {
          50: '#fff1f2',
          100: '#ffe1e3',
          200: '#ffc7cb',
          300: '#ff9da5',
          400: '#f96a78',
          500: '#ee3d4f',
          600: '#e11d2e',
          700: '#be1224',
          800: '#9c1120',
          900: '#7f1220',
        },
        // Primary red: buttons, links, highlights. White text on it.
        accent: {
          DEFAULT: '#e11d2e',
          soft: '#fff1f2',
          dark: '#be1224',
        },
        // The second colour: white. Kept as an alias so older markup still reads.
        pop: {
          DEFAULT: '#ffffff',
          soft: '#f4f4f5',
          dark: '#52525b',
        },
        lime: {
          DEFAULT: '#ffffff',
          soft: '#f4f4f5',
        },
        turquoise: '#e11d2e',
        // Page background and panel/card background. Both flip in dark mode.
        surface: 'rgb(var(--hf-surface) / <alpha-value>)',
        card: 'rgb(var(--hf-card) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 16, 20, 0.04), 0 10px 30px -18px rgba(16, 16, 20, 0.18)',
        lift: '0 2px 4px rgba(16, 16, 20, 0.05), 0 24px 48px -20px rgba(16, 16, 20, 0.28)',
        glow: '0 0 0 4px rgba(225, 29, 46, 0.12), 0 12px 30px -12px rgba(225, 29, 46, 0.35)',
        inset: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.45', transform: 'scale(0.82)' },
        },
      },
      animation: {
        marquee: 'marquee 45s linear infinite',
        float: 'float 7s ease-in-out infinite',
        'fade-up': 'fadeUp 0.65s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        'pulse-dot': 'pulseDot 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
