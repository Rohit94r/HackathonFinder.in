import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  // Hover styles only on devices that can hover, so a tapped ticket or button doesn't stay "hovered" on phones.
  future: { hoverOnlyWhenSupported: true },
  // Light ("day station") is the default; the toggle sets data-theme="dark" ("night station") on <html> (see app/layout.tsx).
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      // Hackathon Junction: an Indian railway station. Ticket paper and ink, signboard yellow,
      // signal red for actions. Neutrals are CSS variables (globals.css) so they flip in dark mode.
      colors: {
        // Primary text, and the base for ink/[alpha] tints and hairlines.
        ink: {
          DEFAULT: 'rgb(var(--hf-ink) / <alpha-value>)',
          800: 'rgb(var(--hf-ink-800) / <alpha-value>)',
          700: 'rgb(var(--hf-ink-700) / <alpha-value>)',
        },
        // Secondary text.
        muted: 'rgb(var(--hf-muted) / <alpha-value>)',
        // Borders and dividers.
        line: 'rgb(var(--hf-line) / <alpha-value>)',
        // Fixed dark text for light fills (yellow boards, white badges) in both themes.
        navy: '#16130f',
        // Signal red scale for tints, borders and links.
        brand: {
          50: '#fdf0ee',
          100: '#fbdcd8',
          200: '#f6b7af',
          300: '#f08a7d',
          400: '#e65a4a',
          500: '#d93a2b',
          600: '#c8261d',
          700: '#a71e17',
          800: '#861a15',
          900: '#5f1410',
        },
        // Primary links and highlights. White text on it.
        accent: {
          DEFAULT: '#c8261d',
          soft: '#fdf0ee',
          dark: '#a71e17',
        },
        // Station signboard yellow, always with navy text on it.
        board: {
          DEFAULT: '#ffc629',
          soft: '#fff3cc',
          dark: '#e0a800',
        },
        success: { DEFAULT: '#1d7a45', soft: '#e1f3e7' },
        warning: { DEFAULT: '#a35f00', soft: '#fff0c2' },
        danger: { DEFAULT: '#c8261d', soft: '#fde3e0' },
        // White fills (badges on images), with dark text on them.
        pop: {
          DEFAULT: '#fffcf5',
          soft: '#f3eee3',
          dark: '#4a443b',
        },
        // Older accent names, kept as aliases.
        lime: {
          DEFAULT: '#ffc629',
          soft: '#fff3cc',
        },
        turquoise: '#c8261d',
        // Page background, and the surface colour for cards, inputs and menus. Both flip in dark mode.
        surface: 'rgb(var(--hf-surface) / <alpha-value>)',
        card: 'rgb(var(--hf-card) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        // Signage: condensed, for headings, numbers and boards.
        display: ['var(--font-display)', 'Arial Narrow', 'system-ui', 'sans-serif'],
        // Ticket data: times, codes, counts.
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 0 rgba(22, 19, 15, 0.04), 0 1px 3px rgba(22, 19, 15, 0.05)',
        lift: '0 1px 0 rgba(22, 19, 15, 0.04), 0 18px 40px -14px rgba(22, 19, 15, 0.28)',
        glow: '0 0 0 3px rgba(255, 198, 41, 0.45)',
        // Pressed-metal signage: a hard offset shadow.
        hard: '3px 3px 0 0 #16130f',
        'hard-sm': '2px 2px 0 0 #16130f',
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
