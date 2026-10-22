import * as cheerio from 'cheerio';
import { htmlToText } from '@hackathonfinder/ai';
import type { Mode } from '@hackathonfinder/shared';
import type { CandidateData, RawCandidate } from './types';
import { absoluteUrl, cleanLine, decodeEntities } from './text';

export interface PageMeta {
  title?: string;
  description?: string;
  image?: string;
  canonical?: string;
  siteName?: string;
}

export interface HtmlPage {
  url: string;
  status: number;
  html: string;
  /** Readable text of the page body. */
  text: string;
  meta: PageMeta;
  /** Every JSON-LD block on the page, parsed. */
  jsonLd: unknown[];
  /** schema.org Event / EducationEvent / Hackathon objects found in the JSON-LD. */
  events: Record<string, unknown>[];
}

type Obj = Record<string, unknown>;

const EVENT_TYPES = new Set(['event', 'educationevent', 'hackathon']);

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const toArray = (v: unknown): unknown[] => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]);
const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : typeof v === 'number' ? String(v) : undefined);

export function parsePage(html: string, url: string): Omit<HtmlPage, 'status'> {
  const $ = cheerio.load(html);
  const jsonLd = readJsonLd($);
  const body = $('body').html() ?? html;
  return { url, html, text: htmlToText(body).slice(0, 200_000), meta: readMeta($, url), jsonLd, events: findEvents(jsonLd) };
}

function readMeta($: cheerio.CheerioAPI, url: string): PageMeta {
  const meta = (key: string) =>
    $(`meta[property="${key}"]`).first().attr('content')?.trim() || $(`meta[name="${key}"]`).first().attr('content')?.trim() || undefined;
  return {
    title: cleanLine(meta('og:title') ?? meta('twitter:title') ?? $('title').first().text(), 200) || undefined,
    description: cleanLine(meta('og:description') ?? meta('description') ?? meta('twitter:description'), 500) || undefined,
    image: absoluteUrl(meta('og:image') ?? meta('og:image:url') ?? meta('twitter:image'), url),
    canonical: absoluteUrl($('link[rel="canonical"]').attr('href') ?? meta('og:url'), url),
    siteName: cleanLine(meta('og:site_name'), 120) || undefined,
  };
}

/** Parses every <script type="application/ld+json">, forgiving the usual hand-written mistakes. */
export function readJsonLd($: cheerio.CheerioAPI): unknown[] {
  const out: unknown[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).text().trim();
    if (!raw) return;
    for (const attempt of [raw, raw.replace(/[\u0000-\u001f]+/g, ' ').replace(/,\s*([}\]])/g, '$1')]) {
      try {
        out.push(JSON.parse(attempt));
        return;
      } catch {
        // try the cleaned-up version next
      }
    }
  });
  return out;
}

/** Event objects anywhere in JSON-LD: top level, @graph, lists, nested values. */
export function findEvents(nodes: unknown[], depth = 0): Obj[] {
  if (depth > 8) return [];
  const found: Obj[] = [];
  for (const node of nodes) {
    if (Array.isArray(node)) {
      found.push(...findEvents(node, depth + 1));
    } else if (isObj(node)) {
      const types = toArray(node['@type']).map((t) => String(t).toLowerCase().replace(/^.*[/#]/, ''));
      if (types.some((t) => EVENT_TYPES.has(t))) found.push(node);
      else found.push(...findEvents(Object.values(node), depth + 1));
    }
  }
  return found;
}

function attendanceMode(v: unknown): Mode | undefined {
  const s = String(v ?? '');
  if (/Mixed/i.test(s)) return 'hybrid';
  if (/Online/i.test(s)) return 'online';
  if (/Offline/i.test(s)) return 'offline';
  return undefined;
}

const COUNTRY_CODES: Record<string, string> = { IN: 'India', IND: 'India', US: 'United States', USA: 'United States', GB: 'United Kingdom', UK: 'United Kingdom', DE: 'Germany', SG: 'Singapore', AE: 'United Arab Emirates', CA: 'Canada' };

export function countryName(v: unknown): string | undefined {
  const s = isObj(v) ? str(v.name) : str(v);
  if (!s) return undefined;
  return COUNTRY_CODES[s.toUpperCase()] ?? s;
}

function num(v: unknown): number | undefined {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

/** A schema.org Event as a candidate: dates, place, mode, offers and images, read as-is. */
export function eventToCandidate(ev: Obj, pageUrl: string): RawCandidate | null {
  const title = cleanLine(ev.name, 140);
  if (!title) return null;
  const url = absoluteUrl(ev.url, pageUrl) ?? pageUrl;
  const locations = toArray(ev.location).filter((l) => isObj(l) || typeof l === 'string');
  const place = locations.find((l): l is Obj => isObj(l) && (/Place|PostalAddress/i.test(String(l['@type'])) || 'address' in l));
  const virtual = locations.find((l) => (isObj(l) && /VirtualLocation/i.test(String(l['@type']))) || (typeof l === 'string' && /^https?:/.test(l)));
  const mode = attendanceMode(ev.eventAttendanceMode) ?? (place && virtual ? 'hybrid' : place ? 'offline' : virtual ? 'online' : undefined);

  const addr = place ? (isObj(place.address) ? place.address : place['@type'] === 'PostalAddress' ? place : undefined) : undefined;
  const addressText = place && typeof place.address === 'string' ? place.address : undefined;
  const geo = place && isObj(place.geo) ? place.geo : undefined;
  const offer = toArray(ev.offers).find(isObj);
  const price = num(offer?.price);
  const currency = str(offer?.priceCurrency)?.toUpperCase();
  const images = toArray(ev.image)
    .map((i) => (isObj(i) ? str(i.url) ?? str(i.contentUrl) : str(i)))
    .map((i) => absoluteUrl(i, pageUrl))
    .filter((i): i is string => Boolean(i));
  const organizer = toArray(ev.organizer)
    .map((o) => (isObj(o) ? str(o.name) : str(o)))
    .find(Boolean);

  const data: CandidateData = {
    title,
    startDate: str(ev.startDate),
    endDate: str(ev.endDate),
    registrationDeadline: str(offer?.validThrough),
    mode,
    venue: place ? cleanLine(place.name, 200) || undefined : undefined,
    address: addressText ?? (addr ? [addr.streetAddress, addr.addressLocality, addr.addressRegion].map((x) => str(x)).filter(Boolean).join(', ') || undefined : undefined),
    city: addr ? str(addr.addressLocality) : undefined,
    country: addr ? countryName(addr.addressCountry) : undefined,
    lat: num(geo?.latitude),
    lng: num(geo?.longitude),
    organizer: organizer ? cleanLine(organizer, 140) : undefined,
    fee: price !== undefined && (!currency || currency === 'INR') ? price : price === 0 ? 0 : undefined,
    isPaid: price !== undefined ? price > 0 : undefined,
    imageUrl: images[0],
    registrationUrl: absoluteUrl(offer?.url, pageUrl) ?? url,
  };
  const description = typeof ev.description === 'string' ? decodeEntities(ev.description.replace(/<[^>]+>/g, ' ')).trim() : '';
  return { url, title, text: [title, description].filter(Boolean).join('\n\n'), data, imageUrls: images.slice(0, 3) };
}
