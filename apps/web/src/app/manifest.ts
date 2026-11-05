import type { MetadataRoute } from 'next';
import { siteConfig } from '@/data/siteConfig';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name}: every hackathon in one place`,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    lang: 'en',
    categories: ['education', 'productivity', 'social'],
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
    ],
  };
}
