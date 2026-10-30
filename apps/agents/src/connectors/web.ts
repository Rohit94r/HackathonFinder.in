import * as cheerio from 'cheerio';
import type { City } from '@hackathonfinder/shared';
import { BlockedError, RobotsDisallowedError, errorMessage } from '../errors';
import { eventToCandidate, type HtmlPage } from '../html';
import { modeFromText } from '../pipeline/normalize';
import { SEARCH_KEYS, searchProvider, type SearchResult } from '../search';
import { HACKATHON_WORDS, absoluteUrl, cleanLine, hostOf, normalizeUrl } from '../text';
import type { CandidateData, Connector, ConnectorContext, RawCandidate } from '../types';
import { QR_WORDS, datesFromText, eventTitle, leadCity, looksLikeListPage, rotatingCities, searchYears, skipHost } from './leads';
import { eventLinks, shouldCrawl } from '../discovery/crawl';
import { discoveryQueries } from '../discovery/queries';
import { sitemapSeedsForRun } from '../discovery/seeds';
import { discoverSitemapUrls, isEventUrl } from '../discovery/sitemap';

// Hackathons anywhere on the public web: college sites, event pages, community
// pages and public event catalogues. The source runs a weighted India-wide query
// matrix (cities, states, college domains and event platforms), pages
// through search results, follows event links from list pages, and reads public
// sitemaps and RSS/Atom feeds for platforms without a dedicated connector. Pages with a schema.org
// Event give dates and place directly; other pages are read with simple rules and
// the Extractor fills the gaps. Every page still goes through the polite client, so
// robots.txt, host delays and bot checks apply.

const FLAG = 'Found by web search — details not independently verified';

const PLATFORM_SOURCE: [RegExp, string][] = [
  [/\bhack2skill\.com$/i, 'hack2skill'],
  [/\bdorahacks\.io$/i, 'dorahacks'],
  [/\bkaggle\.com$/i, 'kaggle'],
  [/\bkonfhub\.com$/i, 'konfhub'],
  [/\btownscript\.com$/i, 'townscript'],
  [/\ballevents\.in$/i, 'allevents'],
  [/\bcommudle\.com$/i, 'commudle'],
  [/\btechgig\.com$/i, 'techgig'],
  [/\bmeetup\.com$/i, 'meetup'],
  [/\beventbrite\.[a-z.]+$/i, 'eventbrite'],
  [/\blu\.ma$/i, 'luma'],
];

function sourceForResult(url: string, fallback: string): string {
  const host = hostOf(url).replace(/^www\./i, '');
  return PLATFORM_SOURCE.find(([pattern]) => pattern.test(host))?.[1] ?? fallback;
}

/** Queries for this run: rotating Indian cities, nationwide results, and public event-platform pages. */
export function webQueries(now: Date, cities: City[]): { query: string; city?: City }[] {
  const [year, next] = searchYears(now);
  const out: { query: string; city?: City }[] = [];
  for (const city of cities) {
    out.push({ query: `hackathon ${city.name} ${year} registration`, city });
    out.push({ query: `${city.name} college hackathon ${year}`, city });
  }
  out.push({ query: `hackathon India ${next ?? year} registration open` });
  out.push({ query: `ideathon ${year} India registration` });
  out.push(
    { query: `site:hack2skill.com hackathon ${year} registration` },
    { query: `site:dorahacks.io hackathon ${year} registration` },
    { query: `site:kaggle.com/competitions hackathon ${year}` },
    { query: `site:eventbrite.com hackathon ${year} India registration` },
    { query: `site:lu.ma hackathon ${year} India` }
  );
  return out;
}

/** The page's own "Register" / "Apply" link, preferring forms and platform pages. */
export function registerLink(page: Pick<HtmlPage, 'html' | 'url'>): string | undefined {
  const $ = cheerio.load(page.html);
  const links: { href: string; score: number }[] = [];
  const self = page.url.split('#')[0];
  $('a[href]').each((_, el) => {
    const text = cleanLine($(el).text(), 80);
    const href = absoluteUrl($(el).attr('href'), page.url);
    if (!href || href.split('#')[0] === self || !/\b(register|registration|apply|sign ?up|participate|enrol+)\b/i.test(text)) return;
    const host = hostOf(href);
    const score = /forms\.gle|docs\.google\.com|unstop\.com|devfolio\.co|devpost\.com|hack2skill\.com|konfhub\.com|townscript\.com|allevents\.in|lu\.ma|eventbrite/.test(host) ? 2 : host === hostOf(page.url) ? 0 : 1;
    links.push({ href, score });
  });
  return links.sort((a, b) => b.score - a.score)[0]?.href;
}

