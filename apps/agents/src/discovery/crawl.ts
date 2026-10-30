import * as cheerio from 'cheerio';
import type { HtmlPage } from '../html';
import { HACKATHON_WORDS, absoluteUrl, cleanLine, hostOf, normalizeUrl } from '../text';
import { looksLikeListPage } from '../connectors/leads';

// One-hop (optionally two-hop) crawling from a listing page. A search result often
// lands on "hackathons at XYZ fest" or a college's event index, not on the event
// itself. These helpers find the event-looking links on that page and decide
// whether following them is worth it.

const EVENT_TERMS =
  /\b(hackathon|hackfest|ideathon|buildathon|codefest|datathon|challenge|competition|contest|event|fest|register|registration|apply|participate)\b/i;
const BAD_LINK =
  /\b(login|sign ?in|sign ?up|privacy|terms|contact|about|blog|news|press|careers|jobs|support|help|faq|sponsor|speakers?|agenda|schedule|venue|tickets?|gallery|media|code of conduct|rules)\b/i;
const BAD_HOST =
  /(^|\.)(instagram\.com|facebook\.com|fb\.com|linkedin\.com|twitter\.com|x\.com|youtube\.com|youtu\.be|reddit\.com|quora\.com|wikipedia\.org|github\.com|t\.me|whatsapp\.com|google\.com|duckduckgo\.com|play\.google\.com|apps\.apple\.com)$/i;
const BAD_FILE = /\.(?:pdf|jpe?g|png|gif|webp|svg|zip|rar|mp4|mov|mp3|docx?|xlsx?|pptx?)(?:[?#]|$)/i;

export interface EventLinkOptions {
  /** Follow only links on the page's host. Defaults to true. */
  sameHostOnly?: boolean;
  /** Maximum links to return. Defaults to 30. */
  limit?: number;
  /** Extra hosts to follow when sameHostOnly is false. */
  allowHosts?: string[];
}

/** Event-looking links on a page, best first. */
export function eventLinks(page: Pick<HtmlPage, 'html' | 'url'>, opts: EventLinkOptions = {}): string[] {
  const sameHostOnly = opts.sameHostOnly !== false;
  const limit = Math.max(1, Math.min(100, opts.limit ?? 30));
  const baseHost = hostOf(page.url);
  const self = normalizeUrl(page.url);
  const allowed = new Set((opts.allowHosts ?? []).map((h) => h.toLowerCase().replace(/^www\./, '')));
  const $ = cheerio.load(page.html);
  const scored: { href: string; score: number }[] = [];

  $('a[href]').each((_, el) => {
    const href = absoluteUrl($(el).attr('href'), page.url);
    if (!href || BAD_FILE.test(href)) return;
    const key = normalizeUrl(href);
    if (!key || key === self) return;
    const host = hostOf(href);
    if (!host || BAD_HOST.test(host)) return;
    if (sameHostOnly && host !== baseHost) return;
    if (!sameHostOnly && host !== baseHost && !allowed.has(host)) return;

    const text = cleanLine(`${$(el).text()} ${$(el).attr('title') ?? ''} ${$(el).attr('aria-label') ?? ''}`, 200);
    const haystack = `${text} ${href}`;
    if (!EVENT_TERMS.test(haystack)) return;
    if (BAD_LINK.test(text) && !HACKATHON_WORDS.test(text)) return;

    let score = 0;
    if (HACKATHON_WORDS.test(text)) score += 8;
    if (HACKATHON_WORDS.test(href)) score += 5;
    if (EVENT_TERMS.test(text)) score += 2;
    if (/\/(?:hack|hackathon|event|fest|competition|challenge|register|apply)/i.test(href)) score += 3;
    if (/\b20\d\d\b/.test(text)) score += 1;
    scored.push({ href, score });
  });

  const seen = new Set<string>();
  return scored
    .sort((a, b) => b.score - a.score)
    .filter(({ href }) => {
      const key = normalizeUrl(href);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit)
    .map((x) => x.href);
}

/**
 * Whether a page is likely to be a list/round-up rather than one event: its title
 * says so, it has several schema.org events, or it links to several event pages.
 */
export function shouldCrawl(page: Pick<HtmlPage, 'html' | 'url' | 'events' | 'meta'>): boolean {
  if (looksLikeListPage(page.meta.title ?? '')) return true;
  if (page.events.length > 1) return true;
  return eventLinks(page, { limit: 5 }).length >= 3;
}
