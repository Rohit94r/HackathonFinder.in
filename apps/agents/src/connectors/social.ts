import type { City } from '@hackathonfinder/shared';
import { BlockedError, errorMessage } from '../errors';
import { modeFromText } from '../pipeline/normalize';
import { SEARCH_KEYS, searchProvider, type SearchResult } from '../search';
import { HACKATHON_WORDS, cleanLine } from '../text';
import type { CandidateData, Connector, ConnectorContext, RawCandidate } from '../types';
import { QR_WORDS, datesFromText, eventTitle, leadCity, linkInText, rotatingCities, searchYears, splitPostSnippet } from './leads';
import { arr, isObj, str, url } from './util';

// Posts about hackathons on Instagram, LinkedIn and Facebook. We never crawl those
// sites (logged-out pages are login walls and their robots.txt disallows crawlers),
// and we never log in. Instead, public posts reach us as web search results: the
// post link and the search snippet become a lead. Complete leads publish with an
// unverified flag, and the source link stays visible. With an Instagram Graph API token we also
// read public hashtag posts through Meta's official API (captions and the poster).

interface Network {
  slug: 'instagram' | 'linkedin' | 'facebook';
  label: string;
  /** Search operator that keeps results on the network. */
  site: string;
  /** Links that are one post or event (not a profile, tag page or "popular" page). */
  post: RegExp;
  host: RegExp;
}