/** Candidates from one result page: its schema.org events, or the page itself when it is about one hackathon. */
export function pageCandidates(page: HtmlPage, opts: { now: Date; city?: City; listingSource: string }): RawCandidate[] {
  const out: RawCandidate[] = [];
  for (const ev of page.events.slice(0, 12)) {
    const c = eventToCandidate(ev, page.url);
    if (!c || !HACKATHON_WORDS.test(`${c.title}\n${(c.text ?? '').slice(0, 3000)}`)) continue;
    c.data = { ...c.data, imageUrl: c.data.imageUrl ?? page.meta.image, listingSource: opts.listingSource, flags: [FLAG] };
    c.imageUrls = [...new Set([...c.imageUrls, ...(page.meta.image ? [page.meta.image] : [])])].slice(0, 3);
    out.push(c);
  }
  if (out.length) return out;

  const title = cleanLine(page.meta.title, 140);
  if (!title || !HACKATHON_WORDS.test(title) || looksLikeListPage(title)) return [];
  const text = page.text.slice(0, 20_000);
  const dates = datesFromText(`${page.meta.description ?? ''}\n${text}`, opts.now);
  const city = leadCity(`${title}\n${text.slice(0, 5000)}`, opts.city);
  const link = registerLink(page);
  const qr = QR_WORDS.test(text) && !link;
  const flags = [FLAG];
  if (qr) flags.push('The page says to scan a QR code to register — check where it leads');
  const data: CandidateData = {
    title,
    organizer: cleanLine(page.meta.siteName, 140) || undefined,
    mode: modeFromText(`${title}\n${text}`) ?? (city ? 'offline' : undefined),
    city,
    country: city ? 'India' : undefined,
    startDate: dates.start?.toISOString(),
    endDate: dates.end?.toISOString(),
    registrationDeadline: dates.deadline?.toISOString(),
    imageUrl: page.meta.image,
    registrationUrl: link ?? page.meta.canonical ?? page.url,
    registrationVia: qr ? 'qr' : 'link',
    listingSource: opts.listingSource,
    flags,
  };
  return [{ url: page.url, title, text: [title, page.meta.description ?? '', text].join('\n\n'), data, imageUrls: page.meta.image ? [page.meta.image] : [] }];
}

/**
 * A search result's title + snippet as a lead. This catches event pages that are
 * JavaScript apps or otherwise return no readable HTML: the snippet often still
 * has the event name and dates, and the Extractor can fill the rest.
 */
export function snippetCandidate(r: SearchResult, opts: { now: Date; city?: City; listingSource: string }): RawCandidate | null {
  const full = `${r.title}\n${r.snippet}`;
  if (!HACKATHON_WORDS.test(full)) return null;
  const title = eventTitle(r.title);
  if (!title || !HACKATHON_WORDS.test(title) || looksLikeListPage(title)) return null;
  const dates = datesFromText(full, opts.now);
  if (!dates.start) return null;
  const city = leadCity(full, opts.city);
  const data: CandidateData = {
    title,
    mode: modeFromText(full) ?? (city ? 'offline' : undefined),
    city,
    country: city ? 'India' : undefined,
    startDate: dates.start.toISOString(),
    endDate: dates.end?.toISOString(),
    registrationDeadline: dates.deadline?.toISOString(),
    imageUrl: r.image,
    registrationUrl: r.url,
    listingSource: opts.listingSource,
    flags: [FLAG],
  };
  return { url: r.url, title, text: full, data, imageUrls: r.image ? [r.image] : [] };
}

