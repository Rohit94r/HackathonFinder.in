import { cityFromText } from '@hackathonfinder/ai';
import { parseDateRange } from '../dates';
import { cleanLine } from '../text';
import type { CandidateData, Connector, ConnectorContext, RawCandidate } from '../types';
import { arr, firstImage, int, isObj, labels, str, url, type Obj } from './util';

// Devpost's listing API (robots.txt allows it). Mostly online hackathons open to
// everyone; in-person ones are kept only when they are clearly in India.

const API = 'https://devpost.com/api/hackathons';
const MAX_PAGES = 10;

const INDIAN_STATES =
  /\b(india|bharat|maharashtra|karnataka|telangana|tamil nadu|kerala|gujarat|rajasthan|punjab|haryana|uttar pradesh|madhya pradesh|west bengal|odisha|bihar|assam|andhra pradesh|goa|uttarakhand|jharkhand|chhattisgarh|himachal|jammu|kashmir)\b/i;

/** True when a free-text place is evidently in India. */
export function placeInIndia(place: string): boolean {
  return INDIAN_STATES.test(place) || Boolean(cityFromText(place));
}

/** Devpost serves thumbnails as protocol-relative "…/medium_square.png"; "large" is the size it shares. */
export function devpostImage(thumb: unknown): string | undefined {
  const u = url(typeof thumb === 'string' && thumb.startsWith('//') ? `https:${thumb}` : thumb);
  return firstImage(u?.replace(/\/medium_square\.(png|jpe?g|gif)$/i, '/large.$1'));
}

/** "$<span data-currency-value>50,000</span>" → $50,000. Only dollars and rupees are read. */
export function devpostPrize(html: unknown): { amount: number; currency: 'INR' | 'USD' } | undefined {
  const text = cleanLine(typeof html === 'string' ? html : '', 80);
  const m = text.match(/^(\$|₹|INR|USD)\s*([\d,]+(?:\.\d+)?)/i);
  if (!m) return undefined;
  const amount = Math.round(Number(m[2].replace(/,/g, '')));
  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  return { amount, currency: /\$|usd/i.test(m[1]) ? 'USD' : 'INR' };
}

export function devpostCandidate(h: Obj, now: Date): RawCandidate | null {
  const id = str(h.id, 20);
  const title = cleanLine(str(h.title), 140);
  const pageUrl = url(h.url);
  if (!id || !title || !pageUrl || !/^https:\/\/[a-z0-9-]+\.devpost\.com\//i.test(pageUrl)) return null;
  if (h.invite_only === true) return null;
  const loc = isObj(h.displayed_location) ? h.displayed_location : {};
  const where = cleanLine(str(loc.location), 160);
  const online = !where || /^online$/i.test(where) || loc.icon === 'globe';
  const { start, end } = parseDateRange(str(h.submission_period_dates, 80), { now, endKind: 'deadline' });
  const themes = labels(arr(h.themes), 10);
  const prize = devpostPrize(h.prize_amount);
  const image = devpostImage(h.thumbnail_url);

  const data: CandidateData = {
    title,
    organizer: cleanLine(str(h.organization_name), 140) || undefined,
    mode: online ? 'online' : 'offline',
    city: online ? undefined : where,
    venue: online ? undefined : where,
    // Devpost gives only a venue name. Anything not clearly in India is treated as abroad.
    country: online ? 'Global' : placeInIndia(where) ? 'India' : 'Outside India',
    startDate: start?.toISOString(),
    endDate: end?.toISOString(),
    // You can join until submissions close.
    registrationDeadline: end?.toISOString(),
    deadlineAssumed: true,
    tags: themes,
    beginnerFriendly: themes.some((t) => /beginner/i.test(t)) || undefined,
    prizePool: prize?.amount,
    prizeCurrency: prize?.currency,
    eligibility: ['open-to-all'],
    imageUrl: image,
    registrationUrl: pageUrl,
  };
  return { externalId: id, url: pageUrl, title, text: [title, themes.join(', ')].join('\n'), data, imageUrls: image ? [image] : [] };
}

export const devpost: Connector = {
  slug: 'devpost',
  name: 'Devpost',
  kind: 'platform',
  defaultSchedule: '0 2,14 * * *',
  description: 'Open and upcoming hackathons from Devpost’s listing API (mostly online, worldwide).',
  trust: 0.85,
  extract: 'missing',
  async fetch(ctx: ConnectorContext): Promise<RawCandidate[]> {
    const out: RawCandidate[] = [];
    const seen = new Set<string>();
    for (let page = 1; page <= MAX_PAGES; page++) {
      const json = await ctx.http.fetchJson<{ hackathons?: unknown[]; meta?: { total_count?: number; per_page?: number } }>(
        `${API}?status%5B%5D=upcoming&status%5B%5D=open&per_page=40&page=${page}`
      );
      const rows = arr(json?.hackathons).filter(isObj);
      for (const row of rows) {
        const c = devpostCandidate(row, ctx.now);
        if (c && !seen.has(c.externalId!)) {
          seen.add(c.externalId!);
          out.push(c);
        }
        if (out.length >= ctx.limit) return out;
      }
      const total = int(json?.meta?.total_count, 0, 100_000) ?? 0;
      const perPage = int(json?.meta?.per_page, 1, 1000) ?? rows.length;
      if (!rows.length || page * perPage >= total) break;
    }
    ctx.log(`devpost: ${out.length} hackathons`);
    return out;
  },
};
