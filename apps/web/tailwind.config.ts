import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Black: hero, navbar, footer and dark sections; also body text.
        ink: {
          DEFAULT: '#0A0A0A',
          800: '#171717',
          700: '#262626',
        },
        // Neutral greys (kept under the old name so existing classes stay monochrome).
        brand: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        // Former accent colours, now white so the theme stays black and white.
        lime: {
          DEFAULT: '#FFFFFF',
          soft: '#F0F0F0',
        },
        turquoise: '#FFFFFF',
        // Light grey page background.
        surface: '#F5F5F5',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Impact', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0, 0, 0, 0.05), 0 8px 24px rgba(0, 0, 0, 0.06)',
        lift: '0 2px 4px rgba(0, 0, 0, 0.08), 0 18px 40px rgba(0, 0, 0, 0.18)',
        glow: '0 0 0 3px rgba(255, 255, 255, 0.25), 0 12px 40px rgba(0, 0, 0, 0.45)',
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