function resultScore(r: SearchResult, city?: City): number {
  const text = `${r.title} ${r.snippet}`;
  let score = 0;
  if (HACKATHON_WORDS.test(text)) score += 6;
  if (/\b(20\d\d|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(text)) score += 2;
  if (/\/(?:hack|hackathon|event|fest|competition|challenge|register|apply)/i.test(r.url)) score += 2;
  if (city && new RegExp(`\\b${city.name.split(' ')[0]}\\b`, 'i').test(text)) score += 1;
  return score;
}

interface CrawlResult {
  candidates: RawCandidate[];
  pages: number;
}

/** Follow event-looking links from a list page, up to `depth` hops. */
async function crawlFromPage(
  ctx: ConnectorContext,
  start: HtmlPage,
  opts: { now: Date; city?: City; listingSource: string; depth: number; maxPages: number; maxLinks: number; limit: number; seen?: Set<string> }
): Promise<CrawlResult> {
  const candidates: RawCandidate[] = [];
  const seen = opts.seen ?? new Set<string>();
  const startKey = normalizeUrl(start.url);
  if (startKey) seen.add(startKey);
  const queue: { page: HtmlPage; depth: number }[] = [{ page: start, depth: 0 }];
  let pages = 0;

  while (queue.length && pages < opts.maxPages && candidates.length < opts.limit) {
    const item = queue.shift()!;
    if (item.depth >= opts.depth) continue;
    for (const link of eventLinks(item.page, { limit: opts.maxLinks, sameHostOnly: true })) {
      if (pages >= opts.maxPages || candidates.length >= opts.limit) break;
      const key = normalizeUrl(link);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      pages++;
      ctx.log(`web: crawl ${pages}/${opts.maxPages} — ${hostOf(link)}`);
      ctx.progress?.(`Web search: crawling page ${pages}/${opts.maxPages}`);
      try {
        const page = await ctx.http.fetchHtml(link, { timeoutMs: 15_000, maxBytes: 3 * 1024 * 1024 });
        const found = pageCandidates(page, { now: opts.now, city: opts.city, listingSource: opts.listingSource });
        candidates.push(...found);
        if (found.length) ctx.log(`web: crawl ${pages} — ${found.length} event${found.length === 1 ? '' : 's'} on ${hostOf(link)}`);
        if (item.depth + 1 < opts.depth && shouldCrawl(page)) queue.push({ page, depth: item.depth + 1 });
      } catch (err) {
        if (err instanceof RobotsDisallowedError) ctx.log(`web: ${hostOf(link)} disallows crawling; skipped`);
        else ctx.log(`web: skipped ${hostOf(link)} (${errorMessage(err)})`);
      }
    }
  }
  return { candidates, pages };
}

function intOption(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : fallback;
}

export const web: Connector = {
  slug: 'web',
  name: 'Web search',
  kind: 'search',
  defaultSchedule: '0 2,14 * * *',
  description:
    'India-wide deep web discovery: a weighted query matrix for cities, states, college domains and event platforms; search-result paging; one-hop crawling from list pages; and public sitemaps/RSS feeds for platforms without a dedicated connector. Google Custom Search, Brave, SearXNG or DuckDuckGo; every page goes through robots.txt and the polite client.',
  optionalEnv: SEARCH_KEYS,
  trust: 0.5,
  extract: 'always',
  defaultConfig: {
    deep: true,
    citiesPerRun: 6,
    maxQueries: 48,
    searchPages: 1,
    maxPages: 90,
    crawlDepth: 1,
    maxCrawlPages: 30,
    maxLinksPerPage: 20,
    sitemaps: true,
    sitemapSeeds: 6,
    maxSitemapUrls: 120,
    maxSitemapPages: 30,
    snippets: true,
    // Add any public page or list page here (Source.config.seedUrls) to crawl it
    // on every deep run. Add extra search queries (Source.config.extraQueries) too.
    seedUrls: [],
    extraQueries: [],
  },
  async fetch(ctx: ConnectorContext): Promise<RawCandidate[]> {
    const cfg = ctx.source.config ?? {};
    const deep = cfg.deep !== false;
    const perRun = intOption(cfg.citiesPerRun, deep ? 6 : 4, 1, 14);
    const maxQueries = intOption(cfg.maxQueries, deep ? 48 : 24, 1, 200);
    const searchPages = intOption(cfg.searchPages, 1, 1, 3);
    const maxPages = intOption(cfg.maxPages, deep ? 90 : 30, 1, 400);
    const crawlDepth = intOption(cfg.crawlDepth, deep ? 1 : 0, 0, 2);
    const maxCrawlPages = intOption(cfg.maxCrawlPages, deep ? 30 : 0, 0, 150);
    const maxLinksPerPage = intOption(cfg.maxLinksPerPage, 20, 1, 100);
    const sitemaps = cfg.sitemaps !== false;
    const sitemapSeeds = intOption(cfg.sitemapSeeds, deep ? 6 : 0, 0, 10);
    const maxSitemapUrls = intOption(cfg.maxSitemapUrls, deep ? 120 : 0, 0, 500);
    const maxSitemapPages = intOption(cfg.maxSitemapPages, deep ? 30 : 0, 0, 200);
    const snippets = cfg.snippets !== false;

    const listOption = (value: unknown, splitCommas = true): string[] => {
      const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(splitCommas ? /[\n,]+/ : /\n+/) : [];
      return raw.map((v) => (typeof v === 'string' ? v.trim() : '')).filter(Boolean).slice(0, 50);
    };
    const extraQueries = listOption(cfg.extraQueries, false).slice(0, 25);
    const seedUrls = listOption(cfg.seedUrls)
      .map((u) => absoluteUrl(u))
      .filter((u): u is string => Boolean(u))
      .slice(0, 25);

    const provider = searchProvider(ctx.http, ctx.env);
    const queries = [
      ...extraQueries.map((query) => ({ query, kind: 'india' as const, weight: 200, city: undefined })),
      ...discoveryQueries(ctx.now, { cities: rotatingCities(ctx.now, perRun), max: maxQueries, deep }),
    ];
    const say = (line: string) => ctx.progress?.(line);

    const plannedSitemaps = sitemaps ? sitemapSeeds : 0;
    ctx.log(`web: ${deep ? 'deep scan' : 'scan'} — ${queries.length} queries, ${perRun} cities, ${plannedSitemaps} sitemap seeds, ${maxPages} page budget`);
    say('Web search: starting');

    // 1. Search. Results are collected first, then visited best-first, so one
    //    high-value query cannot starve the rest of the matrix.
    const results: { r: SearchResult; city?: City }[] = [];
    const seenResults = new Set<string>();
    let searched = 0;
    let failures = 0;
    let searchBlocked: BlockedError | undefined;

    search: for (let qi = 0; qi < queries.length; qi++) {
      const q = queries[qi];
      if (results.length >= maxPages * 4) {
        ctx.log(`web: result cap reached (${results.length}); stopping search`);
        break;
      }
      ctx.log(`web: search ${qi + 1}/${queries.length} — ${q.query}`);
      say(`Web search: query ${qi + 1}/${queries.length}`);
      let querySearched = false;
      for (let page = 0; page < searchPages; page++) {
        try {
          const list = await provider.search(q.query, { page });
          failures = 0;
          querySearched = true;
          for (const r of list) {
            const key = normalizeUrl(r.url);
            if (!key || seenResults.has(key) || skipHost(r.url)) continue;
            seenResults.add(key);
            results.push({ r, city: q.city });
          }
          ctx.log(`web: search ${qi + 1}/${queries.length}${searchPages > 1 ? ` page ${page + 1}` : ''} → ${list.length} results (${results.length} kept)`);
          if (list.length < 8) break;
        } catch (err) {
          failures++;
          if (err instanceof BlockedError) {
            searchBlocked = err;
            ctx.warn(`web: search stopped (${errorMessage(err)})`);
            break search;
          }
          ctx.warn(`web: search failed for "${q.query.slice(0, 80)}" (${errorMessage(err)})`);
          if (failures >= 3) break search;
          break;
        }
      }
      if (querySearched) searched++;
    }
    ctx.log(`web: search finished — ${searched}/${queries.length} queries, ${results.length} results`);
    say(`Web search: reading ${results.length} result pages`);

    results.sort((a, b) => resultScore(b.r, b.city) - resultScore(a.r, a.city));
    // Admin-supplied seed pages go first; they are the strongest signal that a
    // particular college, community or event platform should be read.
    for (const url of seedUrls.reverse()) results.unshift({ r: { url, title: '', snippet: '' } });

    // 2. Visit the best result pages. List pages get one hop of event-link
    //    crawling; JS-only pages fall back to their search snippet.
    const out: RawCandidate[] = [];
    const seenCandidates = new Set<string>();
    const visitedPages = new Set<string>();
    const add = (list: RawCandidate[]) => {
      for (const c of list) {
        if (out.length >= ctx.limit) break;
        const key = normalizeUrl(c.url);
        if (!key || seenCandidates.has(key)) continue;
        seenCandidates.add(key);
        out.push(c);
      }
    };

    let pages = 0;
    let crawlPages = 0;
    for (const { r, city } of results) {
      if (pages >= maxPages || out.length >= ctx.limit) break;
      const key = normalizeUrl(r.url);
      if (!key || visitedPages.has(key)) continue;
      visitedPages.add(key);
      const listingSource = sourceForResult(r.url, provider.listingSource);
      let page: HtmlPage | undefined;
      pages++;
      ctx.log(`web: page ${pages}/${maxPages} — ${hostOf(r.url)}${city ? ` (${city.name})` : ''}`);
      say(`Web search: page ${pages}/${maxPages}`);
      try {
        page = await ctx.http.fetchHtml(r.url, { timeoutMs: 15_000, maxBytes: 3 * 1024 * 1024 });
      } catch (err) {
        if (err instanceof RobotsDisallowedError) ctx.log(`web: ${hostOf(r.url)} disallows crawling; skipped`);
        else ctx.log(`web: skipped ${hostOf(r.url)} (${errorMessage(err)})`);
      }

      if (!page) {
        if (snippets) {
          const s = snippetCandidate(r, { now: ctx.now, city, listingSource });
          if (s) {
            add([s]);
            ctx.log(`web: snippet fallback — ${s.title}`);
          }
        }
        continue;
      }

      let candidates = pageCandidates(page, { now: ctx.now, city, listingSource });
      if (crawlDepth > 0 && shouldCrawl(page)) {
        const crawled = await crawlFromPage(ctx, page, {
          now: ctx.now,
          city,
          listingSource,
          depth: crawlDepth,
          maxPages: Math.min(maxCrawlPages, maxPages - pages),
          maxLinks: maxLinksPerPage,
          limit: ctx.limit - out.length,
          seen: visitedPages,
        });
        candidates = [...candidates, ...crawled.candidates];
        crawlPages += crawled.pages;
        pages += crawled.pages;
        ctx.log(`web: list page ${hostOf(page.url)} → ${crawled.candidates.length} leads from ${crawled.pages} crawled pages`);
      }
      if (!candidates.length && snippets) {
        const s = snippetCandidate(r, { now: ctx.now, city, listingSource });
        if (s) {
          candidates = [s];
          ctx.log(`web: snippet fallback — ${s.title}`);
        }
      }
      if (candidates.length) ctx.log(`web: ${candidates.length} event${candidates.length === 1 ? '' : 's'} on ${hostOf(page.url)}`);
      add(candidates);
    }

    // 3. Public sitemaps and RSS/Atom feeds for platforms without a dedicated connector. A feed
    //    is a cheap way to find events that search has not indexed yet.
    let sitemapPages = 0;
    if (sitemaps && sitemapSeeds > 0 && maxSitemapUrls > 0 && maxSitemapPages > 0 && out.length < ctx.limit) {
      for (const seed of sitemapSeedsForRun(ctx.now, sitemapSeeds)) {
        if (sitemapPages >= maxSitemapPages || out.length >= ctx.limit) break;
        let urls: string[] = [];
        ctx.log(`web: sitemap ${seed.name} — reading sitemaps/RSS`);
        say(`Web search: sitemap ${seed.name}`);
        try {
          urls = await discoverSitemapUrls(ctx.http, seed.origin, {
            maxSitemaps: 8,
            maxUrls: maxSitemapUrls,
            filter: seed.filter ?? isEventUrl,
            log: (message) => ctx.log(`web: ${message}`),
          });
        } catch (err) {
          ctx.log(`web: ${seed.name} sitemap skipped (${errorMessage(err)})`);
          continue;
        }
        ctx.log(`web: sitemap ${seed.name} → ${urls.length} event URLs`);
        for (const url of urls) {
          if (sitemapPages >= maxSitemapPages || out.length >= ctx.limit) break;
          const key = normalizeUrl(url);
          if (!key || visitedPages.has(key) || skipHost(url)) continue;
          visitedPages.add(key);
          sitemapPages++;
          ctx.log(`web: sitemap page ${sitemapPages}/${maxSitemapPages} — ${hostOf(url)}`);
          say(`Web search: sitemap page ${sitemapPages}/${maxSitemapPages}`);
          try {
            const page = await ctx.http.fetchHtml(url, { timeoutMs: 15_000, maxBytes: 3 * 1024 * 1024 });
            const found = pageCandidates(page, { now: ctx.now, listingSource: seed.source });
            add(found);
            if (found.length) ctx.log(`web: sitemap page ${sitemapPages} — ${found.length} event${found.length === 1 ? '' : 's'}`);
          } catch (err) {
            if (err instanceof RobotsDisallowedError) ctx.log(`web: ${hostOf(url)} disallows crawling; skipped`);
            else ctx.log(`web: skipped ${hostOf(url)} (${errorMessage(err)})`);
          }
        }
      }
    }

    // A search challenge no longer hides sitemap/seed discovery. If those found
    // nothing either, the source is genuinely blocked and the run records it.
    if (searchBlocked && out.length === 0) throw searchBlocked;

    ctx.log(
      `web: ${out.length} events from ${pages} search/crawl pages (${crawlPages} crawled) and ${sitemapPages} sitemap pages (${searched}/${queries.length} ${provider.id} searches, ${results.length} results)`
    );
    return out.slice(0, ctx.limit);
  },
};
