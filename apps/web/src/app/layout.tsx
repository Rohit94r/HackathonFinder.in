import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import Providers from '@/components/Providers';
import ScrollEffects from '@/components/motion/ScrollEffects';
import Tracker from '@/components/analytics/Tracker';
import SpeedInsights from '@/components/analytics/SpeedInsights';
import { siteConfig } from '@/data/siteConfig';
import { JsonLd, siteJsonLd } from '@/lib/seo';
import { MOTION_KEY, THEME_KEY } from '@/lib/theme';

// Hackathon Junction type: Barlow for text, Barlow Condensed for signage headings and JetBrains Mono
// for ticket data (times, codes). Self-hosted (all SIL OFL) so a
// slow connection to Google at build time never ships the fallback fonts.
const sans = localFont({
  src: [
    { path: './fonts/barlow-400.woff2', weight: '400' },
    { path: './fonts/barlow-500.woff2', weight: '500' },
    { path: './fonts/barlow-600.woff2', weight: '600' },
    { path: './fonts/barlow-700.woff2', weight: '700' },
  ],
  variable: '--font-sans',
  display: 'swap',
});
const display = localFont({
  src: [
    { path: './fonts/barlow-condensed-500.woff2', weight: '500' },
    { path: './fonts/barlow-condensed-600.woff2', weight: '600' },
    { path: './fonts/barlow-condensed-700.woff2', weight: '700' },
    { path: './fonts/barlow-condensed-800.woff2', weight: '800' },
  ],
  variable: '--font-display',
  display: 'swap',
});
const mono = localFont({ src: './fonts/jetbrains-mono.woff2', weight: '400 700', variable: '--font-mono', display: 'swap' });

const THEME_SCRIPT = `document.documentElement.classList.add('reveal-ready');
try { if (localStorage.getItem('${THEME_KEY}') === 'dark') document.documentElement.dataset.theme = 'dark'; } catch (e) {}
try { if (localStorage.getItem('${MOTION_KEY}') === 'paused') document.documentElement.dataset.motion = 'paused'; } catch (e) {}`;

// The browser bar matches the dark station canopy; content may run under the iPhone notch and home indicator
// (the navbar and bottom bars pad themselves with the safe-area insets).
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0e0d0b',
};

const HOME_TITLE = `${siteConfig.name}: Find Hackathons Online & Near You (2026)`;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: HOME_TITLE,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    'hackathons worldwide',
    'hackathons near me',
    'upcoming hackathons',
    'hackathons 2026',
    'online hackathons',
    'hackathons for students',
    'college hackathons',
    'AI hackathons',
    'coding competitions',
    'ideathons',
    'Unstop hackathons',
    'Devfolio hackathons',
    'hackathon team finder',
  ],
  authors: [
    { name: siteConfig.founder.name, url: `${siteConfig.url}/about` },
    { name: siteConfig.coFounder.name, url: `${siteConfig.url}/about` },
  ],
  creator: siteConfig.founder.name,
  publisher: siteConfig.name,
  category: 'technology',
  // No canonical here: it would be inherited by every page. Each page sets its own (lib/seo.tsx).
  formatDetection: { email: false, telephone: false, address: false },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  openGraph: {
    title: HOME_TITLE,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME_TITLE,
    description: siteConfig.description,
  },
  // Search Console / Bing Webmaster verification codes, set in the host's environment.
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } : undefined,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" className={`${sans.variable} ${display.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* Before first paint: turn on scroll reveals, and apply dark mode only if the visitor chose it (light is the default). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <JsonLd data={siteJsonLd()} />
      </head>
      <body className="flex min-h-screen flex-col">
        <ScrollEffects />
        <Tracker />
        <SpeedInsights />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:border focus:border-line focus:bg-card focus:px-4 focus:py-2 focus:shadow-lift"
        >
          Skip to content
        </a>
        {/* The landing page (app/page.tsx) brings its own navbar and footer; every other page uses app/(site)/layout.tsx. */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
