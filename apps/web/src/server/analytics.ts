import 'server-only';
import type { NextRequest } from 'next/server';
import { AnalyticsEvent, Hackathon, PageView, SavedEvent, Types, User, type AnalyticsEventType, type Device } from '@hackathonfinder/db';

// First-party analytics for the public site: who visits, which pages, which hackathon
// cards were seen and clicked. Visitors are a random id in a cookie (hf_vid); IP
// addresses are only used in memory for rate limits and are never stored.

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const IST_MS = 330 * 60 * 1000;
export const ANALYTICS_TZ = 'Asia/Kolkata';

/** A visitor or session id from our cookies: a UUID or similar random token. */
export const VISITOR_ID = /^[A-Za-z0-9-]{8,64}$/;
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ---------- Who is visiting ----------

// Crawlers, link previews, uptime checks, headless browsers and HTTP libraries.
const BOT_UA =
  /bot\b|bot\/|crawl|spider|slurp|scrap|headless|phantom|puppeteer|playwright|selenium|webdriver|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|preview|facebookexternalhit|embedly|quora link|outbrain|pinterest|vkshare|validator|whatsapp|telegram|discord|slack|skypeuri|curl\/|wget\/|python|aiohttp|httpx|axios|node-fetch|undici|go-http|java\/|okhttp|libwww|httpclient|postman|insomnia|ahrefs|semrush|mj12|dotbot|petalbot|bytespider|gptbot|claude|ccbot|perplexity|applebot|duckduckbot|duckassist|bingpreview|googleother|inspectiontool|feedfetcher|mediapartners|google-read-aloud/i;

/** True for crawlers, previews and scripts, which never count as visitors. */
export function isBot(ua: string | null | undefined): boolean {
  return !ua || ua.length < 20 || BOT_UA.test(ua);
}

/** The visitor asked not to be tracked (Do Not Track or Global Privacy Control). */
export function wantsNoTracking(headers: Headers): boolean {
  return headers.get('dnt') === '1' || headers.get('sec-gpc') === '1';
}

