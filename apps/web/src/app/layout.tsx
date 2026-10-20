import type { Metadata } from 'next';
import './globals.css';
import CookieBanner from '@/components/CookieBanner';
import { siteConfig } from '@/data/siteConfig';

export const metadata: Metadata = {
  title: `${siteConfig.name} - ${siteConfig.tagline}`,
  description: siteConfig.description,
  openGraph: {
    title: siteConfig.name,
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://cdn.prod.website-files.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://assets-global.website-files.com" />
      </head>
      <body>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
