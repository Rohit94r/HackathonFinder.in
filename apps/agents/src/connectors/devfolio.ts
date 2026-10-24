import { cleanLine } from '../text';
import type { CandidateData, Connector, ConnectorContext, RawCandidate } from '../types';
import { arr, firstImage, int, isObj, labels, plainText, str, url, type Obj } from './util';

// Devfolio's search API (the one devfolio.co uses; robots.txt allows everything).
// "application_open" is what you can apply to now; "upcoming" opens soon. Each hit
// carries the cover image, dates with offsets, venue and team size.

const SEARCH = 'https://api.devfolio.co/api/search/hackathons';
const PAGE = 50;
const TYPES = ['application_open', 'upcoming'] as const;

/** One search hit's _source as a candidate. */
export function devfolioCandidate(src: Obj): RawCandidate | null {
  const slug = str(src.slug, 100);
  const title = cleanLine(str(src.name), 140);
  if (!slug || !/^[a-z0-9-]+$/i.test(slug) || !title) return null;
  const pageUrl = `https://${slug.toLowerCase()}.devfolio.co/`;
  const setting = isObj(src.hackathon_setting) ? src.hackathon_setting : {};
  const online = src.is_online === true;
  const location = cleanLine(str(src.location), 200) || undefined;
  const country = str(src.country, 60);

  const data: CandidateData = {
    title,
    organizer: cleanLine(str(src.hosted_by) ?? str(setting.organizer), 140) || undefined,
    mode: online ? 'online' : 'offline',
    city: online ? undefined : str(src.city, 80),
    region: online ? undefined : str(src.state, 80),
    venue: online ? undefined : location,
    address: online ? undefined : location,
    country: online ? country ?? 'India' : country,
    startDate: str(src.starts_at, 40),
    endDate: str(src.ends_at, 40),
    registrationDeadline: str(setting.reg_ends_at, 40),
    timezone: str(src.timezone, 60)?.replace('Asia/Calcutta', 'Asia/Kolkata'),
    teamMin: int(src.team_min, 1, 50),
    teamMax: int(src.team_size, 1, 50),
    // Prize entries are track names without amounts, so they are left out; amounts come from the description.
    tags: labels([...arr(src.themes), ...arr(src.hashtags)], 10),
    eligibility: setting.women_only === true ? ['women-only'] : undefined,
    imageUrl: firstImage(src.cover_img),
    logoUrl: firstImage(setting.logo),
    // Devfolio's page is where you apply (it links out when the organizer uses their own form).
    registrationUrl: pageUrl,
  };
  const text = [title, cleanLine(str(src.tagline), 200), plainText(src.desc, 15_000)].filter(Boolean).join('\n\n');
  return { externalId: str(src.uuid, 64) ?? slug, url: pageUrl, title, text, data, imageUrls: data.imageUrl ? [data.imageUrl] : [] };
}

export const devfolio: Connector = {
  slug: 'devfolio',
  name: 'Devfolio',
  kind: 'platform',
  defaultSchedule: '0 2,14 * * *',
  description: 'Hackathons open for applications (and opening soon) from Devfolio’s search API, with cover images.',
  trust: 0.9,
  extract: 'missing',
  async fetch(ctx: ConnectorContext): Promise<RawCandidate[]> {
    const out: RawCandidate[] = [];
    const seen = new Set<string>();
    for (const type of TYPES) {
      for (let from = 0; from < 500; from += PAGE) {
        const json = await ctx.http.fetchJson<{ hits?: { hits?: unknown[]; total?: { value?: number } } }>(SEARCH, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ type, from, size: PAGE }),
        });
        const hits = arr(json?.hits?.hits).filter(isObj);
        for (const hit of hits) {
          const c = isObj(hit._source) ? devfolioCandidate(hit._source) : null;
          if (c && !seen.has(c.url)) {
            seen.add(c.url);
            out.push(c);
          }
          if (out.length >= ctx.limit) return out;
        }
        const total = int(json?.hits?.total?.value, 0, 100_000) ?? 0;
        if (hits.length < PAGE || from + PAGE >= total) break;
      }
    }
    ctx.log(`devfolio: ${out.length} hackathons`);
    return out;
  },
};