export const NETWORKS: Record<Network['slug'], Network> = {
  instagram: {
    slug: 'instagram',
    label: 'Instagram',
    site: 'site:instagram.com',
    post: /^https:\/\/(?:www\.)?instagram\.com\/(?:[a-z0-9_.]+\/)?(?:p|reel|reels|tv)\/[A-Za-z0-9_-]{5,}/i,
    host: /(^|\.)instagram\.com$/,
  },
  linkedin: {
    slug: 'linkedin',
    label: 'LinkedIn',
    site: 'site:linkedin.com/posts',
    post: /^https:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/(?:posts\/[^/?#]+|events\/[^/?#]+|feed\/update\/[^/?#]+)/i,
    host: /(^|\.)(linkedin\.com|lnkd\.in)$/,
  },
  facebook: {
    slug: 'facebook',
    label: 'Facebook',
    site: 'site:facebook.com/events',
    post: /^https:\/\/(?:www\.|m\.)?facebook\.com\/events\/\d+/i,
    host: /(^|\.)(facebook\.com|fb\.me|fb\.com)$/,
  },
};

/** The post's permalink without tracking parameters. */
export function postPermalink(input: string, net: Network): string | undefined {
  const m = input.match(net.post);
  if (!m) return undefined;
  return `${m[0].replace(/\/+$/, '')}/`;
}

/** A search result about one post as a review-queue lead, or null when it isn't one event. */
export function socialLead(r: SearchResult, net: Network, opts: { now: Date; city?: City; listingSource?: string }): RawCandidate | null {
  const permalink = postPermalink(r.url, net);
  if (!permalink) return null;
  const { text, postedAt } = splitPostSnippet(r.snippet);
  const title = eventTitle(r.title) || eventTitle(text.split(/[.!\n]/)[0] ?? '');
  const full = `${r.title}\n${text}`;
  if (!title || !HACKATHON_WORDS.test(full)) return null;

  const base = postedAt ?? opts.now;
  let dates = datesFromText(text, base);
  if (!dates.start) dates = datesFromText(r.title, base);
  // A post from months before the date it names is usually about last year's edition.
  if (postedAt && dates.start && dates.start.getTime() - postedAt.getTime() > 300 * 24 * 3600_000) dates = {};

  const city = leadCity(full, opts.city);
  const mode = modeFromText(full) ?? (city ? 'offline' : undefined);
  const qr = QR_WORDS.test(full);
  const link = linkInText(text, net.host);
  const account = cleanLine(r.title.split(/\s+\|\s+/)[0], 80);
  const flags = [`Found on ${net.label} via web search — add the poster and check the details`];
  if (qr && !link) flags.push(`Registration is by QR code on the ${net.label} poster — check where it leads`);

  const data: CandidateData = {
    title,
    organizer: account && !HACKATHON_WORDS.test(account) && account !== title ? account : undefined,
    mode,
    city,
    country: city ? 'India' : undefined,
    startDate: dates.start?.toISOString(),
    endDate: dates.end?.toISOString(),
    registrationDeadline: dates.deadline?.toISOString(),
    registrationUrl: link ?? permalink,
    registrationVia: qr && !link ? 'qr' : 'link',
    listingSource: opts.listingSource ?? net.slug,
    flags,
  };
  return { url: permalink, title, text: [title, text].join('\n\n'), data, imageUrls: [] };
}

/** Search queries for this run: a few catalog cities (rotating) plus one India-wide query. */
export function socialQueries(net: Network, now: Date, cities: City[]): { query: string; city?: City }[] {
  const [year] = searchYears(now);
  return [...cities.map((city) => ({ query: `${net.site} hackathon ${city.name} ${year}`, city })), { query: `${net.site} hackathon India ${year} registration` }];
}

async function searchLeads(net: Network, ctx: ConnectorContext): Promise<RawCandidate[]> {
  const provider = searchProvider(ctx.http, ctx.env);
  const perRun = Number(ctx.source.config.citiesPerRun) || 3;
  const out: RawCandidate[] = [];
  const seen = new Set<string>();
  let searched = 0;
  for (const { query, city } of socialQueries(net, ctx.now, rotatingCities(ctx.now, perRun))) {
    let results: SearchResult[];
    try {
      results = await provider.search(query);
      searched++;
    } catch (err) {
      // A challenge page ends this source for the run; with nothing found at all it counts as blocked.
      if (err instanceof BlockedError && !searched) throw err;
      ctx.warn(`${net.slug}: search stopped (${errorMessage(err)})`);
      break;
    }
    for (const r of results) {
      const lead = socialLead(r, net, { now: ctx.now, city, listingSource: net.slug });
      if (lead && !seen.has(lead.url)) {
        seen.add(lead.url);
        out.push(lead);
      }
      if (out.length >= ctx.limit) return out;
    }
  }
  ctx.log(`${net.slug}: ${out.length} posts from ${searched} ${provider.id} searches`);
  return out;
}

// ── Instagram Graph API (official; needs a token) ───────────────────────────

const GRAPH = 'https://graph.facebook.com/v21.0';
/** Instagram allows 30 different hashtags a week per account; a few per run stays far below that. */
export const HASHTAGS = ['hackathonindia', 'indianhackathon', 'collegehackathon', 'hackathonpune', 'hackathonbangalore', 'hackathonmumbai', 'hackathondelhi', 'hackathonhyderabad', 'hackathonchennai'];

export function hashtagsForRun(now: Date, perRun = 3): string[] {
  const halfDay = Math.floor(now.getTime() / (12 * 3600_000));
  return Array.from({ length: perRun }, (_, i) => HASHTAGS[(halfDay * perRun + i) % HASHTAGS.length]);
}

/** One hashtag post (caption + poster) as a lead. */
export function graphLead(media: Record<string, unknown>, now: Date): RawCandidate | null {
  const permalink = url(media.permalink);
  const caption = typeof media.caption === 'string' ? media.caption.slice(0, 5000) : '';
  if (!permalink || !caption || !HACKATHON_WORDS.test(caption)) return null;
  const postedAt = str(media.timestamp) ? new Date(String(media.timestamp)) : undefined;
  const base = postedAt && !Number.isNaN(postedAt.getTime()) ? postedAt : now;
  const dates = datesFromText(caption, base);
  const title = eventTitle(caption.split('\n').find((l) => HACKATHON_WORDS.test(l)) ?? caption.split('\n')[0]);
  const city = leadCity(caption);
  const qr = QR_WORDS.test(caption);
  const link = linkInText(caption, NETWORKS.instagram.host);
  const type = String(media.media_type ?? '');
  const image = type === 'IMAGE' || type === 'CAROUSEL_ALBUM' ? url(media.media_url) : undefined;
  const flags = ['Found on Instagram (hashtag search) — check the details'];
  if (qr && !link) flags.push('Registration is by QR code on the Instagram poster — check where it leads');
  return {
    externalId: str(media.id, 40),
    url: permalink,
    title,
    text: caption,
    data: {
      title,
      mode: modeFromText(caption) ?? (city ? 'offline' : undefined),
      city,
      country: city ? 'India' : undefined,
      startDate: dates.start?.toISOString(),
      endDate: dates.end?.toISOString(),
      registrationDeadline: dates.deadline?.toISOString(),
      imageUrl: image,
      registrationUrl: link ?? permalink,
      registrationVia: qr && !link ? 'qr' : 'link',
      listingSource: 'instagram',
      flags,
    },
    imageUrls: image ? [image] : [],
  };
}

async function graphLeads(ctx: ConnectorContext): Promise<RawCandidate[]> {
  const token = ctx.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = ctx.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  if (!token || !userId || !/^\d+$/.test(userId)) return [];
  const out: RawCandidate[] = [];
  for (const tag of hashtagsForRun(ctx.now)) {
    try {
      const q = new URLSearchParams({ user_id: userId, q: tag, access_token: token });
      const found = await ctx.http.fetchJson<{ data?: { id?: string }[] }>(`${GRAPH}/ig_hashtag_search?${q}`, { officialApi: true, retries: 1 });
      const id = found?.data?.[0]?.id;
      if (!id || !/^\d+$/.test(id)) continue;
      const fields = 'id,caption,media_type,media_url,permalink,timestamp';
      const m = new URLSearchParams({ user_id: userId, fields, limit: '30', access_token: token });
      const media = await ctx.http.fetchJson<{ data?: unknown[] }>(`${GRAPH}/${id}/recent_media?${m}`, { officialApi: true, retries: 1 });
      for (const item of arr(media?.data).filter(isObj)) {
        const lead = graphLead(item, ctx.now);
        if (lead) out.push(lead);
      }
    } catch (err) {
      // errorMessage never includes the URL, so the token stays out of the logs.
      ctx.warn(`instagram: hashtag #${tag} failed (${errorMessage(err)})`);
    }
  }
  ctx.log(`instagram: ${out.length} posts from the Graph API`);
  return out;
}

function socialConnector(net: Network, extra?: Partial<Connector>): Connector {
  return {
    slug: net.slug,
    name: net.label,
    kind: 'social',
    defaultSchedule: '0 2,14 * * *',
    description: `${net.label} posts found through web search; complete event details publish as unverified listings (we never crawl ${net.label}).`,
    optionalEnv: SEARCH_KEYS,
    trust: 0.4,
    extract: 'always',
    async fetch(ctx) {
      return searchLeads(net, ctx);
    },
    ...extra,
  };
}

export const instagram = socialConnector(NETWORKS.instagram, {
  description:
    'Instagram posts found through web search (we never crawl Instagram), plus hashtag posts from the official Graph API when INSTAGRAM_ACCESS_TOKEN is set. Complete event details publish as unverified listings.',
  optionalEnv: ['INSTAGRAM_ACCESS_TOKEN', 'INSTAGRAM_BUSINESS_ACCOUNT_ID', ...SEARCH_KEYS],
  // Graph API images are short-lived CDN links: they are only kept as our own stored copy.
  storeImages: false,
  async fetch(ctx) {
    const api = await graphLeads(ctx);
    let search: RawCandidate[] = [];
    try {
      search = await searchLeads(NETWORKS.instagram, ctx);
    } catch (err) {
      if (!api.length) throw err;
      ctx.warn(`instagram: web search failed (${errorMessage(err)})`);
    }
    const seen = new Set(api.map((c) => c.url));
    return [...api, ...search.filter((c) => !seen.has(c.url))].slice(0, ctx.limit);
  },
});
export const linkedin = socialConnector(NETWORKS.linkedin);
export const facebook = socialConnector(NETWORKS.facebook);
