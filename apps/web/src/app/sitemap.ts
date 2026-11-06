import type { MetadataRoute } from 'next';
import { connectDb, isDbConfigured, Thread, Win } from '@hackathonfinder/db';
import { CITIES, THEMES } from '@hackathonfinder/shared';
import { blogPosts, postIsoDate } from '@/data/blogData';
import { newsIsoDate, newsPosts } from '@/data/newsData';
import { abs } from '@/lib/seo';
import { getHackathons } from '@/server/hackathons';

/** Rebuilt at most once an hour; new listings arrive with the twice-daily scrape. */
export const revalidate = 3600;

/**
 * The last time the hand-written pages changed. A fixed date is more useful to
 * crawlers than stamping every static page with the current time on each request.
 */
const SITE_UPDATED = new Date('2026-11-06T00:00:00+05:30');

type Entry = MetadataRoute.Sitemap[number];

const STATIC: { path: string; priority: number; changeFrequency: Entry['changeFrequency'] }[] = [
  { path: '/', priority: 1, changeFrequency: 'daily' },
  { path: '/hackathons', priority: 0.95, changeFrequency: 'daily' },
  { path: '/near-me', priority: 0.9, changeFrequency: 'daily' },
  { path: '/cities', priority: 0.85, changeFrequency: 'daily' },
  { path: '/calendar', priority: 0.8, changeFrequency: 'daily' },
  { path: '/teams', priority: 0.75, changeFrequency: 'daily' },
  { path: '/community', priority: 0.7, changeFrequency: 'daily' },
  { path: '/wins', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/blog', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/news', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/how-it-works', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/organizers', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/submit', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/privacy', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.2, changeFrequency: 'yearly' },
];

/** Every public page search engines should know about. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    ...STATIC.map((s) => ({ url: abs(s.path), lastModified: SITE_UPDATED, changeFrequency: s.changeFrequency, priority: s.priority })),
    ...CITIES.map((c) => ({ url: abs(`/cities/${c.slug}`), lastModified: SITE_UPDATED, changeFrequency: 'daily' as const, priority: 0.8 })),
    ...THEMES.map((t) => ({ url: abs(`/themes/${t.slug}`), lastModified: SITE_UPDATED, changeFrequency: 'daily' as const, priority: 0.75 })),
    ...blogPosts.map((p) => ({ url: abs(`/blog/${p.slug}`), lastModified: postIsoDate(p.updated ?? p.date), changeFrequency: 'monthly' as const, priority: 0.7 })),
    ...newsPosts.map((p) => ({ url: abs(`/news/${p.slug}`), lastModified: newsIsoDate(p.updated ?? p.date), changeFrequency: 'monthly' as const, priority: 0.65 })),
  ];

  if (!isDbConfigured()) return entries;
  try {
    const { items } = await getHackathons(now);
    // Some events are listed twice from two scrape runs. Keep the shortest slug for each
    // registration URL, matching the canonical the detail pages use, and skip finished events
    // (they are noindexed on the page itself).
    const canonical = new Map<string, string>();
    for (const h of items) {
      const key = h.registrationUrl || h.slug;
      const current = canonical.get(key);
      if (!current || h.slug.length < current.length) canonical.set(key, h.slug);
    }
    for (const h of items) {
      if (h.status === 'completed') continue;
      if (canonical.get(h.registrationUrl || h.slug) !== h.slug) continue;
      entries.push({ url: abs(`/hackathons/${h.slug}`), lastModified: h.lastChecked || h.addedAt, changeFrequency: 'daily', priority: 0.85 });
    }
    await connectDb();
    const [wins, threads] = await Promise.all([
      Win.find({ deletedAt: null }).select('slug createdAt').sort({ createdAt: -1 }).limit(5000).lean(),
      Thread.find({ deletedAt: null }).select('slug updatedAt').sort({ updatedAt: -1 }).limit(5000).lean(),
    ]);
    for (const w of wins) entries.push({ url: abs(`/wins/${w.slug}`), lastModified: w.createdAt, changeFrequency: 'monthly', priority: 0.5 });
    for (const t of threads) entries.push({ url: abs(`/community/${t.slug}`), lastModified: t.updatedAt, changeFrequency: 'weekly', priority: 0.4 });
  } catch (err) {
    // A database hiccup still serves the static part rather than a broken sitemap.
    console.error('[sitemap] Could not list database pages:', err);
  }
  return entries;
}
