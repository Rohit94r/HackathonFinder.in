import * as cheerio from 'cheerio';
import type { Mode } from '@hackathonfinder/shared';
import { countryName } from '../html';
import { cleanLine } from '../text';
import type { CandidateData, Connector, ConnectorContext, RawCandidate } from '../types';
import { arr, firstImage, isObj, labels, str, url, type Obj } from './util';

// MLH's season page (mlh.io redirects to mlh.com) embeds every upcoming event as
// JSON in <script data-page="app">. Most are in North America and Europe; the
// validator keeps online ones and those in India.

const FORMATS: Record<string, Mode> = { physical: 'offline', digital: 'online', virtual: 'online', hybrid_physical: 'hybrid', hybrid_digital: 'hybrid', hybrid: 'hybrid' };

/** MLH seasons are named for the year they end in: Aug 2026 – Jul 2027 is the 2027 season. */
export function mlhSeason(now: Date): number {
  return now.getUTCMonth() >= 7 ? now.getUTCFullYear() + 1 : now.getUTCFullYear();
}

/** Upcoming events from the season page HTML. */
export function mlhEvents(html: string): Obj[] {
  const $ = cheerio.load(html);
  const raw = $('script[data-page="app"]').first().text();
  if (!raw) return [];
  try {
    const page = JSON.parse(raw);
    return arr(page?.props?.upcomingEvents).filter(isObj);
  } catch {
    return [];
  }
}

export function mlhCandidate(e: Obj): RawCandidate | null {
  const slug = str(e.slug, 100);
  const title = cleanLine(str(e.name), 140);
  if (!slug || !title) return null;
  const format = String(e.formatType ?? '').toLowerCase();
  const mode = FORMATS[format] ?? 'offline';
  const venue = isObj(e.venueAddress) ? e.venueAddress : {};
  const site = url(e.websiteUrl);
  const page = `https://www.mlh.com/events/${encodeURIComponent(slug)}`;
  const focus = isObj(e.customFields) ? labels(arr(e.customFields.hackathon_focus), 6) : [];
  const data: CandidateData = {
    title,
    organizer: undefined,
    mode,
    city: mode === 'online' ? undefined : str(venue.city, 80),
    region: mode === 'online' ? undefined : str(venue.state, 80),
    venue: mode === 'online' ? undefined : cleanLine(str(e.location), 200) || undefined,
    country: mode === 'online' ? 'Global' : countryName(str(venue.country, 60)) ?? undefined,
    startDate: str(e.startsAt, 40),
    endDate: str(e.endsAt, 40),
    // MLH lists no deadline; register before it starts.
    registrationDeadline: str(e.startsAt, 40),
    deadlineAssumed: true,
    // "hybrid_physical" is an in-person event with some online parts (rejected abroad);
    // "hybrid_digital" is online first, so it can be listed online when the venue is abroad.
    remoteOk: format === 'hybrid_digital' || undefined,
    tags: focus,
    eligibility: ['students'],
    imageUrl: firstImage(e.backgroundUrl),
    logoUrl: firstImage(e.logoUrl),
    registrationUrl: site ?? page,
  };
  return { externalId: str(e.id, 64) ?? slug, url: site ?? page, title, text: [title, cleanLine(str(e.location), 200), focus.join(', ')].filter(Boolean).join('\n'), data, imageUrls: data.imageUrl ? [data.imageUrl] : [] };
}

export const mlh: Connector = {
  slug: 'mlh',
  name: 'MLH',
  kind: 'platform',
  defaultSchedule: '0 2,14 * * *',
  description: 'Major League Hacking’s season calendar (online events and those in India).',
  trust: 0.9,
  extract: 'missing',
  async fetch(ctx: ConnectorContext): Promise<RawCandidate[]> {
    const season = mlhSeason(ctx.now);
    const page = await ctx.http.fetchHtml(`https://www.mlh.com/seasons/${season}/events`);
    const out: RawCandidate[] = [];
    for (const e of mlhEvents(page.html)) {
      const c = mlhCandidate(e);
      if (c) out.push(c);
      if (out.length >= ctx.limit) break;
    }
    ctx.log(`mlh: ${out.length} upcoming events in the ${season} season`);
    return out;
  },
};
