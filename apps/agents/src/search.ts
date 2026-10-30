import * as cheerio from 'cheerio';
import { BlockedError } from './errors';
import type { Http } from './http';
import { absoluteUrl, cleanLine } from './text';

// Web search for the search and social connectors. With GOOGLE_CSE_KEY and
// GOOGLE_CSE_CX set we use Google's official Custom Search API; with
// BRAVE_SEARCH_API_KEY Brave's official API; with SEARXNG_URL a SearXNG instance's
// JSON API. Without any of them we use DuckDuckGo's HTML endpoint, which its
// robots.txt allows. DuckDuckGo often answers crawlers with a challenge page; we
// stop at the first one instead of retrying or getting around it. All providers can
// page, so a deep run can look past the first ten results.

export interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  /** Preview image when the engine gives one (Google's pagemap). */
  image?: string;
}

export interface SearchProvider {
  /** "google", "brave", "searxng" or "duckduckgo". */
  id: string;
  /** SOURCES slug for listings found through it: "google" for Google, "web" otherwise. */
  listingSource: string;
  official: boolean;
  /** Page 0 is the first page; providers that support paging use it for deeper discovery. */
  search(query: string, opts?: { page?: number }): Promise<SearchResult[]>;
}

const DDG = 'https://html.duckduckgo.com/html/';
/** Seconds between two DuckDuckGo queries. */
export const DDG_DELAY_MS = 8000;

/** The real target of a DuckDuckGo result link ("//duckduckgo.com/l/?uddg=<url>"). */
export function ddgTarget(href: string | undefined): string | undefined {
  if (!href) return undefined;
  const abs = absoluteUrl(href, 'https://duckduckgo.com/');
  if (!abs) return undefined;
  try {
    const u = new URL(abs);
    if (/(^|\.)duckduckgo\.com$/.test(u.hostname) && u.pathname === '/l/') return absoluteUrl(u.searchParams.get('uddg') ?? undefined);
    if (/(^|\.)duckduckgo\.com$/.test(u.hostname)) return undefined;
    return abs;
  } catch {
    return undefined;
  }
}

/** Organic results from a DuckDuckGo HTML page (ads skipped). */
export function parseDdg(html: string): SearchResult[] {
  if (/anomaly-modal|bots use DuckDuckGo/i.test(html)) throw new BlockedError('duckduckgo.com: search challenge page (anomaly check). We stop instead of solving it.');
  const $ = cheerio.load(html);
  const out: SearchResult[] = [];
  $('.result').each((_, el) => {
    const r = $(el);
    if (r.hasClass('result--ad') || r.find('.badge--ad').length) return;
    const a = r.find('a.result__a').first();
    const target = ddgTarget(a.attr('href'));
    if (!target) return;
    out.push({ url: target, title: cleanLine(a.text(), 200), snippet: cleanLine(r.find('.result__snippet').text(), 600) });
  });
  return out;
}

/** Per run (Http client): the challenge message once DuckDuckGo showed one, and the query queue. */
const ddgBlocked = new WeakMap<Http, string>();
const ddgQueue = new WeakMap<Http, Promise<unknown>>();

export function duckDuckGo(http: Http): SearchProvider {
  http.setHostDelay('html.duckduckgo.com', DDG_DELAY_MS);
  const one = async (query: string, page = 0): Promise<SearchResult[]> => {
    const blocked = ddgBlocked.get(http);
    if (blocked) throw new BlockedError(blocked);
    try {
      // kl=in-en: results for India, in English. s=30,60… pages the HTML endpoint.
      const start = Math.max(0, page) * 30;
      const res = await http.request(`${DDG}?q=${encodeURIComponent(query)}&kl=in-en${start ? `&s=${start}` : ''}`, { accept: 'text/html', retries: 1 });
      return parseDdg(res.text());
    } catch (err) {
      if (err instanceof BlockedError) ddgBlocked.set(http, err.message);
      throw err;
    }
  };
  return {
    id: 'duckduckgo',
    listingSource: 'web',
    official: false,
    // Queries from all connectors wait for each other, so after one challenge page no other query is sent.
    search(query, opts) {
      const run = (ddgQueue.get(http) ?? Promise.resolve()).then(() => one(query, opts?.page ?? 0));
      ddgQueue.set(
        http,
        run.catch(() => undefined)
      );
      return run;
    },
  };
}

interface BraveResult {
  url?: string;
  title?: string;
  description?: string;
  thumbnail?: { src?: string; original?: string };
}

export function parseBrave(json: { web?: { results?: BraveResult[] } }): SearchResult[] {
  return (json.web?.results ?? [])
    .map((r) => ({ url: absoluteUrl(r.url) ?? '', title: cleanLine(r.title, 200), snippet: cleanLine(r.description, 600), image: absoluteUrl(r.thumbnail?.original) }))
    .filter((r) => r.url);
}

