import * as cheerio from 'cheerio';
import type { City } from '@hackathonfinder/shared';
import { BlockedError, RobotsDisallowedError, errorMessage } from '../errors';
import { eventToCandidate, type HtmlPage } from '../html';
import { modeFromText } from '../pipeline/normalize';
import { SEARCH_KEYS, searchProvider, type SearchResult } from '../search';
import { HACKATHON_WORDS, absoluteUrl, cleanLine, hostOf, normalizeUrl } from '../text';
import type { CandidateData, Connector, ConnectorContext, RawCandidate } from '../types';
import { QR_WORDS, datesFromText, leadCity, looksLikeListPage, rotatingCities, searchYears, skipHost } from './leads';

// Hackathons anywhere on the web: college sites, event pages, community pages. We
// search (Google Custom Search with keys, DuckDuckGo without), then visit each
// result page through the polite client, so its robots.txt decides. Pages with a
// schema.org Event give dates and place directly; other pages are read with simple
// rules. Complete candidates are published automatically, with any review flags retained.

const MAX_PAGES = 24;
const FLAG = 'Found by web search — details not independently verified';

const PLATFORM_SOURCE: [RegExp, string][] = [
  [/\bhack2skill\.com$/i, 'hack2skill'],
  [/\bdorahacks\.io$/i, 'dorahacks'],
  [/\bkaggle\.com$/i, 'kaggle'],
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
  for (const ev of page.events.slice(0, 3)) {
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

export const web: Connector = {
  slug: 'web',
  name: 'Web search',
  kind: 'search',
  defaultSchedule: '0 2,14 * * *',
  description:
    'Searches the web for hackathons in our cities and public event platforms (Google Custom Search or Brave Search when configured, DuckDuckGo otherwise), then reads pages allowed by robots.txt.',
  optionalEnv: SEARCH_KEYS,
  trust: 0.5,
  extract: 'always',
  async fetch(ctx: ConnectorContext): Promise<RawCandidate[]> {
    const provider = searchProvider(ctx.http, ctx.env);
    const perRun = Number(ctx.source.config.citiesPerRun) || 3;
    const results: { r: SearchResult; city?: City }[] = [];
    const seen = new Set<string>();
    let searched = 0;
    for (const { query, city } of webQueries(ctx.now, rotatingCities(ctx.now, perRun))) {
      try {
        for (const r of await provider.search(query)) {
          const key = normalizeUrl(r.url);
          if (!key || seen.has(key) || skipHost(r.url)) continue;
          seen.add(key);
          results.push({ r, city });
        }
        searched++;
      } catch (err) {
        if (err instanceof BlockedError && !searched) throw err;
        ctx.warn(`web: search stopped (${errorMessage(err)})`);
        break;
      }
    }
    // Pages whose result text talks about a hackathon first.
    results.sort((a, b) => Number(HACKATHON_WORDS.test(`${b.r.title} ${b.r.snippet}`)) - Number(HACKATHON_WORDS.test(`${a.r.title} ${a.r.snippet}`)));
    const out: RawCandidate[] = [];
    let visited = 0;
    for (const { r, city } of results) {
      if (visited >= MAX_PAGES || out.length >= ctx.limit) break;
      if (!HACKATHON_WORDS.test(`${r.title} ${r.snippet}`)) continue;
      visited++;
      try {
        const page = await ctx.http.fetchHtml(r.url, { timeoutMs: 15_000, maxBytes: 3 * 1024 * 1024 });
        out.push(...pageCandidates(page, { now: ctx.now, city, listingSource: sourceForResult(r.url, provider.listingSource) }));
      } catch (err) {
        // Dead or slow result pages are normal for web search; they don't make the run partial.
        if (err instanceof RobotsDisallowedError) ctx.log(`web: ${hostOf(r.url)} disallows crawling; skipped`);
        else ctx.log(`web: skipped ${hostOf(r.url)} (${errorMessage(err)})`);
      }
    }
    ctx.log(`web: ${out.length} events from ${visited} pages (${searched} ${provider.id} searches)`);
    return out.slice(0, ctx.limit);
  },
};
