import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  // Dark is the default; the toggle sets data-theme on <html> (see app/layout.tsx).
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      // The landing page's two colours, red and orange, on charcoal or white (see components/landing/landing.css).
      colors: {
        // Body text and dark sections. A CSS variable (globals.css) so it flips to light text in dark mode.
        ink: {
          DEFAULT: 'rgb(var(--hf-ink) / <alpha-value>)',
          800: 'rgb(var(--hf-ink-800) / <alpha-value>)',
          700: 'rgb(var(--hf-ink-700) / <alpha-value>)',
        },
        // Fixed charcoal for text on bright fills (orange, amber) in both themes.
        navy: '#17171d',
        // Brand red, as a scale for tints, borders and links.
        brand: {
          50: '#fff1f3',
          100: '#ffe0e5',
          200: '#ffc6cf',
          300: '#ff9aab',
          400: '#ff6b81',
          500: '#f2465f',
          600: '#ec3750',
          700: '#be1e3a',
          800: '#9b1830',
          900: '#7d142a',
        },
        // Brand red: primary buttons and highlights. White text on it.
        accent: {
          DEFAULT: '#ec3750',
          soft: '#fff1f3',
          dark: '#be1e3a',
        },
        // Brand orange: featured badges and warm accents. Charcoal text on it.
        pop: {
          DEFAULT: '#ff8c37',
          soft: '#fff4ea',
          dark: '#c2570c',
        },
        // Older accent names, kept as aliases.
        lime: {
          DEFAULT: '#ff8c37',
          soft: '#fff4ea',
        },
        turquoise: '#ec3750',
        // Page background, and the panel colour for cards, inputs and chips. Both flip in dark mode.
        surface: 'rgb(var(--hf-surface) / <alpha-value>)',
        card: 'rgb(var(--hf-card) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 2px 16px rgba(0, 0, 0, 0.08)',
        lift: '0 2px 4px rgba(23, 23, 29, 0.06), 0 18px 40px rgba(23, 23, 29, 0.16)',
        glow: '0 0 0 3px rgba(236, 55, 80, 0.3), 0 12px 40px rgba(255, 140, 55, 0.25)',
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(var(--tw-rotate))' },
          '50%': { transform: 'translateY(-10px) rotate(var(--tw-rotate))' },
        },
      },
      animation: {
        marquee: 'marquee 45s linear infinite',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