/** Brave Search's official API (BRAVE_SEARCH_API_KEY). */
export function braveSearch(http: Http, env: NodeJS.ProcessEnv): SearchProvider | null {
  const key = env.BRAVE_SEARCH_API_KEY;
  if (!key) return null;
  http.setHostDelay('api.search.brave.com', 1100);
  return {
    id: 'brave',
    listingSource: 'web',
    official: true,
    async search(query, opts) {
      const q = new URLSearchParams({ q: query, country: 'IN', count: '20', offset: String(Math.min(9, Math.max(0, opts?.page ?? 0))), freshness: 'py' });
      const json = await http.fetchJson<{ web?: { results?: BraveResult[] } }>(`https://api.search.brave.com/res/v1/web/search?${q}`, {
        officialApi: true,
        retries: 1,
        headers: { 'x-subscription-token': key },
      });
      return parseBrave(json);
    },
  };
}

interface CseItem {
  link?: string;
  title?: string;
  snippet?: string;
  pagemap?: { cse_image?: { src?: string }[]; metatags?: Record<string, string>[] };
}

export function parseCse(json: { items?: CseItem[] }): SearchResult[] {
  return (json.items ?? [])
    .map((i) => ({
      url: absoluteUrl(i.link) ?? '',
      title: cleanLine(i.title, 200),
      snippet: cleanLine(i.snippet, 600),
      image: absoluteUrl(i.pagemap?.metatags?.[0]?.['og:image'] ?? i.pagemap?.cse_image?.[0]?.src),
    }))
    .filter((r) => r.url);
}

export function googleCse(http: Http, env: NodeJS.ProcessEnv): SearchProvider | null {
  const key = env.GOOGLE_CSE_KEY;
  const cx = env.GOOGLE_CSE_CX;
  if (!key || !cx) return null;
  return {
    id: 'google',
    listingSource: 'google',
    official: true,
    async search(query, opts) {
      const q = new URLSearchParams({ key, cx, q: query, num: '10', start: String(1 + Math.max(0, opts?.page ?? 0) * 10), gl: 'in', dateRestrict: 'y1' });
      const json = await http.fetchJson<{ items?: CseItem[] }>(`https://www.googleapis.com/customsearch/v1?${q}`, { officialApi: true, retries: 1 });
      return parseCse(json);
    },
  };
}

interface SearxResult {
  url?: string;
  title?: string;
  content?: string;
  img_src?: string;
  thumbnail?: string;
}

/** Results from a SearXNG instance's JSON API (self-hosted or an allowed public instance). */
export function parseSearxng(json: { results?: SearxResult[] }): SearchResult[] {
  return (json.results ?? [])
    .map((r) => ({
      url: absoluteUrl(r.url) ?? '',
      title: cleanLine(r.title, 200),
      snippet: cleanLine(r.content, 600),
      image: absoluteUrl(r.img_src ?? r.thumbnail),
    }))
    .filter((r) => r.url);
}

/**
 * A SearXNG meta-search instance (SEARXNG_URL). It can search Google, Bing, Brave,
 * DuckDuckGo and others from one endpoint, which is useful when the free official
 * APIs run out. Only point this at an instance that allows automated queries.
 */
export function searxng(http: Http, env: NodeJS.ProcessEnv): SearchProvider | null {
  const raw = env.SEARXNG_URL?.trim();
  if (!raw) return null;
  let base: string;
  try {
    const u = new URL(raw);
    if (!/^https?:$/.test(u.protocol)) return null;
    base = u.toString().replace(/\/+$/, '');
  } catch {
    return null;
  }
  http.setHostDelay(new URL(base).hostname, 1200);
  return {
    id: 'searxng',
    listingSource: 'web',
    official: true,
    async search(query, opts) {
      const q = new URLSearchParams({
        q: query,
        format: 'json',
        language: 'en-IN',
        safesearch: '0',
        pageno: String(Math.max(0, opts?.page ?? 0) + 1),
      });
      const json = await http.fetchJson<{ results?: SearxResult[] }>(`${base}/search?${q}`, { officialApi: true, retries: 1 });
      return parseSearxng(json);
    },
  };
}

/** Keys that switch search to an official API (any one provider is enough). */
export const SEARCH_KEYS = ['GOOGLE_CSE_KEY', 'GOOGLE_CSE_CX', 'BRAVE_SEARCH_API_KEY', 'SEARXNG_URL'];

/** Google when its keys are set, then Brave, then SearXNG, else DuckDuckGo. */
export function searchProvider(http: Http, env: NodeJS.ProcessEnv): SearchProvider {
  return googleCse(http, env) ?? braveSearch(http, env) ?? searxng(http, env) ?? duckDuckGo(http);
}
