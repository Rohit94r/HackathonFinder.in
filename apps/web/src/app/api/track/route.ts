import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { AnalyticsEvent, connectDb, isDbConfigured, PageView, Types } from '@hackathonfinder/db';
import { clientIp } from '@/server/api';
import { getSessionUser } from '@/server/auth';
import { rateLimit } from '@/server/rateLimit';
import {
  cleanPath,
  cleanUtm,
  existingSlugs,
  geoFromHeaders,
  hackathonSlugFromPath,
  isBot,
  ownHost,
  parseUserAgent,
  referrerHost,
  VISITOR_ID,
  wantsNoTracking,
} from '@/server/analytics';

// The public site's analytics beacon (components/analytics/Tracker.tsx). Anyone can
// call it, so everything is validated, capped and rate-limited, and junk is dropped
// quietly. IP addresses are used for rate limits only and never stored.

export const dynamic = 'force-dynamic';

const MAX_BODY = 8 * 1024;
const MAX_DURATION_MS = 60 * 60 * 1000;

const pageViewId = z.string().regex(/^[a-f0-9]{24}$/);
const token = z.string().regex(VISITOR_ID);
const path = z.string().min(1).max(500);
const utmPart = z.string().max(200).optional();

const Body = z.discriminatedUnion('t', [
  z
    .object({
      t: z.literal('pv'),
      id: pageViewId,
      vid: token,
      sid: token,
      path,
      ref: z.string().max(1000).optional(),
      utm: z.object({ s: utmPart, m: utmPart, c: utmPart }).strict().optional(),
    })
    .strict(),
  z.object({ t: z.literal('leave'), id: pageViewId, vid: token, ms: z.number().int().min(0).max(24 * 60 * 60 * 1000) }).strict(),
  z
    .object({
      t: z.literal('ev'),
      vid: token,
      sid: token,
      path,
      items: z
        .array(z.object({ k: z.enum(['impression', 'click']), v: z.string().min(1).max(120) }).strict())
        .min(1)
        .max(50),
    })
    .strict(),
]);
type Body = z.infer<typeof Body>;

const status = (code: number) => new NextResponse(null, { status: code, headers: { 'Cache-Control': 'no-store' } });

/** Only pages on this site may send beacons. */
function sameSite(req: NextRequest): boolean {
  if (req.headers.get('sec-fetch-site') === 'cross-site') return false;
  const origin = req.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === (req.headers.get('host') ?? req.nextUrl.host);
  } catch {
    return false;
  }
}

const userObjectId = async () => {
  const user = await getSessionUser().catch(() => null);
  return user?.id && Types.ObjectId.isValid(user.id) ? new Types.ObjectId(user.id) : undefined;
};

async function savePageView(req: NextRequest, body: Extract<Body, { t: 'pv' }>, ua: string) {
  const clean = cleanPath(body.path);
  if (!clean) return;
  const slug = hackathonSlugFromPath(clean);
  const [userId, known] = await Promise.all([userObjectId(), slug ? existingSlugs([slug]) : Promise.resolve(new Set<string>())]);
  const { device, browser, os } = parseUserAgent(ua);
  try {
    await PageView.create({
      _id: new Types.ObjectId(body.id),
      visitorId: body.vid,
      sessionId: body.sid,
      userId,
      path: clean,
      hackathonSlug: slug && known.has(slug) ? slug : undefined,
      referrerHost: referrerHost(body.ref, ownHost(req)),
      utmSource: cleanUtm(body.utm?.s),
      utmMedium: cleanUtm(body.utm?.m),
      utmCampaign: cleanUtm(body.utm?.c),
      device,
      browser,
      os,
      ...geoFromHeaders(req.headers),
    });
  } catch (err) {
    // The same beacon sent twice: the first one counts.
    if ((err as { code?: number }).code !== 11000) throw err;
  }
}

/** Time on page: the longest report wins, since the page can be hidden and shown again. */
async function saveDuration(body: Extract<Body, { t: 'leave' }>) {
  if (body.ms < 200) return;
  await PageView.updateOne(
    { _id: new Types.ObjectId(body.id), visitorId: body.vid, createdAt: { $gte: new Date(Date.now() - 12 * 60 * 60 * 1000) } },
    { $max: { durationMs: Math.min(body.ms, MAX_DURATION_MS) } }
  );
}

const cleanLabel = (v: string) => v.replace(/[^\p{L}\p{N} _.:/#-]/gu, '').trim().slice(0, 80);

async function saveEvents(body: Extract<Body, { t: 'ev' }>) {
  const clean = cleanPath(body.path);
  if (!clean) return;
  const impressions = [...new Set(body.items.filter((i) => i.k === 'impression').map((i) => i.v))];
  const clicks = body.items
    .filter((i) => i.k === 'click')
    .map((i) => cleanLabel(i.v))
    .filter(Boolean)
    .slice(0, 20);
  const [known, userId] = await Promise.all([existingSlugs(impressions), userObjectId()]);
  const base = { visitorId: body.vid, sessionId: body.sid, userId, path: clean, meta: {} };
  const rows = [
    ...[...known].map((slug) => ({ ...base, type: 'impression' as const, target: slug })),
    ...clicks.map((label) => ({ ...base, type: 'click' as const, target: label })),
  ];
  if (rows.length) await AnalyticsEvent.insertMany(rows, { ordered: false });
}

/** Records a page view, the time spent on it, or a batch of impressions and clicks. Always fast; 204 when accepted. */
export async function POST(req: NextRequest) {
  const ua = req.headers.get('user-agent') ?? '';
  if (!isDbConfigured() || isBot(ua) || wantsNoTracking(req.headers) || !sameSite(req)) return status(204);
  if (!rateLimit(`track:${clientIp(req)}`, 600, 60_000)) return status(429);
  if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY) return status(413);

  let raw: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY) return status(413);
    raw = JSON.parse(text);
  } catch {
    return status(400);
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return status(400);
  const body = parsed.data;
  if (!rateLimit(`track-v:${body.vid}`, 240, 60_000)) return status(429);

  try {
    await connectDb();
    if (body.t === 'pv') await savePageView(req, body, ua);
    else if (body.t === 'leave') await saveDuration(body);
    else await saveEvents(body);
  } catch (err) {
    console.error('[track] Could not record:', err);
  }
  return status(204);
}
