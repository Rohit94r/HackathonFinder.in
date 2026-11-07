import * as cheerio from 'cheerio';
import { parseDate } from '../dates';
import { eventToCandidate, type HtmlPage } from '../html';
import { HACKATHON_WORDS, absoluteUrl, cleanLine, hostOf } from '../text';
import type { CandidateData, Connector, ConnectorContext, RawCandidate } from '../types';
import { datesFromText } from './leads';
import { arr, firstImage, int, isObj, str, url, type Obj } from './util';

// KnowAFest lists college fests and hackathons across India. Its event search has a
// public JSON API (robots.txt allows everything), and each event page carries a
// schema.org Event with dates, venue, organizer and the poster, plus a link to the
// organizer's own registration form, which becomes our registration link.

const API = 'https://www.knowafest.com/api/events';
const MAX_PAGES = 8;

/** "₹2,099" → 2099, "Free entry" → 0, "Paid" → paid with no amount. */
export function knowafestFee(label: unknown): { fee?: number; isPaid?: boolean } {
  const s = cleanLine(typeof label === 'string' ? label : '', 40);
  if (!s) return {};
  if (/free/i.test(s)) return { fee: 0, isPaid: false };
  const m = s.match(/(?:₹|rs\.?|inr)\s*([\d,]+)/i);
  if (m) return { fee: Number(m[1].replace(/,/g, '')), isPaid: true };
  return /paid/i.test(s) ? { isPaid: true } : {};
}

/** One row of the search API. Workshops and fests that aren't hackathon-style are left out. */
export function knowafestCandidate(e: Obj): RawCandidate | null {
  const title = cleanLine(str(e.full_title) ?? str(e.title), 140).replace(/^\((.+?)\)\s*-\s*/, '$1 - ');
  const page = url(e.url);
  if (!title || !page || !/^https:\/\/www\.knowafest\.com\/event\/[a-z0-9-]+$/i.test(page)) return null;
  if (String(e.category ?? '') !== 'Hackathons' && !HACKATHON_WORDS.test(title)) return null;
  // Talks about hackathons (webinars, FDPs) are filed under the category too.
  if (/\b(webinar|seminar|conference|symposium|fdp|faculty development|guest lecture)\b/i.test(title)) return null;
  if (e.past === true) return null;
  const mode = /online/i.test(String(e.mode)) ? 'online' : /hybrid/i.test(String(e.mode)) ? 'hybrid' : 'offline';
  const org = isObj(e.organization) ? e.organization : {};
  const start = parseDate(str(e.date, 40), { kind: 'start' });
  const fee = knowafestFee(e.price_label);
  const data: CandidateData = {
    title,
    organizer: cleanLine(str(org.name), 140) || undefined,
    mode,
    city: mode === 'online' ? undefined : cleanLine(str(e.city) ?? str(e.location), 80) || undefined,
    country: 'India',
    startDate: start?.toISOString(),
    ...fee,
    imageUrl: firstImage(e.thumbnail_url),
    registrationUrl: page,
  };
  return { externalId: str(e.id, 20), url: page, title, text: title, data, imageUrls: data.imageUrl ? [data.imageUrl] : [] };
}

/** The organizer's own registration link on an event page ("Register on organizer site ↗"), else its website. */
export function organizerLink(page: Pick<HtmlPage, 'html' | 'url'>): string | undefined {
  const $ = cheerio.load(page.html);
  let register: string | undefined;
  let website: string | undefined;
  $('a[href]').each((_, el) => {
    const href = absoluteUrl($(el).attr('href'), page.url);
    if (!href || hostOf(href) === 'knowafest.com') return;
    const text = cleanLine($(el).text(), 120);
    if (!register && /regist|apply|sign ?up/i.test(text)) register = href;
    else if (!website && /official (event )?website|event website|visit website/i.test(text)) website = href;
  });
  return register ?? website;
}

/** Adds the event page's schema.org details, the description's deadline and the registration link. */
export function knowafestApplyPage(c: RawCandidate, page: HtmlPage, now: Date): RawCandidate {
  const ev = page.events[0];
  const fromLd = ev ? eventToCandidate(ev, page.url) : null;
  const text = fromLd?.text ?? page.text.slice(0, 20_000);
  const d = fromLd?.data ?? {};
  const textDates = datesFromText(text, now);
  const poster = firstImage(d.imageUrl, page.meta.image, c.data.imageUrl);
  const data: CandidateData = {
    ...c.data,
    title: c.data.title,
    organizer: c.data.organizer ?? d.organizer,
    mode: d.mode ?? c.data.mode,
    venue: d.venue,
    address: d.address,
    city: d.city ?? c.data.city,
    region: ev && isObj(ev.location) && isObj(ev.location.address) ? cleanLine(str(ev.location.address.addressRegion), 80) || undefined : undefined,
    country: d.country ?? c.data.country,
    startDate: d.startDate ?? c.data.startDate,
    endDate: d.endDate ?? c.data.endDate,
    registrationDeadline: textDates.deadline?.toISOString() ?? c.data.registrationDeadline,
    imageUrl: poster,
    registrationUrl: organizerLink(page) ?? c.data.registrationUrl,
  };
  if (data.mode === 'online') {
    data.city = undefined;
    data.venue = undefined;
    data.address = undefined;
  }
  return { ...c, text: [c.title, text].join('\n\n'), data, imageUrls: [...new Set([poster, ...c.imageUrls].filter((u): u is string => Boolean(u)))].slice(0, 3) };
}

export const knowafest: Connector = {
  slug: 'knowafest',
  name: 'KnowAFest',
  kind: 'events',
  defaultSchedule: '0 2,8,14,20 * * *',
  description: 'College hackathons across India from KnowAFest’s public event search, with posters and the organizer’s registration form.',
  trust: 0.8,
  extract: 'missing',
  complete: true,
  async fetch(ctx: ConnectorContext): Promise<RawCandidate[]> {
    const out: RawCandidate[] = [];
    const seen = new Set<string>();
    let last = 1;
    for (let page = 1; page <= Math.min(last, MAX_PAGES); page++) {
      const json = await ctx.http.fetchJson<{ data?: unknown[]; meta?: { last_page?: number } }>(`${API}?category=Hackathons&country=all&event_status=upcoming&page=${page}`);
      last = int(json?.meta?.last_page, 1, 100) ?? 1;
      const rows = arr(json?.data).filter(isObj);
      for (const row of rows) {
        const c = knowafestCandidate(row);
        if (c && !seen.has(c.url)) {
          seen.add(c.url);
          out.push(c);
        }
        if (out.length >= ctx.limit) return out;
      }
      if (!rows.length) break;
    }
    ctx.log(`knowafest: ${out.length} upcoming hackathons`);
    return out;
  },
  async detail(c: RawCandidate, ctx: ConnectorContext): Promise<RawCandidate> {
    const page = await ctx.http.fetchHtml(c.url);
    return knowafestApplyPage(c, page, ctx.now);
  },
};