/** Device type, browser and OS from the user agent. Small on purpose: the common cases, else "Other". */
export function parseUserAgent(ua: string): { device: Device; browser: string; os: string } {
  const s = ua || '';
  let os = 'Other';
  if (/windows nt|windows phone/i.test(s)) os = 'Windows';
  else if (/iphone|ipod/i.test(s)) os = 'iOS';
  else if (/ipad/i.test(s)) os = 'iPadOS';
  else if (/android/i.test(s)) os = 'Android';
  else if (/cros/i.test(s)) os = 'ChromeOS';
  else if (/mac os x|macintosh/i.test(s)) os = 'macOS';
  else if (/linux/i.test(s)) os = 'Linux';

  // In-app browsers carry Chrome/Safari tokens too, so they're checked first.
  let browser = 'Other';
  if (/instagram/i.test(s)) browser = 'Instagram app';
  else if (/fban|fbav|fb_iab/i.test(s)) browser = 'Facebook app';
  else if (/linkedinapp/i.test(s)) browser = 'LinkedIn app';
  else if (/edg(e|a|ios)?\//i.test(s)) browser = 'Edge';
  else if (/opr\/|opera|opios/i.test(s)) browser = 'Opera';
  else if (/samsungbrowser/i.test(s)) browser = 'Samsung Internet';
  else if (/ucbrowser/i.test(s)) browser = 'UC Browser';
  else if (/yabrowser/i.test(s)) browser = 'Yandex';
  else if (/fxios|firefox\//i.test(s)) browser = 'Firefox';
  else if (/crios|chrome\/|chromium/i.test(s)) browser = 'Chrome';
  else if (/safari\//i.test(s) && /version\//i.test(s)) browser = 'Safari';

  const tablet = /ipad|tablet|kindle|silk|playbook/i.test(s) || (/android/i.test(s) && !/mobile/i.test(s));
  const mobile = !tablet && /mobi|iphone|ipod|windows phone|blackberry|opera mini/i.test(s);
  return { device: tablet ? 'tablet' : mobile ? 'mobile' : 'desktop', browser, os };
}

function cleanText(value: string | null | undefined, max: number): string | undefined {
  if (!value) return undefined;
  let v = value;
  try {
    v = decodeURIComponent(value);
  } catch {
    // Keep the raw header.
  }
  v = v.replace(/[\u0000-\u001f\u007f<>"]/g, '').trim().slice(0, max);
  return v || undefined;
}

/** Country, region and city from the host's geo headers (Vercel or Cloudflare), when it sends them. */
export function geoFromHeaders(headers: Headers): { country?: string; region?: string; city?: string } {
  const raw = (headers.get('x-vercel-ip-country') || headers.get('cf-ipcountry') || '').toUpperCase();
  const country = /^[A-Z]{2}$/.test(raw) && raw !== 'XX' && raw !== 'T1' ? raw : undefined;
  return {
    country,
    region: cleanText(headers.get('x-vercel-ip-country-region'), 80),
    city: cleanText(headers.get('x-vercel-ip-city'), 80),
  };
}

/** A page path without its query string or hash, or null for paths we never count (admin, API). */
export function cleanPath(raw: string): string | null {
  let p = raw.split(/[?#]/)[0].trim();
  if (!p.startsWith('/') || p.startsWith('//')) return null;
  p = p.replace(/[\u0000-\u001f\u007f\s<>"]/g, '').replace(/\/{2,}/g, '/');
  if (p.length > 1) p = p.replace(/\/+$/, '');
  if (/^\/(admin|api|_next)(\/|$)/i.test(p)) return null;
  return p.slice(0, 300);
}

/** The listing slug when the path is a hackathon page. */
export function hackathonSlugFromPath(path: string): string | null {
  const m = /^\/hackathons\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(path);
  return m ? m[1] : null;
}

// Link wrappers and app ids, so "l.instagram.com" and "com.linkedin.android" read as the site.
const REFERRER_ALIASES: [RegExp, string][] = [
  [/(^|\.)instagram\.com$|^com\.instagram\.android$/, 'instagram.com'],
  [/(^|\.)facebook\.com$|^com\.facebook\.(katana|orca)$/, 'facebook.com'],
  [/(^|\.)linkedin\.com$|^lnkd\.in$|^com\.linkedin\.android$/, 'linkedin.com'],
  [/^t\.co$|(^|\.)twitter\.com$|(^|\.)x\.com$/, 'x.com'],
  [/^com\.google\.android\.gm$/, 'gmail'],
  [/^com\.whatsapp$/, 'whatsapp'],
  [/(^|\.)google\.[a-z.]+$|^com\.google\.android\.googlequicksearchbox$/, 'google'],
  [/(^|\.)bing\.com$/, 'bing.com'],
  [/(^|\.)youtube\.com$|^youtu\.be$/, 'youtube.com'],
];

/** Just the host of where a visitor came from ("google", "instagram.com"), never the full URL. Empty for direct or internal visits. */
export function referrerHost(ref: string | null | undefined, ownHost: string): string {
  if (!ref) return '';
  try {
    const url = new URL(ref);
    if (!/^(https?|android-app):$/.test(url.protocol)) return '';
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (!host || host === ownHost || host === 'localhost') return '';
    for (const [rx, name] of REFERRER_ALIASES) if (rx.test(host)) return name;
    return host.slice(0, 200);
  } catch {
    return '';
  }
}

/** Our own host without "www." or a port, to tell internal links from referrers. */
export function ownHost(req: NextRequest): string {
  return (req.headers.get('host') ?? req.nextUrl.host).toLowerCase().replace(/:\d+$/, '').replace(/^www\./, '');
}

/** A UTM value: lowercase, short, plain characters only. */
export function cleanUtm(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase().replace(/[^\p{L}\p{N} ._:/+-]/gu, '').trim().slice(0, 100);
  return v || undefined;
}

/** Visitor and session ids from our cookies, when they look right. */
export function trackingCookies(req: NextRequest): { visitorId?: string; sessionId?: string } {
  const vid = req.cookies.get('hf_vid')?.value;
  const sid = req.cookies.get('hf_sid')?.value;
  return { visitorId: vid && VISITOR_ID.test(vid) ? vid : undefined, sessionId: sid && VISITOR_ID.test(sid) ? sid : undefined };
}

/** Keeps only slugs of listings that exist, so made-up slugs can't fill the reports. */
export async function existingSlugs(slugs: string[]): Promise<Set<string>> {
  const list = [...new Set(slugs.filter((s) => SLUG.test(s)))].slice(0, 100);
  if (!list.length) return new Set();
  const docs = await Hackathon.find({ slug: { $in: list } }).select('slug').lean();
  return new Set(docs.map((d) => d.slug));
}

// ---------- Recording ----------

/**
 * A click on "Register on official site" (/go/<slug>). Bots and visitors who opted out
 * still reach the organizer, they just aren't recorded here.
 */
export async function recordRegisterClick(req: NextRequest, slug: string, userId?: string | null): Promise<void> {
  const ua = req.headers.get('user-agent') ?? '';
  if (isBot(ua) || wantsNoTracking(req.headers)) return;
  const { visitorId, sessionId } = trackingCookies(req);
  let from: string | undefined;
  const referer = req.headers.get('referer');
  if (referer) {
    try {
      const url = new URL(referer);
      if (url.host === req.nextUrl.host) from = cleanPath(url.pathname) ?? undefined;
    } catch {
      // No usable referer.
    }
  }
  await AnalyticsEvent.create({
    type: 'register',
    target: slug,
    visitorId,
    sessionId,
    userId: userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined,
    path: from,
    meta: { device: parseUserAgent(ua).device },
  });
}

/**
 * A sign-in, from next-auth's signIn event. The first sign-in of an account made in the
 * last half hour also counts as a sign-up.
 */
export async function recordSignIn(userId: string, provider?: string): Promise<void> {
  if (!Types.ObjectId.isValid(userId)) return;
  const id = new Types.ObjectId(userId);
  const [user, before] = await Promise.all([
    User.findById(id).select('createdAt isSample').lean(),
    AnalyticsEvent.exists({ type: 'login', userId: id }),
  ]);
  if (!user || user.isSample) return;
  const target = (provider ?? 'credentials').slice(0, 40);
  const rows: { type: AnalyticsEventType; userId: Types.ObjectId; target: string; meta: Record<string, unknown> }[] = [];
  if (!before && Date.now() - new Date(user.createdAt).getTime() < 30 * 60 * 1000) rows.push({ type: 'signup', userId: id, target, meta: {} });
  rows.push({ type: 'login', userId: id, target, meta: {} });
  await AnalyticsEvent.insertMany(rows);
}

// ---------- Date ranges (India time) ----------

export type RangeKey = 'today' | '7d' | '30d' | '90d' | 'custom';

export interface Range {
  key: RangeKey;
  from: Date;
  to: Date;
  /** Chart buckets: hours for a single day, days otherwise. */
  bucket: 'hour' | 'day';
  label: string;
}

/** Midnight in India for the day containing `t`. */
export function istMidnight(t: number): number {
  return Math.floor((t + IST_MS) / DAY) * DAY - IST_MS;
}

/** "2026-10-24" read as midnight India time, or null. */
function istDay(value: string | undefined): number | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const t = Date.parse(`${value}T00:00:00+05:30`);
  return Number.isNaN(t) ? null : t;
}

const istDateLabel = (t: number) => new Date(t + IST_MS).toISOString().slice(0, 10);

/** A named range ("7d"), or a custom one from two India-time dates (both days included, up to 400 days). */
export function resolveRange(key: RangeKey, fromDay?: string, toDay?: string, now = Date.now()): Range {
  const today = istMidnight(now);
  const days = (n: number, label: string): Range => ({ key, from: new Date(today - (n - 1) * DAY), to: new Date(now), bucket: 'day', label });
  switch (key) {
    case 'today':
      return { key, from: new Date(today), to: new Date(now), bucket: 'hour', label: 'Today' };
    case '7d':
      return days(7, 'Last 7 days');
    case '90d':
      return days(90, 'Last 90 days');
    case 'custom': {
      const a = istDay(fromDay);
      const b = istDay(toDay);
      if (a === null || b === null || a > b) return { ...days(30, 'Last 30 days'), key: '30d' };
      const start = Math.max(a, b - 399 * DAY);
      const end = Math.min(b + DAY, now);
      if (end <= start) return { key, from: new Date(start), to: new Date(start + DAY), bucket: 'hour', label: istDateLabel(start) };
      const single = b === start;
      return {
        key,
        from: new Date(start),
        to: new Date(end),
        bucket: single ? 'hour' : 'day',
        label: single ? istDateLabel(start) : `${istDateLabel(start)} to ${istDateLabel(b)}`,
      };
    }
    default:
      return days(30, 'Last 30 days');
  }
}

/** The same length of time just before `r`, for "vs previous period". */
export function previousRange(r: Range): { from: Date; to: Date } {
  const span = r.to.getTime() - r.from.getTime();
  return { from: new Date(r.from.getTime() - span), to: new Date(r.from) };
}

// ---------- Reports ----------

export interface TrafficSummary {
  visitors: number;
  sessions: number;
  pageViews: number;
  /** Average time on a page, from pages where we got a duration. */
  avgTimeMs: number | null;
  /** Share of sessions with a single page view, 0–1. */
  bounceRate: number | null;
  /** Signed-in students who opened at least one page. */
  activeUsers: number;
  hackathonViews: number;
  impressions: number;
  registerClicks: number;
  clicks: number;
  signups: number;
  logins: number;
}

const first = (rows: { n?: number }[] | undefined) => rows?.[0]?.n ?? 0;

export async function trafficSummary(from: Date, to: Date): Promise<TrafficSummary> {
  const createdAt = { $gte: from, $lt: to };
  const [[pv], events, signups] = await Promise.all([
    PageView.aggregate<{
      views: { n: number }[];
      visitors: { n: number }[];
      sessions: { sessions: number; bounces: number }[];
      time: { avg: number }[];
      users: { n: number }[];
      hackathon: { n: number }[];
    }>([
      { $match: { createdAt } },
      {
        $facet: {
          views: [{ $count: 'n' }],
          visitors: [{ $group: { _id: '$visitorId' } }, { $count: 'n' }],
          sessions: [
            { $group: { _id: '$sessionId', n: { $sum: 1 } } },
            { $group: { _id: null, sessions: { $sum: 1 }, bounces: { $sum: { $cond: [{ $eq: ['$n', 1] }, 1, 0] } } } },
          ],
          time: [{ $match: { durationMs: { $gt: 0 } } }, { $group: { _id: null, avg: { $avg: '$durationMs' } } }],
          users: [{ $match: { userId: { $type: 'objectId' } } }, { $group: { _id: '$userId' } }, { $count: 'n' }],
          hackathon: [{ $match: { hackathonSlug: { $type: 'string' } } }, { $count: 'n' }],
        },
      },
    ]),
    AnalyticsEvent.aggregate<{ _id: AnalyticsEventType; n: number }>([{ $match: { createdAt } }, { $group: { _id: '$type', n: { $sum: 1 } } }]),
    User.countDocuments({ createdAt, isSample: { $ne: true } }),
  ]);
  const ev = (type: AnalyticsEventType) => events.find((e) => e._id === type)?.n ?? 0;
  const s = pv?.sessions?.[0];
  return {
    visitors: first(pv?.visitors),
    sessions: s?.sessions ?? 0,
    pageViews: first(pv?.views),
    avgTimeMs: pv?.time?.[0]?.avg ? Math.round(pv.time[0].avg) : null,
    bounceRate: s?.sessions ? s.bounces / s.sessions : null,
    activeUsers: first(pv?.users),
    hackathonViews: first(pv?.hackathon),
    impressions: ev('impression'),
    registerClicks: ev('register'),
    clicks: ev('click'),
    signups,
    logins: ev('login'),
  };
}

export interface SeriesPoint {
  /** "2026-10-24", or "2026-10-24T14" for hourly buckets (India time). */
  key: string;
  views: number;
  visitors: number;
}

/** Visitors and page views per day (or per hour for one day), with empty buckets filled in. */
export async function trafficSeries(r: Range): Promise<SeriesPoint[]> {
  const format = r.bucket === 'hour' ? '%Y-%m-%dT%H' : '%Y-%m-%d';
  const rows = await PageView.aggregate<{ _id: string; views: number; visitors: number }>([
    { $match: { createdAt: { $gte: r.from, $lt: r.to } } },
    {
      $group: {
        _id: { $dateToString: { format, date: '$createdAt', timezone: ANALYTICS_TZ } },
        views: { $sum: 1 },
        v: { $addToSet: '$visitorId' },
      },
    },
    { $project: { views: 1, visitors: { $size: '$v' } } },
  ]);
  const byKey = new Map(rows.map((row) => [row._id, row]));
  const step = r.bucket === 'hour' ? HOUR : DAY;
  const keyOf = (t: number) => new Date(t + IST_MS).toISOString().slice(0, r.bucket === 'hour' ? 13 : 10);
  const start = r.bucket === 'hour' ? Math.floor((r.from.getTime() + IST_MS) / HOUR) * HOUR - IST_MS : istMidnight(r.from.getTime());
  const points: SeriesPoint[] = [];
  for (let t = start; t < r.to.getTime() && points.length < 800; t += step) {
    const key = keyOf(t);
    const row = byKey.get(key);
    points.push({ key, views: row?.views ?? 0, visitors: row?.visitors ?? 0 });
  }
  return points;
}

export interface CountRow {
  key: string;
  visitors: number;
  views?: number;
}
export interface PageRow {
  path: string;
  views: number;
  visitors: number;
  avgTimeMs: number | null;
}
export interface UtmRow {
  source: string;
  medium: string;
  campaign: string;
  views: number;
  visitors: number;
}

export interface Breakdowns {
  pages: PageRow[];
  referrers: CountRow[];
  utm: UtmRow[];
  devices: CountRow[];
  browsers: CountRow[];
  os: CountRow[];
  countries: CountRow[];
  cities: CountRow[];
  clicks: { label: string; clicks: number }[];
}

/** Top pages, referrers, campaigns, devices, browsers, systems and places for a range. */
export async function trafficBreakdowns(from: Date, to: Date, limit = 10, pageLimit = 10): Promise<Breakdowns> {
  const createdAt = { $gte: from, $lt: to };
  // Unique visitors per value: one row per (value, visitor) first, then count them.
  const visitorsBy = (field: unknown) => [
    { $group: { _id: { k: field, v: '$visitorId' }, n: { $sum: 1 } } },
    { $group: { _id: '$_id.k', visitors: { $sum: 1 }, views: { $sum: '$n' } } },
    { $sort: { visitors: -1 as const, views: -1 as const } },
    { $limit: limit },
  ];
  type Row = { _id: string; visitors: number; views: number };
  const [[f], clicks] = await Promise.all([
    PageView.aggregate<{
      pages: { _id: string; views: number; visitors: number; avgMs: number | null }[];
      referrers: Row[];
      utm: { _id: { s: string; m?: string; c?: string }; views: number; visitors: number }[];
      devices: Row[];
      browsers: Row[];
      os: Row[];
      countries: Row[];
      cities: Row[];
    }>([
      { $match: { createdAt } },
      {
        $facet: {
          pages: [
            { $group: { _id: '$path', views: { $sum: 1 }, v: { $addToSet: '$visitorId' }, t: { $avg: '$durationMs' } } },
            { $sort: { views: -1 } },
            { $limit: pageLimit },
            { $project: { views: 1, visitors: { $size: '$v' }, avgMs: '$t' } },
          ],
          referrers: [{ $match: { referrerHost: { $nin: ['', null] } } }, ...visitorsBy('$referrerHost')],
          utm: [
            { $match: { utmSource: { $type: 'string' } } },
            { $group: { _id: { s: '$utmSource', m: '$utmMedium', c: '$utmCampaign' }, views: { $sum: 1 }, v: { $addToSet: '$visitorId' } } },
            { $sort: { views: -1 } },
            { $limit: limit },
            { $project: { views: 1, visitors: { $size: '$v' } } },
          ],
          devices: visitorsBy('$device'),
          browsers: visitorsBy('$browser'),
          os: visitorsBy('$os'),
          countries: [{ $match: { country: { $type: 'string' } } }, ...visitorsBy('$country')],
          cities: [{ $match: { city: { $type: 'string' } } }, ...visitorsBy({ $concat: ['$city', ', ', { $ifNull: ['$country', ''] }] })],
        },
      },
    ]),
    AnalyticsEvent.aggregate<{ _id: string; n: number }>([
      { $match: { createdAt, type: 'click' } },
      { $group: { _id: '$target', n: { $sum: 1 } } },
      { $sort: { n: -1 } },
      { $limit: limit },
    ]),
  ]);
  const rows = (list: Row[] | undefined) => (list ?? []).map((r) => ({ key: r._id || 'Unknown', visitors: r.visitors, views: r.views }));
  return {
    pages: (f?.pages ?? []).map((p) => ({ path: p._id, views: p.views, visitors: p.visitors, avgTimeMs: p.avgMs ? Math.round(p.avgMs) : null })),
    referrers: rows(f?.referrers),
    utm: (f?.utm ?? []).map((u) => ({ source: u._id.s, medium: u._id.m ?? '', campaign: u._id.c ?? '', views: u.views, visitors: u.visitors })),
    devices: rows(f?.devices),
    browsers: rows(f?.browsers),
    os: rows(f?.os),
    countries: rows(f?.countries),
    cities: rows(f?.cities),
    clicks: clicks.map((c) => ({ label: c._id, clicks: c.n })),
  };
}

export interface FunnelRow {
  slug: string;
  id: string | null;
  title: string;
  state: string;
  impressions: number;
  views: number;
  visitors: number;
  registerClicks: number;
  saves: number;
}

/** Per hackathon: card impressions → page views → register clicks → saves, for a range. */
export async function hackathonFunnel(from: Date, to: Date, limit = 50): Promise<FunnelRow[]> {
  const createdAt = { $gte: from, $lt: to };
  const [views, events, saves] = await Promise.all([
    PageView.aggregate<{ _id: string; views: number; visitors: number }>([
      { $match: { createdAt, hackathonSlug: { $type: 'string' } } },
      { $group: { _id: '$hackathonSlug', views: { $sum: 1 }, v: { $addToSet: '$visitorId' } } },
      { $project: { views: 1, visitors: { $size: '$v' } } },
    ]),
    AnalyticsEvent.aggregate<{ _id: { t: string; k: AnalyticsEventType }; n: number }>([
      { $match: { createdAt, type: { $in: ['impression', 'register'] } } },
      { $group: { _id: { t: '$target', k: '$type' }, n: { $sum: 1 } } },
    ]),
    SavedEvent.aggregate<{ _id: string; n: number }>([{ $match: { createdAt } }, { $group: { _id: '$hackathonSlug', n: { $sum: 1 } } }]),
  ]);
  const rows = new Map<string, Omit<FunnelRow, 'id' | 'title' | 'state'>>();
  const row = (slug: string) => {
    let r = rows.get(slug);
    if (!r) rows.set(slug, (r = { slug, impressions: 0, views: 0, visitors: 0, registerClicks: 0, saves: 0 }));
    return r;
  };
  for (const v of views) Object.assign(row(v._id), { views: v.views, visitors: v.visitors });
  for (const e of events) {
    if (e._id.k === 'impression') row(e._id.t).impressions = e.n;
    else row(e._id.t).registerClicks = e.n;
  }
  for (const s of saves) row(s._id).saves = s.n;
  const ranked = [...rows.values()]
    .sort((a, b) => b.impressions + b.views * 5 + b.registerClicks * 20 - (a.impressions + a.views * 5 + a.registerClicks * 20))
    .slice(0, limit);
  const docs = await Hackathon.find({ slug: { $in: ranked.map((r) => r.slug) } }).select('slug title state').lean();
  const bySlug = new Map(docs.map((d) => [d.slug, d]));
  return ranked.map((r) => {
    const d = bySlug.get(r.slug);
    return { ...r, id: d ? String(d._id) : null, title: d?.title ?? r.slug, state: d?.state ?? 'deleted' };
  });
}

/** What one signed-in student did on the site: page views, devices, places, recent visits and events. */
export async function userAnalytics(userId: string) {
  const id = new Types.ObjectId(userId);
  const [[f], events] = await Promise.all([
    PageView.aggregate<{
      totals: { views: number; first: Date; last: Date; sessions: number; avgMs: number | null }[];
      devices: { _id: { device: string; browser: string; os: string }; views: number; last: Date }[];
      places: { _id: { country?: string; city?: string }; views: number }[];
      pages: { _id: string; views: number }[];
      recent: { path: string; createdAt: Date; durationMs?: number; device: string; referrerHost: string }[];
    }>([
      { $match: { userId: id } },
      {
        $facet: {
          totals: [
            { $group: { _id: null, views: { $sum: 1 }, first: { $min: '$createdAt' }, last: { $max: '$createdAt' }, s: { $addToSet: '$sessionId' }, t: { $avg: '$durationMs' } } },
            { $project: { views: 1, first: 1, last: 1, sessions: { $size: '$s' }, avgMs: '$t' } },
          ],
          devices: [
            { $group: { _id: { device: '$device', browser: '$browser', os: '$os' }, views: { $sum: 1 }, last: { $max: '$createdAt' } } },
            { $sort: { last: -1 } },
            { $limit: 10 },
          ],
          places: [{ $match: { country: { $type: 'string' } } }, { $group: { _id: { country: '$country', city: '$city' }, views: { $sum: 1 } } }, { $sort: { views: -1 } }, { $limit: 10 }],
          pages: [{ $group: { _id: '$path', views: { $sum: 1 } } }, { $sort: { views: -1 } }, { $limit: 10 }],
          recent: [{ $sort: { createdAt: -1 } }, { $limit: 25 }, { $project: { _id: 0, path: 1, createdAt: 1, durationMs: 1, device: 1, referrerHost: 1 } }],
        },
      },
    ]),
    AnalyticsEvent.find({ userId: id }).sort({ createdAt: -1 }).limit(50).select('type target createdAt').lean(),
  ]);
  const t = f?.totals?.[0];
  return {
    pageViews: t?.views ?? 0,
    sessions: t?.sessions ?? 0,
    firstSeen: t?.first ?? null,
    lastSeen: t?.last ?? null,
    avgTimeMs: t?.avgMs ? Math.round(t.avgMs) : null,
    devices: (f?.devices ?? []).map((d) => ({ ...d._id, views: d.views, last: d.last })),
    places: (f?.places ?? []).map((p) => ({ country: p._id.country ?? '', city: p._id.city ?? '', views: p.views })),
    pages: (f?.pages ?? []).map((p) => ({ path: p._id, views: p.views })),
    recent: f?.recent ?? [],
    events: events.map((e) => ({ type: e.type, target: e.target, at: e.createdAt })),
  };
}
