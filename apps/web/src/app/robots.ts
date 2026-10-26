import type { MetadataRoute } from 'next';
import { abs } from '@/lib/seo';

// Signed-in and utility pages: nothing there for search results.
const PRIVATE = ['/admin', '/api/', '/go/', '/settings', '/messages', '/notifications', '/saved', '/profile', '/login', '/signup', '/forgot-password', '/reset-password'];

// AI search and answer engines are welcome: being cited by ChatGPT, Perplexity, Claude,
// Gemini and Copilot sends students here. Listed by name so the choice is explicit.
const AI_CRAWLERS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Perplexity-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'Google-Extended', 'Applebot-Extended', 'Bingbot', 'CCBot'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE },
      { userAgent: AI_CRAWLERS, allow: '/', disallow: PRIVATE },
    ],
    sitemap: abs('/sitemap.xml'),
    host: abs('/'),
  };
}
