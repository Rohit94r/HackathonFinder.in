import type { Metadata } from 'next';
import { Figtree, Young_Serif } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import ScrollEffects from '@/components/motion/ScrollEffects';
import Tracker from '@/components/analytics/Tracker';
import { siteConfig } from '@/data/siteConfig';
import { THEME_KEY } from '@/lib/theme';

// Same pair as the landing page: Figtree for text, Young Serif for headings.
const sans = Figtree({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const display = Young_Serif({ weight: '400', subsets: ['latin'], variable: '--font-display', display: 'swap' });

const THEME_SCRIPT = `document.documentElement.classList.add('reveal-ready');
try { if (localStorage.getItem('${THEME_KEY}') === 'light') document.documentElement.dataset.theme = 'light'; } catch (e) {}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name}: find every hackathon in one place`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    title: `${siteConfig.name}: find every hackathon in one place`,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        {/* Before first paint: turn on scroll reveals, and apply light mode only if the visitor chose it (dark is the default). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <ScrollEffects />
        <Tracker />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-card focus:px-4 focus:py-2 focus:shadow-lift"
        >
          Skip to content
        </a>
        {/* The landing page (app/page.tsx) brings its own navbar and footer; every other page uses app/(site)/layout.tsx. */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
