import * as cheerio from 'cheerio';
import type { Http } from '../http';
import { absoluteUrl, cleanLine, normalizeUrl } from '../text';

// Sitemaps and RSS/Atom feeds are the cheapest way to see a platform's or a
// college's whole event catalogue. We read robots.txt for Sitemap: lines, follow one
// level of sitemap indexes, try the common sitemap and feed paths, and keep only URLs
// that look like events. Every fetch still goes through the polite Http client, so
// robots.txt and host delays apply.

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
}

export interface ParsedSitemap {
  urls: SitemapEntry[];
  sitemaps: string[];
}

const EVENT_URL =
  /(?:^|[/_-])(?:hackathon|hackathons|hackfest|hackfestival|ideathon|buildathon|codefest|datathon|challenge|competition|contest|event|events|fest|register|apply)(?:[/_.-]|\d|$)/i;
const NON_EVENT_URL =
  /(?:^|[/_-])(?:blog|news|press|about|contact|privacy|terms|login|signin|signup|register-now|careers|jobs|support|help|faq|sponsor|speakers?|agenda|schedule|venue|tickets?|gallery|media|team|people|partners?)(?:[/_.-]|$)/i;

/** Whether a URL is worth fetching as an event or event-list page. */
export function isEventUrl(url: string): boolean {
  const clean = url.split(/[?#]/)[0];
  return EVENT_URL.test(clean) && !NON_EVENT_URL.test(clean);
}

/** Sitemap: lines from robots.txt, resolved against the origin. */
export function sitemapsInRobots(text: string, origin: string): string[] {
  const out: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*sitemap\s*:\s*(\S+)/i);
    if (!m) continue;
    const u = absoluteUrl(m[1], origin);
    if (u && !out.includes(u)) out.push(u);
  }
  return out;
}

/** URLs and child sitemap indexes in a sitemap, sitemap index, RSS or Atom document. */
export function parseSitemap(xml: string, base?: string): ParsedSitemap {
  const $ = cheerio.load(xml, { xmlMode: true });
  const urls: SitemapEntry[] = [];
  const sitemaps: string[] = [];
  const seenUrls = new Set<string>();
  const seenSitemaps = new Set<string>();
  const addUrl = (raw: string | undefined, lastmod?: string) => {
    const loc = absoluteUrl(cleanLine(raw, 2000), base);
    if (loc && !seenUrls.has(loc)) {
      seenUrls.add(loc);
      urls.push({ loc, lastmod });
    }
  };

  $('url').each((_, el) => {
    const lastmod = cleanLine($(el).find('lastmod').first().text(), 40) || undefined;
    addUrl($(el).find('loc').first().text(), lastmod);
  });
  // RSS <item><link>…</link></item> and Atom <entry><link href="…"/></entry>.
  $('item').each((_, el) => {
    const lastmod = cleanLine($(el).find('pubDate').first().text(), 40) || undefined;
    addUrl($(el).find('link').first().text(), lastmod);
  });
  $('entry').each((_, el) => {
    const alternate = $(el).find('link[rel="alternate"]');
    const link = alternate.length ? alternate.first() : $(el).find('link').first();
    const lastmod = cleanLine($(el).find('updated').first().text(), 40) || undefined;
    addUrl(link.attr('href') ?? link.text(), lastmod);
  });
  $('sitemap').each((_, el) => {
    const loc = absoluteUrl(cleanLine($(el).find('loc').first().text(), 2000), base);
    if (loc && !seenSitemaps.has(loc)) {
      seenSitemaps.add(loc);
      sitemaps.push(loc);
    }
  });
  return { urls, sitemaps };
}

async function readSitemap(http: Http, url: string): Promise<ParsedSitemap> {
  const res = await http.request(url, {
    accept: 'application/xml,text/xml,application/rss+xml,application/atom+xml,text/plain',
    allowErrorStatus: true,
    retries: 1,
    timeoutMs: 15_000,
    maxBytes: 5 * 1024 * 1024,
  });
  if (res.status >= 400 || !res.body.length) return { urls: [], sitemaps: [] };
  return parseSitemap(res.text(), res.url);
}

export interface DiscoverSitemapOptions {
  /** Total sitemap documents to read, including the robots.txt file. Defaults to 10. */
  maxSitemaps?: number;
  /** Maximum matching URLs to return. Defaults to 250. */
  maxUrls?: number;
  /** Keep only URLs this returns true for. Defaults to isEventUrl. */
  filter?: (url: string) => boolean;
  log?: (message: string) => void;
}

/**
 * Event URLs from a site's sitemaps. We try robots.txt first, then the common
 * sitemap paths. A site with no sitemap or a blocked sitemap simply returns [].
 */
export async function discoverSitemapUrls(http: Http, origin: string, opts: DiscoverSitemapOptions = {}): Promise<string[]> {
  const maxSitemaps = Math.max(1, Math.min(30, opts.maxSitemaps ?? 10));
  const maxUrls = Math.max(1, Math.min(2000, opts.maxUrls ?? 250));
  const filter = opts.filter ?? isEventUrl;
  const root = origin.replace(/\/+$/, '');
  const queue: string[] = [];
  const seenSitemaps = new Set<string>();
  const found = new Set<string>();
  let fetched = 0;

  try {
    const robots = await http.request(`${root}/robots.txt`, {
      accept: 'text/plain',
      allowErrorStatus: true,
      retries: 0,
      timeoutMs: 10_000,
      maxBytes: 512 * 1024,
    });
    if (robots.status < 400) queue.push(...sitemapsInRobots(robots.text(), root));
  } catch {
    // robots.txt is often unavailable or disallowed for bots; the fallbacks below still work.
  }

  queue.push(
    `${root}/sitemap.xml`,
    `${root}/sitemap_index.xml`,
    `${root}/sitemap-index.xml`,
    `${root}/feed`,
    `${root}/rss`,
    `${root}/feed.xml`,
    `${root}/rss.xml`
  );

  while (queue.length && fetched < maxSitemaps && found.size < maxUrls) {
    const next = queue.shift()!;
    const key = normalizeUrl(next);
    if (!key || seenSitemaps.has(key)) continue;
    seenSitemaps.add(key);
    fetched++;
    try {
      const parsed = await readSitemap(http, next);
      for (const s of parsed.sitemaps) {
        if (queue.length + fetched < maxSitemaps * 2) queue.push(s);
      }
      for (const entry of parsed.urls) {
        if (found.size >= maxUrls) break;
        if (filter(entry.loc)) found.add(entry.loc);
      }
    } catch (err) {
      opts.log?.(`sitemap: ${root}: ${(err as Error).message.slice(0, 160)}`);
    }
  }

  return [...found];
}
