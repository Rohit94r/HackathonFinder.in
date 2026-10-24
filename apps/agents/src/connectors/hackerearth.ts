import { cleanLine } from '../text';
import type { CandidateData, Connector, ConnectorContext, RawCandidate } from '../types';
import { arr, firstImage, isObj, plainText, str, url, type Obj } from './util';

// HackerEarth's public events feed (the one its browser extension reads). All
// online; registration stays open until the challenge ends.

const FEED = 'https://www.hackerearth.com/chrome-extension/events/';

export function hackerearthCandidate(e: Obj): RawCandidate | null {
  const title = cleanLine(str(e.title), 140);
  const page = url(e.url);
  if (!title || !page || !/^https:\/\/www\.hackerearth\.com\//.test(page)) return null;
  const status = String(e.status ?? '').toUpperCase();
  if (status && !['ONGOING', 'UPCOMING', 'LIVE', 'OPEN'].includes(status)) return null;
  const description = plainText(e.description, 5000);
  const data: CandidateData = {
    title,
    mode: 'online',
    country: 'Global',
    startDate: str(e.start_tz, 40) ?? str(e.start_timestamp, 80),
    endDate: str(e.end_tz, 40) ?? str(e.end_timestamp, 80),
    registrationDeadline: str(e.end_tz, 40) ?? str(e.end_timestamp, 80),
    deadlineAssumed: true,
    eligibility: e.college === true ? ['students'] : ['open-to-all'],
    imageUrl: firstImage(e.cover_image, e.thumbnail),
    registrationUrl: page,
  };
  const id = page.match(/\/challenges\/[a-z-]+\/([^/?#]+)/i)?.[1];
  return { externalId: id, url: page, title, text: [title, description].filter(Boolean).join('\n\n'), data, imageUrls: data.imageUrl ? [data.imageUrl] : [] };
}

export const hackerearth: Connector = {
  slug: 'hackerearth',
  name: 'HackerEarth',
  kind: 'platform',
  defaultSchedule: '0 2,14 * * *',
  description: 'Ongoing and upcoming HackerEarth hackathons and challenges from its public events feed.',
  trust: 0.85,
  extract: 'missing',
  async fetch(ctx: ConnectorContext): Promise<RawCandidate[]> {
    const json = await ctx.http.fetchJson<{ response?: unknown[] }>(FEED);
    const out: RawCandidate[] = [];
    for (const e of arr(json?.response).filter(isObj)) {
      const c = hackerearthCandidate(e);
      if (c) out.push(c);
      if (out.length >= ctx.limit) break;
    }
    ctx.log(`hackerearth: ${out.length} events`);
    return out;
  },
};
