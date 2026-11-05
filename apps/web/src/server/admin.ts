import 'server-only';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';
import {
  Activity,
  AdminAction,
  AgentRun,
  AuthToken,
  connectDb,
  ContentFlag,
  Conversation,
  DigestSubscriber,
  Hackathon,
  Invite,
  isDbConfigured,
  Message,
  Notification,
  notify,
  PageView,
  AnalyticsEvent,
  RawItem,
  Reply,
  Report,
  SavedEvent,
  Source,
  Submission,
  slugify,
  TeamPost,
  TeamRequest,
  Thread,
  Types,
  uniqueSlug,
  User,
  Win,
  type IAgentRun,
  type IHackathon,
  type ISource,
  type ISourceRef,
  type ISubmission,
  type IUser,
  type Role,
} from '@hackathonfinder/db';
import type { HydratedDocument, Model } from 'mongoose';
import { cityPoint, isAiEnabled, templateSummary } from '@hackathonfinder/ai';
import { placeName, sourceBySlug } from '@hackathonfinder/shared';
import {
  cityForForm,
  draftToForm,
  EMPTY_LISTING_FORM,
  toIstInput,
  type Draft,
  type ListingFormValues,
  type ListingInputValues,
} from '@/components/admin/listingFields';
import { ApiError, badRequest, forbidden, notFound, route, type Ctx } from './api';
import { hackathonFunnel, istMidnight, previousRange, resolveRange, trafficBreakdowns, trafficSeries, trafficSummary, userAnalytics } from './analytics';
import { enabledProviders, getSessionUser, type SessionUser } from './auth';
import { sendEmail, siteUrl } from './email';
import { rateLimit } from './rateLimit';
import { listScrapeRuns, SCRAPE_SCHEDULE, type ScrapeItem, type ScrapeRunSummary } from './scrape';
import { listingsChanged } from './hackathons';
import { storageMode } from './storage';
import { isSocialLink, sourceFor, submissionTitle } from './submissions';
import { adminEmails, grantsAdmin, isAdminEmail } from './users';

const DAY = 24 * 60 * 60 * 1000;
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// ---------- Who may use the admin area ----------

/**
 * The session says "admin", but roles can change after sign-in, so check the
 * account itself too. A demoted or banned admin loses access at once.
 */
async function stillAdmin(user: SessionUser): Promise<boolean> {
  if (!isDbConfigured()) return user.role === 'admin';
  if (!/^[a-f0-9]{24}$/i.test(user.id)) return false;
  await connectDb();
  const doc = await User.findById(user.id).select('role email emailVerified banned deletedAt').lean();
  if (!doc || doc.banned || doc.deletedAt) return false;
  return doc.role === 'admin' || grantsAdmin(doc);
}

/** Where to go after the admin sign-in: only pages inside /admin (never the sign-in page itself). */
export function safeAdminNext(value: string | string[] | null | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const path = raw.trim();
  if (!/^\/admin(?:[/?#]|$)/.test(path) || /^\/admin\/login(?:[/?#]|$)/.test(path)) return null;
  if (path.includes('//') || path.includes('\\')) return null;
  return path.slice(0, 500);
}

/** The signed-in admin, or null for everyone else (signed out, not an admin, banned). */
export async function currentAdmin(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') return null;
  return (await stillAdmin(user)) ? user : null;
}

/**
 * For admin pages. Signed-out visitors go to the admin sign-in and come back here
 * afterwards; signed-in accounts that aren't admins see "This account isn't an admin".
 * Every page calls it, because layouts don't re-run when moving between admin pages.
 */
export async function requireAdminPage(next?: string): Promise<SessionUser> {
  const path = safeAdminNext(next ?? (await headers()).get('x-hf-admin-path')) ?? '/admin';
  const user = await getSessionUser();
  if (!user) redirect(`/admin/login?next=${encodeURIComponent(path)}`);
  if (user.role !== 'admin' || !(await stillAdmin(user))) redirect('/admin/login?denied=1');
  return user;
}

/** Changes must come from our own pages: a browser always sends Origin on POST, PATCH and DELETE. */
function sameOrigin(req: NextRequest): boolean {
  if (req.headers.get('sec-fetch-site') === 'cross-site') return false;
  const origin = req.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === (req.headers.get('host') ?? req.nextUrl.host);
  } catch {
    return false;
  }
}

type AdminHandler<P> = (ctx: Ctx<P> & { user: SessionUser }) => Promise<unknown>;

/**
 * route() for /api/admin/**: admins only, checked against the account on every call.
 * Changes (anything but GET) also need a same-origin request and have their own,
 * tighter rate limit.
 */
export function adminRoute<P = Record<string, string>>(handler: AdminHandler<P>, rate?: { limit: number; windowMs: number }) {
  return route<P>(
    async (ctx) => {
      if (!(await stillAdmin(ctx.user!))) throw forbidden('This is for admins only.');
      if (!SAFE_METHODS.has(ctx.req.method)) {
        if (!sameOrigin(ctx.req)) throw forbidden('That request didn’t come from the admin pages.');
        if (!rateLimit(`admin-write:${ctx.user!.id}`, 90, 60_000)) {
          throw new ApiError(429, 'rate_limited', 'Too many changes in a minute. Wait a moment and try again.');
        }
      }
      return handler(ctx as Ctx<P> & { user: SessionUser });
    },
    // A custom limit counts per path; the default one is shared by all admin calls.
    { auth: 'admin', rate: rate ?? { limit: 300, windowMs: 60_000, key: 'admin' } }
  );
}

/** A route's [id] param, or a 404 when it isn't an id at all. */
export function idParam(id: string | undefined, what = 'That'): string {
  if (!id || !/^[a-f0-9]{24}$/i.test(id)) throw notFound(what);
  return id;
}

/** Case-insensitive "contains" match for admin search boxes. */
export function searchRegex(q: string): RegExp {
  return new RegExp(q.trim().slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

const oid = (id: string) => new Types.ObjectId(id);
const excerpt = (text: string | undefined | null, n = 160) => {
  const t = (text ?? '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

// ---------- Audit log ----------

/** Records an admin change. Never throws: a failed log line shouldn't undo the change. */
export async function audit(
  admin: Pick<SessionUser, 'id' | 'handle'>,
  action: string,
  targetType: string,
  targetId: string | undefined,
  summary: string,
  meta: Record<string, unknown> = {}
): Promise<void> {
  try {
    await AdminAction.create({
      adminId: oid(admin.id),
      adminHandle: admin.handle,
      action,
      targetType,
      targetId,
      summary: summary.slice(0, 500),
      meta,
    });
  } catch (err) {
    console.error('[admin] Could not write the audit log:', err);
  }
}

export async function listAudit(opts: { q: string; action: string; page: number; limit: number }) {
  const filter: Record<string, unknown> = {};
  if (opts.action) filter.action = opts.action;
  if (opts.q) {
    const rx = searchRegex(opts.q);
    filter.$or = [{ summary: rx }, { adminHandle: rx }, { targetId: rx }];
  }
  const [total, rows, actions] = await Promise.all([
    AdminAction.countDocuments(filter),
    AdminAction.find(filter)
      .sort({ createdAt: -1 })
      .skip((opts.page - 1) * opts.limit)
      .limit(opts.limit)
      .lean(),
    AdminAction.distinct('action'),
  ]);
  return {
    items: rows.map((r) => ({
      id: String(r._id),
      adminId: String(r.adminId),
      adminHandle: r.adminHandle,
      action: r.action,
      targetType: r.targetType,
      targetId: r.targetId ?? '',
      summary: r.summary,
      createdAt: r.createdAt,
    })),
    actions: (actions as string[]).sort(),
    total,
    page: opts.page,
    pages: Math.max(1, Math.ceil(total / opts.limit)),
  };
}

// ---------- Shapes sent to the admin UI ----------

type LeanHackathon = IHackathon & { _id: unknown };

export function listingRow(h: LeanHackathon) {
  return {
    id: String(h._id),
    slug: h.slug,
    title: h.title,
    organizer: h.organizer ?? '',
    state: h.state,
    mode: h.mode,
    city: h.city ?? '',
    cityName: h.cityName ?? '',
    place: placeName({ mode: h.mode, city: h.city, cityName: h.cityName }),
    startDate: h.startDate,
    endDate: h.endDate,
    registrationDeadline: h.registrationDeadline,
    sources: h.sources ?? [],
    sourceRefs: (h.sourceRefs ?? []).map((r) => ({ source: r.source, url: r.url, lastSeenAt: r.lastSeenAt })),
    confidence: h.confidence ?? 1,
    flags: h.flags ?? [],
    featured: Boolean(h.featured),
    verified: Boolean(h.verified),
    imageUrl: h.imageUrl ?? '',
    registrationUrl: h.registrationUrl,
    registrationVia: h.registrationVia === 'qr' ? ('qr' as const) : ('link' as const),
    removedReason: h.removedReason ?? '',
    removedAt: h.removedAt ?? null,
    submittedBy: h.submittedBy ? String(h.submittedBy) : null,
    stats: h.stats ?? { views: 0, saves: 0, registerClicks: 0 },
    createdAt: h.createdAt,
    updatedAt: h.updatedAt,
  };
}
export type ListingRow = ReturnType<typeof listingRow>;

type Person = { id: string; handle: string; name: string; email: string };

/** Handles and names for a set of user ids (deleted accounts show as they are now). */
async function userMap(ids: unknown[]): Promise<Map<string, Person>> {
  const list = [...new Set(ids.filter(Boolean).map(String))].filter((id) => /^[a-f0-9]{24}$/i.test(id));
  if (!list.length) return new Map();
  const users = await User.find({ _id: { $in: list } }).select('handle name email').lean();
  return new Map(users.map((u) => [String(u._id), { id: String(u._id), handle: u.handle, name: u.name, email: u.email ?? '' }]));
}

/** Adds who shared each listing (for listings that came from a student or organizer). */
export async function withSubmitters<T extends { submittedBy: string | null }>(rows: T[]) {
  const people = await userMap(rows.map((r) => r.submittedBy));
  return rows.map((r) => {
    const p = r.submittedBy ? people.get(r.submittedBy) : undefined;
    return { ...r, submitter: p ? { id: p.id, handle: p.handle, name: p.name } : null };
  });
}

/** A stored listing → the editor's fields (dates in India time). */
export function listingToForm(h: LeanHackathon): ListingFormValues {
  const [lng, lat] = h.location?.coordinates ?? [];
  const point = cityPoint(h.city);
  // Only show coordinates when they differ from the city centre (a real venue point).
  const exact = typeof lat === 'number' && !(point && Math.abs(point.lat - lat) < 1e-6 && Math.abs(point.lng - lng) < 1e-6);
  const city = cityForForm(h.city);
  return {
    ...EMPTY_LISTING_FORM,
    title: h.title,
    tagline: h.tagline ?? '',
    type: h.type,
    organizer: h.organizer ?? '',
    organizerType: h.organizerType ?? 'community',
    mode: h.mode,
    ...city,
    cityName: city.city === 'other' ? h.cityName || city.cityName : '',
    venue: h.venue ?? '',
    country: h.country ?? 'India',
    lat: exact ? String(lat) : '',
    lng: exact ? String(lng) : '',
    startDate: toIstInput(h.startDate),
    endDate: toIstInput(h.endDate),
    registrationDeadline: toIstInput(h.registrationDeadline),
    teamMin: String(h.teamMin ?? 1),
    teamMax: String(h.teamMax ?? 4),
    eligibility: h.eligibility?.length ? h.eligibility : ['students'],
    fee: String(h.fee ?? 0),
    prizePool: String(h.prizePool ?? 0),
    prizeCurrency: h.prizeCurrency ?? 'INR',
    prizes: (h.prizes ?? []).join('\n'),
    perks: (h.perks ?? []).join('\n'),
    themes: h.themes ?? [],
    beginnerFriendly: Boolean(h.beginnerFriendly),
    featured: Boolean(h.featured),
    verified: Boolean(h.verified),
    registrationUrl: h.registrationUrl ?? '',
    registrationVia: h.registrationVia === 'qr' ? 'qr' : 'link',
    summary: h.summary ?? '',
    imageUrl: h.imageUrl ?? '',
    logoUrl: h.logoUrl ?? '',
  };
}

type LeanSubmission = ISubmission & { _id: unknown };

export function submissionRow(s: LeanSubmission, users: Map<string, { handle: string; name: string }>) {
  const draft = (s.extracted ?? null) as Draft | null;
  const user = s.userId ? users.get(String(s.userId)) : undefined;
  return {
    id: String(s._id),
    kind: s.kind,
    status: s.status,
    title: submissionTitle(s),
    url: s.url ?? '',
    seenOn: s.seenOn ?? '',
    source: sourceFor(s.url, s.seenOn),
    posterUrl: s.posterUrl ?? '',
    imageUrl: s.posterUrl || s.imageUrls?.[0] || '',
    email: s.email ?? '',
    userId: s.userId ? String(s.userId) : null,
    user: user ? { handle: user.handle, name: user.name } : null,
    method: draft?.method ?? null,
    confidence: typeof draft?.confidence === 'number' ? draft.confidence : null,
    isEvent: draft?.isEvent ?? null,
    missing: draft?.missing ?? [],
    duplicateOf: draft?.duplicateOf ?? null,
    hackathonId: s.hackathonId ? String(s.hackathonId) : null,
    reviewNote: s.reviewNote ?? '',
    createdAt: s.createdAt,
    reviewedAt: s.reviewedAt ?? null,
  };
}

// ---------- Overview ----------

export async function getOverview() {
  await connectDb();
  const since = new Date(Date.now() - DAY);
  const week = new Date(Date.now() - 7 * DAY);
  const [live, pending, pendingSubs, openReports, users, newUsers, runs, failedRuns, queuedRuns, health, recentRuns, recentSubs] = await Promise.all([
    Hackathon.countDocuments({ state: 'live' }),
    Hackathon.countDocuments({ state: 'pending' }),
    Submission.countDocuments({ status: { $in: ['pending', 'processing'] } }),
    Report.countDocuments({ status: 'open' }),
    User.countDocuments({ isSample: { $ne: true }, deletedAt: null }),
    User.countDocuments({ isSample: { $ne: true }, deletedAt: null, createdAt: { $gte: week } }),
    AgentRun.countDocuments({ startedAt: { $gte: since } }),
    AgentRun.countDocuments({ startedAt: { $gte: since }, status: 'failed' }),
    AgentRun.countDocuments({ status: 'queued' }),
    Source.aggregate<{ _id: ISource['health']; n: number; enabled: number }>([
      { $group: { _id: '$health', n: { $sum: 1 }, enabled: { $sum: { $cond: ['$enabled', 1, 0] } } } },
    ]),
    AgentRun.find().sort({ startedAt: -1 }).limit(6).select('-log -errorLog -items').lean(),
    Submission.find({ status: { $in: ['pending', 'processing'] } }).sort({ createdAt: -1 }).limit(5).lean(),
  ]);
  const users24 = await userMap(recentSubs.map((s) => s.userId));
  const byHealth = { ok: 0, degraded: 0, failing: 0, blocked: 0, unknown: 0 };
  for (const h of health) byHealth[h._id ?? 'unknown'] = (byHealth[h._id ?? 'unknown'] ?? 0) + h.n;
  return {
    counts: { live, pending, pendingSubs, openReports, users, newUsers, runs, failedRuns, queuedRuns },
    sourceHealth: byHealth,
    sourceTotal: health.reduce((n, h) => n + h.n, 0),
    recentRuns: recentRuns.map(runRow),
    recentSubmissions: recentSubs.map((s) => submissionRow(s, users24)),
  };
}

/** Numbers for the sidebar badges. */
export async function getBadgeCounts() {
  const [pendingListings, pendingSubmissions, openReports, scraping] = await Promise.all([
    Hackathon.countDocuments({ state: 'pending' }),
    Submission.countDocuments({ status: { $in: ['pending', 'processing'] } }),
    Report.countDocuments({ status: 'open' }),
    AgentRun.exists({ agent: 'scrape', status: { $in: ['queued', 'running'] } }),
  ]);
  return { review: pendingListings + pendingSubmissions, pendingListings, pendingSubmissions, openReports, scraping: Boolean(scraping) };
}

// ---------- Listings ----------

/** Validated editor fields → the stored listing's fields. */
export function inputToListing(v: ListingInputValues): Partial<IHackathon> {
  const city = v.mode === 'online' ? '' : v.city === 'other' ? slugify(v.cityName, 40) : v.city;
  const point = v.mode === 'online' ? undefined : v.lat !== null && v.lng !== null ? { lat: v.lat, lng: v.lng } : cityPoint(city);
  return {
    title: v.title,
    tagline: v.tagline,
    type: v.type,
    organizer: v.organizer,
    organizerType: v.organizerType,
    mode: v.mode,
    city: city || undefined,
    cityName: v.mode !== 'online' && v.city === 'other' ? v.cityName : undefined,
    venue: v.mode === 'online' ? undefined : v.venue || undefined,
    country: v.country,
    location: point ? { type: 'Point', coordinates: [point.lng, point.lat] } : undefined,
    startDate: v.startDate,
    endDate: v.endDate,
    registrationDeadline: v.registrationDeadline,
    teamMin: v.teamMin,
    teamMax: v.teamMax,
    eligibility: v.eligibility,
    fee: v.fee,
    prizePool: v.prizePool,
    prizeCurrency: v.prizeCurrency,
    prizes: v.prizes,
    perks: v.perks,
    themes: v.themes,
    beginnerFriendly: v.beginnerFriendly,
    featured: v.featured,
    verified: v.verified,
    registrationUrl: v.registrationUrl,
    registrationVia: v.registrationVia ?? 'link',
    summary:
      v.summary ||
      templateSummary({
        type: v.type,
        mode: v.mode,
        organizer: v.organizer,
        city: city || undefined,
        themes: v.themes,
        teamMin: v.teamMin,
        teamMax: v.teamMax,
        fee: v.fee,
        beginnerFriendly: v.beginnerFriendly,
      }),
    imageUrl: v.imageUrl || undefined,
    logoUrl: v.logoUrl || undefined,
    lastChecked: new Date(),
  };
}

export interface ListingPatch {
  fields?: ListingInputValues;
  state?: IHackathon['state'];
  featured?: boolean;
  verified?: boolean;
  /** Replace just the banner (an uploaded image or a pasted link); empty clears it. */
  imageUrl?: string;
  registrationVia?: 'link' | 'qr';
  /** Why it was removed or rejected; kept on the listing and in its flags. */
  note?: string;
}

const STATE_VERBS: Record<IHackathon['state'], string> = { live: 'Made live', pending: 'Sent back to review', rejected: 'Rejected', removed: 'Removed' };

/** Edits a listing and/or moves it between states (approve, reject, remove, restore). */
export async function updateListing(id: string, patch: ListingPatch, admin: SessionUser, opts: { quiet?: boolean } = {}) {
  const doc = await Hackathon.findById(id);
  if (!doc) throw notFound('That listing');
  const before = doc.state;
  const changes: string[] = [];
  // The slug stays as it is, so shared links keep working after a title edit.
  if (patch.fields) {
    for (const [key, value] of Object.entries(inputToListing(patch.fields))) doc.set(key, value);
    changes.push('edited the details');
  }
  if (patch.featured !== undefined && patch.featured !== doc.featured) {
    doc.featured = patch.featured;
    changes.push(patch.featured ? 'featured it' : 'unfeatured it');
  }
  if (patch.verified !== undefined && patch.verified !== doc.verified) {
    doc.verified = patch.verified;
    changes.push(patch.verified ? 'verified it' : 'unverified it');
  }
  if (patch.imageUrl !== undefined) {
    doc.imageUrl = patch.imageUrl || undefined;
    changes.push(patch.imageUrl ? 'replaced the banner' : 'removed the banner');
  }
  if (patch.registrationVia && patch.registrationVia !== doc.registrationVia) {
    doc.registrationVia = patch.registrationVia;
    changes.push(patch.registrationVia === 'qr' ? 'marked registration as QR' : 'marked registration as a link');
  }
  if (patch.state && patch.state !== before) {
    const by = `@${admin.handle}${patch.note ? `: ${patch.note}` : ''}`;
    // Flags explain why it waited in the queue; once a person approves it they're settled.
    if (patch.state === 'live' && before === 'pending') doc.flags = [];
    if (patch.state === 'rejected') doc.flags = [...(doc.flags ?? []), `Rejected by ${by}`];
    if (patch.state === 'removed') doc.flags = [...(doc.flags ?? []), `Removed by ${by}`];
    if (patch.state === 'live' && (before === 'removed' || before === 'rejected')) doc.flags = [...(doc.flags ?? []), `Restored by ${by}`];
    if (patch.state === 'removed' || patch.state === 'rejected') {
      doc.removedReason = (patch.note || (patch.state === 'removed' ? 'Removed by an admin' : 'Rejected by an admin')).slice(0, 300);
      doc.removedBy = oid(admin.id);
      doc.removedAt = new Date();
    } else {
      doc.removedReason = undefined;
      doc.removedBy = undefined;
      doc.removedAt = undefined;
    }
    doc.state = patch.state;
    changes.push(`${STATE_VERBS[patch.state].toLowerCase()} (was ${before})${patch.note ? `: ${patch.note}` : ''}`);
  }
  await doc.save();
  if (before === 'pending' && doc.state === 'live' && doc.submittedBy) {
    await notify(doc.submittedBy, 'listing-live', `“${doc.title}” is live`, 'Thanks for sharing it. Students can find it now.', `/hackathons/${doc.slug}`);
  }
  if (!opts.quiet && changes.length) {
    const action = patch.state && patch.state !== before ? `listing.${patch.state === 'live' ? (before === 'pending' ? 'approve' : 'restore') : patch.state === 'removed' ? 'remove' : patch.state}` : 'listing.edit';
    await audit(admin, action, 'listing', String(doc._id), `“${doc.title}”: ${changes.join(', ')}`);
  }
  listingsChanged();
  return listingRow(doc.toObject());
}

/** Deletes a listing for good, with its saves. Reports and raw items stay, unlinked. */
export async function deleteListing(id: string, admin: SessionUser, opts: { quiet?: boolean } = {}) {
  const doc = await Hackathon.findById(id).select('slug title').lean();
  if (!doc) throw notFound('That listing');
  await Promise.all([
    Hackathon.deleteOne({ _id: doc._id }),
    SavedEvent.deleteMany({ hackathonSlug: doc.slug }),
    RawItem.updateMany({ hackathonId: doc._id }, { $unset: { hackathonId: 1 } }),
    Submission.updateMany({ hackathonId: doc._id }, { $unset: { hackathonId: 1 } }),
  ]);
  if (!opts.quiet) await audit(admin, 'listing.delete', 'listing', String(doc._id), `Deleted “${doc.title}” (${doc.slug}) permanently`);
  listingsChanged();
  return { id: String(doc._id), slug: doc.slug, title: doc.title };
}

export type BulkAction = 'live' | 'remove' | 'restore' | 'feature' | 'unfeature' | 'verify' | 'unverify' | 'delete';

/** One action on many listings (up to 100). Each listing is handled on its own, so one failure doesn't stop the rest. */
export async function bulkListings(ids: string[], action: BulkAction, admin: SessionUser, note = '') {
  const done: string[] = [];
  const failed: { id: string; error: string }[] = [];
  const titles: string[] = [];
  for (const id of [...new Set(ids)].slice(0, 100)) {
    try {
      if (action === 'delete') {
        titles.push((await deleteListing(id, admin, { quiet: true })).title);
      } else {
        const patch: ListingPatch =
          action === 'live' || action === 'restore'
            ? { state: 'live', note }
            : action === 'remove'
              ? { state: 'removed', note }
              : action === 'feature' || action === 'unfeature'
                ? { featured: action === 'feature' }
                : { verified: action === 'verify' };
        titles.push((await updateListing(id, patch, admin, { quiet: true })).title);
      }
      done.push(id);
    } catch (err) {
      failed.push({ id, error: err instanceof ApiError ? err.message : 'Something went wrong.' });
    }
  }
  if (done.length) {
    const list = titles.slice(0, 8).map((t) => `“${t}”`).join(', ');
    await audit(admin, `listing.bulk-${action}`, 'listing', undefined, `${action} on ${done.length} listing${done.length === 1 ? '' : 's'}: ${list}${titles.length > 8 ? ', …' : ''}${note ? ` (${note})` : ''}`, {
      ids: done.slice(0, 100),
    });
  }
  listingsChanged();
  return { done, failed };
}

export async function getListingDetail(id: string) {
  const doc = await Hackathon.findById(id).lean();
  if (!doc) throw notFound('That listing');
  const since = new Date(Date.now() - 30 * DAY);
  const [raw, subs, reports, impressions30, views30, registers30, people] = await Promise.all([
    RawItem.find({ hackathonId: doc._id })
      .sort({ fetchedAt: -1 })
      .limit(20)
      .select('source url title status confidence notes imageUrls fetchedAt error text')
      .lean(),
    Submission.find({ hackathonId: doc._id }).sort({ createdAt: -1 }).limit(20).lean(),
    Report.find({ hackathonSlug: doc.slug }).sort({ createdAt: -1 }).limit(20).lean(),
    AnalyticsEvent.countDocuments({ target: doc.slug, type: 'impression', createdAt: { $gte: since } }),
    PageView.countDocuments({ hackathonSlug: doc.slug, createdAt: { $gte: since } }),
    AnalyticsEvent.countDocuments({ target: doc.slug, type: 'register', createdAt: { $gte: since } }),
    userMap([doc.submittedBy, doc.removedBy]),
  ]);
  const users = await userMap(subs.map((s) => s.userId));
  const person = (id: unknown) => {
    const p = id ? people.get(String(id)) : undefined;
    return p ? { id: p.id, handle: p.handle, name: p.name } : null;
  };
  return {
    listing: {
      ...listingRow(doc),
      tagline: doc.tagline ?? '',
      summary: doc.summary ?? '',
      sourceImageUrl: doc.sourceImageUrl ?? '',
      submitter: person(doc.submittedBy),
      removedBy: person(doc.removedBy),
    },
    form: listingToForm(doc),
    last30: { impressions: impressions30, views: views30, registerClicks: registers30 },
    rawItems: raw.map((r) => ({
      id: String(r._id),
      source: r.source,
      url: r.url,
      title: r.title ?? '',
      status: r.status,
      confidence: r.confidence ?? null,
      notes: r.notes ?? [],
      imageUrls: r.imageUrls ?? [],
      error: r.error ?? '',
      text: excerpt(r.text, 600),
      fetchedAt: r.fetchedAt,
    })),
    submissions: subs.map((s) => submissionRow(s, users)),
    reports: reports.map((r) => ({ id: String(r._id), reason: r.reason, details: r.details, status: r.status, createdAt: r.createdAt })),
  };
}

/** Adds a place we found the event, keeping one ref per (source, url). */
function addRef(refs: ISourceRef[], ref: { source: string; url: string; externalId?: string }) {
  const now = new Date();
  const same = refs.find((r) => r.source === ref.source && r.url === ref.url);
  if (same) same.lastSeenAt = now;
  else refs.push({ ...ref, firstSeenAt: now, lastSeenAt: now });
}

/** Empty or zero fields on `target` filled from `from`, never overwriting what a person or the pipeline set. */
function fillGaps(target: HydratedDocument<IHackathon>, from: Partial<IHackathon>) {
  const keys: (keyof IHackathon)[] = ['tagline', 'organizer', 'venue', 'summary', 'imageUrl', 'logoUrl', 'city'];
  for (const k of keys) if (!target.get(k) && from[k]) target.set(k, from[k]);
  if (!target.prizePool && from.prizePool) {
    target.prizePool = from.prizePool;
    if (from.prizeCurrency) target.prizeCurrency = from.prizeCurrency;
  }
  if (!target.prizes?.length && from.prizes?.length) target.prizes = from.prizes;
  if (!target.perks?.length && from.perks?.length) target.perks = from.perks;
  if (!target.location && from.location) target.location = from.location;
  if ((!target.themes?.length || (target.themes.length === 1 && target.themes[0] === 'open-innovation')) && from.themes?.length) target.themes = from.themes;
}

function addSources(target: HydratedDocument<IHackathon>, slugs: string[]) {
  const next = [...(target.sources ?? [])];
  for (const s of slugs) if (s && !next.includes(s)) next.push(s);
  target.sources = next;
}

/** Moves a pending (or duplicate) listing's sources into another listing and hides it. */
export async function mergeListing(fromId: string, intoId: string, admin: SessionUser) {
  if (fromId === intoId) throw forbidden('A listing can’t be merged into itself.');
  const [from, into] = await Promise.all([Hackathon.findById(fromId), Hackathon.findById(intoId)]);
  if (!from) throw notFound('That listing');
  if (!into) throw notFound('The listing to merge into');
  for (const ref of from.sourceRefs ?? []) addRef(into.sourceRefs, { source: ref.source, url: ref.url, externalId: ref.externalId });
  addSources(into, from.sources ?? []);
  fillGaps(into, from.toObject());
  into.lastChecked = new Date();
  await into.save();

  from.state = 'removed';
  from.flags = [...(from.flags ?? []), `Merged into ${into.slug} by @${admin.handle}`];
  from.removedReason = `Duplicate of ${into.slug}`;
  from.removedBy = oid(admin.id);
  from.removedAt = new Date();
  await from.save();

  await Promise.all([
    RawItem.updateMany({ hackathonId: from._id }, { $set: { hackathonId: into._id, status: 'merged' } }),
    Submission.updateMany({ hackathonId: from._id }, { $set: { hackathonId: into._id } }),
    moveSaves(from.slug, into.slug),
  ]);
  await audit(admin, 'listing.merge', 'listing', String(from._id), `Merged “${from.title}” into “${into.title}”`, { intoId: String(into._id) });
  listingsChanged();
  return { slug: into.slug, id: String(into._id) };
}

/** Students who saved the old listing keep it under the new one (once). */
async function moveSaves(fromSlug: string, intoSlug: string) {
  const saves = await SavedEvent.find({ hackathonSlug: fromSlug }).lean();
  for (const s of saves) {
    const has = await SavedEvent.exists({ userId: s.userId, hackathonSlug: intoSlug });
    if (has) await SavedEvent.deleteOne({ _id: s._id });
    else await SavedEvent.updateOne({ _id: s._id }, { $set: { hackathonSlug: intoSlug } });
  }
}

// ---------- Submissions ----------

function submissionRefs(sub: LeanSubmission | HydratedDocument<ISubmission>, fallbackUrl: string) {
  const refs: { source: string; url: string; externalId?: string }[] = [];
  const source = sourceFor(sub.url, sub.seenOn);
  const url = sub.url || fallbackUrl;
  if (source !== 'submissions') refs.push({ source, url });
  refs.push({ source: 'submissions', url, externalId: String(sub._id) });
  return refs;
}

async function tellSubmitter(sub: HydratedDocument<ISubmission>, listing: { slug: string; title: string }, merged: boolean) {
  const href = `/hackathons/${listing.slug}`;
  if (sub.userId) {
    await notify(
      sub.userId,
      'listing-live',
      merged ? `“${listing.title}” is on HackathonFinder` : `“${listing.title}” is live`,
      merged ? 'Thanks for sharing it. We already had it, and your link is now part of the listing.' : 'Thanks for sharing it. Students can find it now.',
      href
    );
  }
  if (sub.email) {
    await sendEmail({
      to: sub.email,
      subject: `“${listing.title}” is live on HackathonFinder`,
      text: `Hi,\n\nThanks for sharing “${listing.title}”. ${merged ? 'It was already listed, and your share helped us keep it up to date.' : 'Our team checked it and it’s now live, so students near you can find it.'}\n\nKeep them coming!\nThe HackathonFinder team`,
      action: { label: 'See the listing', url: `${siteUrl()}${href}` },
    });
  }
}

async function loadPendingSubmission(id: string) {
  const sub = await Submission.findById(id);
  if (!sub) throw notFound('That submission');
  return sub;
}

/** Approve: a new live listing from the edited draft. */
export async function approveSubmission(id: string, input: ListingInputValues, admin: SessionUser, note = '') {
  const sub = await loadPendingSubmission(id);
  if (sub.status === 'approved' || sub.status === 'merged') throw forbidden('This submission was already reviewed.');
  const fields = inputToListing(input);
  const refs: ISourceRef[] = [];
  for (const r of submissionRefs(sub, input.registrationUrl)) addRef(refs, r);
  const listing = await Hackathon.create({
    ...fields,
    slug: await uniqueSlug(Hackathon, input.title),
    state: 'live',
    confidence: 1,
    flags: [],
    sources: [...new Set(refs.map((r) => r.source))],
    sourceRefs: refs,
    submittedBy: sub.userId,
  });
  sub.status = 'approved';
  sub.hackathonId = listing._id;
  sub.reviewedBy = oid(admin.id);
  sub.reviewedAt = new Date();
  sub.reviewNote = note;
  await sub.save();
  await tellSubmitter(sub, listing, false);
  await audit(admin, 'submission.approve', 'submission', String(sub._id), `Approved a submission as “${listing.title}”`, { hackathonId: String(listing._id) });
  listingsChanged();
  return { id: String(listing._id), slug: listing.slug };
}

/** Merge: the submission's link joins an existing listing, filling any gaps. */
export async function mergeSubmission(id: string, hackathonId: string, admin: SessionUser, note = '') {
  const sub = await loadPendingSubmission(id);
  if (sub.status === 'approved' || sub.status === 'merged') throw forbidden('This submission was already reviewed.');
  const into = await Hackathon.findById(hackathonId);
  if (!into) throw notFound('The listing to merge into');
  for (const r of submissionRefs(sub, into.registrationUrl)) addRef(into.sourceRefs, r);
  addSources(into, into.sourceRefs.map((r) => r.source));
  const draft = (sub.extracted ?? {}) as Draft;
  const form = draftToForm(draft, { imageUrl: sub.posterUrl });
  fillGaps(into, {
    tagline: form.tagline,
    organizer: form.organizer,
    venue: form.venue,
    summary: form.summary,
    imageUrl: form.imageUrl || undefined,
    prizePool: Number(form.prizePool) || 0,
    prizeCurrency: form.prizeCurrency,
    prizes: draft.prizes,
    perks: draft.perks,
    themes: draft.themes,
  });
  into.lastChecked = new Date();
  await into.save();
  sub.status = 'merged';
  sub.hackathonId = into._id;
  sub.reviewedBy = oid(admin.id);
  sub.reviewedAt = new Date();
  sub.reviewNote = note;
  await sub.save();
  if (into.state === 'live') await tellSubmitter(sub, into, true);
  await audit(admin, 'submission.merge', 'submission', String(sub._id), `Merged a submission into “${into.title}”`, { hackathonId: String(into._id) });
  listingsChanged();
  return { id: String(into._id), slug: into.slug };
}

export async function rejectSubmission(id: string, admin: SessionUser, note: string) {
  const sub = await loadPendingSubmission(id);
  sub.status = 'rejected';
  sub.reviewedBy = oid(admin.id);
  sub.reviewedAt = new Date();
  sub.reviewNote = note;
  await sub.save();
  if (sub.userId) {
    await notify(
      sub.userId,
      'system',
      'We couldn’t list your share',
      note || 'It didn’t look like an open hackathon, or we couldn’t confirm the details. Thanks for sharing, though!',
      '/submit'
    );
  }
  await audit(admin, 'submission.reject', 'submission', String(sub._id), `Rejected “${submissionTitle(sub)}”${note ? `: ${note}` : ''}`);
}

export async function getSubmissionDetail(id: string) {
  const sub = await Submission.findById(id).lean();
  if (!sub) throw notFound('That submission');
  const users = await userMap([sub.userId, sub.reviewedBy]);
  const draft = (sub.extracted ?? null) as Draft | null;
  const linked = sub.hackathonId ? await Hackathon.findById(sub.hackathonId).lean() : null;
  const reviewer = sub.reviewedBy ? users.get(String(sub.reviewedBy)) : undefined;
  return {
    submission: {
      ...submissionRow(sub, users),
      message: sub.message ?? '',
      imageUrls: sub.imageUrls ?? [],
      fields: sub.fields ?? {},
      draft,
      reviewedBy: reviewer ? { handle: reviewer.handle, name: reviewer.name } : null,
    },
    form: draftToForm(draft, { imageUrl: sub.posterUrl || sub.imageUrls?.[0], url: sub.url && !isSocialLink(sub.url) ? sub.url : undefined }),
    hackathon: linked ? listingRow(linked) : null,
  };
}

// ---------- Users ----------

export function userRow(u: IUser & { _id: unknown }) {
  return {
    id: String(u._id),
    name: u.name,
    handle: u.handle,
    email: u.email ?? '',
    image: u.image ?? '',
    role: u.role,
    /** ADMIN_EMAILS makes this account admin at every sign-in. */
    adminByEmail: isAdminEmail(u.email),
    banned: Boolean(u.banned),
    isSample: Boolean(u.isSample),
    emailVerified: Boolean(u.emailVerified),
    college: u.college ?? '',
    city: u.city ?? '',
    joinedAt: u.joinedAt ?? u.createdAt,
    lastLoginAt: u.lastLoginAt ?? null,
    deletedAt: u.deletedAt ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function countBy(model: Model<any>, field: string, ids: Types.ObjectId[]): Promise<Map<string, number>> {
  if (!ids.length) return new Map();
  const rows = await model.aggregate<{ _id: Types.ObjectId; n: number }>([{ $match: { [field]: { $in: ids } } }, { $group: { _id: `$${field}`, n: { $sum: 1 } } }]);
  return new Map(rows.map((r) => [String(r._id), r.n]));
}

/** How much each of these accounts has posted, for the users table. */
export async function userCounts(ids: string[]) {
  const list = ids.map(oid);
  const [threads, replies, teamPosts, messages, wins, submissions] = await Promise.all([
    countBy(Thread, 'authorId', list),
    countBy(Reply, 'authorId', list),
    countBy(TeamPost, 'authorId', list),
    countBy(Message, 'senderId', list),
    countBy(Win, 'authorId', list),
    countBy(Submission, 'userId', list),
  ]);
  return (id: string) => ({
    threads: threads.get(id) ?? 0,
    replies: replies.get(id) ?? 0,
    teamPosts: teamPosts.get(id) ?? 0,
    messages: messages.get(id) ?? 0,
    wins: wins.get(id) ?? 0,
    submissions: submissions.get(id) ?? 0,
  });
}

/** Admins other than `excludeId` who can still sign in (role admin or ADMIN_EMAILS). */
async function otherAdmins(excludeId: string): Promise<number> {
  const emails = adminEmails();
  return User.countDocuments({
    _id: { $ne: oid(excludeId) },
    deletedAt: null,
    banned: { $ne: true },
    isSample: { $ne: true },
    $or: [{ role: 'admin' }, ...(emails.length ? [{ email: { $in: emails } }] : [])],
  });
}

/** Everything about one account for the admin: profile, what they posted and shared, and how they use the site. Never message contents. */
export async function getUserDetail(id: string) {
  const u = await User.findById(id).lean();
  if (!u) throw notFound('That account');
  const uid = u._id;
  const [
    threads,
    replies,
    teamPosts,
    requests,
    invites,
    wins,
    submissions,
    added,
    saved,
    flags,
    activity,
    actions,
    counts,
  ] = await Promise.all([
    Thread.find({ authorId: uid }).sort({ createdAt: -1 }).limit(50).select('slug title category replyCount votes pinned createdAt deletedAt deletedBy').lean(),
    Reply.find({ authorId: uid }).sort({ createdAt: -1 }).limit(50).select('threadId body votes createdAt deletedAt deletedBy').lean(),
    TeamPost.find({ authorId: uid }).sort({ createdAt: -1 }).limit(50).select('hackathonSlug city mode members teamMax idea open createdAt deletedAt').lean(),
    TeamRequest.find({ fromUserId: uid }).sort({ createdAt: -1 }).limit(50).select('postId toUserId message status createdAt').lean(),
    Invite.find({ fromUserId: uid }).sort({ createdAt: -1 }).limit(50).select('toUserId postId message status createdAt').lean(),
    Win.find({ authorId: uid }).sort({ createdAt: -1 }).limit(50).select('slug projectName hackathon result cheers createdAt deletedAt deletedBy').lean(),
    Submission.find({ userId: uid }).sort({ createdAt: -1 }).limit(50).lean(),
    Hackathon.find({ submittedBy: uid }).sort({ createdAt: -1 }).limit(50).select('slug title state createdAt').lean(),
    SavedEvent.find({ userId: uid }).sort({ createdAt: -1 }).limit(100).select('hackathonSlug status createdAt').lean(),
    ContentFlag.find({ userId: uid }).sort({ createdAt: -1 }).limit(50).select('kind excerpt words createdAt').lean(),
    Activity.find({ userId: uid }).sort({ at: -1 }).limit(60).select('type label href at').lean(),
    AdminAction.find({ targetType: 'user', targetId: String(uid) }).sort({ createdAt: -1 }).limit(20).lean(),
    Promise.all([
      Thread.countDocuments({ authorId: uid }),
      Reply.countDocuments({ authorId: uid }),
      TeamPost.countDocuments({ authorId: uid }),
      TeamRequest.countDocuments({ fromUserId: uid }),
      Invite.countDocuments({ fromUserId: uid }),
      Win.countDocuments({ authorId: uid }),
      Submission.countDocuments({ userId: uid }),
      Hackathon.countDocuments({ submittedBy: uid }),
      SavedEvent.countDocuments({ userId: uid }),
      ContentFlag.countDocuments({ userId: uid }),
      Conversation.countDocuments({ members: uid }),
      Message.countDocuments({ senderId: uid }),
      Report.countDocuments({ userId: uid }),
    ]),
  ]);
  const [threadMap, postMap, people, listingTitles] = await Promise.all([
    Thread.find({ _id: { $in: [...new Set(replies.map((r) => String(r.threadId)))] } }).select('slug title').lean(),
    TeamPost.find({ _id: { $in: [...new Set([...requests.map((r) => String(r.postId)), ...invites.filter((i) => i.postId).map((i) => String(i.postId))])] } })
      .select('hackathonSlug')
      .lean(),
    userMap([...requests.map((r) => r.toUserId), ...invites.map((i) => i.toUserId)]),
    Hackathon.find({ slug: { $in: [...new Set([...saved.map((s) => s.hackathonSlug), ...teamPosts.map((p) => p.hackathonSlug)])] } })
      .select('slug title')
      .lean(),
  ]);
  const threadsById = new Map(threadMap.map((t) => [String(t._id), t]));
  const postsById = new Map(postMap.map((p) => [String(p._id), p]));
  const titleOf = new Map(listingTitles.map((l) => [l.slug, l.title]));
  const handleOf = (id: unknown) => (id ? people.get(String(id))?.handle ?? '' : '');
  const byAdmin = (deletedBy: unknown) => Boolean(deletedBy) && String(deletedBy) !== String(uid);
  const [nThreads, nReplies, nTeamPosts, nRequests, nInvites, nWins, nSubs, nAdded, nSaved, nFlags, nConversations, nMessages, nReports] = counts;
  const subUsers = new Map([[String(uid), { handle: u.handle, name: u.name }]]);
  const analytics = await userAnalytics(String(uid));

  const timeline = [
    ...activity.map((a) => ({ at: a.at, kind: a.type as string, text: a.label, href: a.href ?? '' })),
    ...submissions.map((s) => ({ at: s.createdAt, kind: 'submission', text: `Shared “${submissionTitle(s)}” (${s.status})`, href: `/admin/review/${String(s._id)}` })),
    ...analytics.events.filter((e) => e.type === 'login' || e.type === 'signup').map((e) => ({ at: e.at, kind: e.type, text: e.type === 'signup' ? 'Signed up' : `Signed in (${e.target})`, href: '' })),
    ...actions.map((a) => ({ at: a.createdAt, kind: 'admin', text: `@${a.adminHandle}: ${a.summary}`, href: '' })),
    { at: u.joinedAt ?? u.createdAt, kind: 'joined', text: 'Joined HackathonFinder', href: '' },
  ]
    .filter((t) => t.at)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 80);

  return {
    user: {
      ...userRow(u),
      about: u.about ?? '',
      bio: u.bio ?? '',
      skills: u.skills ?? [],
      github: u.github ?? '',
      linkedin: u.linkedin ?? '',
      lookingForTeam: Boolean(u.lookingForTeam),
      followedCities: u.followedCities ?? [],
      onboarded: Boolean(u.onboarded),
      emailVerifiedAt: u.emailVerified ?? null,
      prefs: u.prefs ?? { reminders: false, digest: false, teamEmails: false },
      // Provider names only: never the provider's account ids.
      signInWith: [...(u.providers ?? []).map((p) => p.provider), ...(u.email ? ['email'] : [])],
      record: (u.record ?? []).map((r) => ({ event: r.event, result: r.result, project: r.project, date: r.date })),
      createdAt: u.createdAt,
      isSelfDeleted: Boolean(u.deletedAt),
    },
    counts: {
      threads: nThreads,
      replies: nReplies,
      teamPosts: nTeamPosts,
      requests: nRequests,
      invites: nInvites,
      wins: nWins,
      submissions: nSubs,
      hackathonsAdded: nAdded,
      saved: nSaved,
      flags: nFlags,
      conversations: nConversations,
      messages: nMessages,
      reports: nReports,
    },
    threads: threads.map((t) => ({
      id: String(t._id),
      slug: t.slug,
      title: t.title,
      category: t.category,
      replyCount: t.replyCount,
      votes: t.votes,
      pinned: Boolean(t.pinned),
      createdAt: t.createdAt,
      deletedAt: t.deletedAt ?? null,
      removedByAdmin: byAdmin(t.deletedBy),
    })),
    replies: replies.map((r) => {
      const t = threadsById.get(String(r.threadId));
      return {
        id: String(r._id),
        text: excerpt(r.body, 220),
        votes: r.votes,
        thread: t ? { slug: t.slug, title: t.title } : null,
        createdAt: r.createdAt,
        deletedAt: r.deletedAt ?? null,
        removedByAdmin: byAdmin(r.deletedBy),
      };
    }),
    teamPosts: teamPosts.map((p) => ({
      id: String(p._id),
      hackathonSlug: p.hackathonSlug,
      hackathonTitle: titleOf.get(p.hackathonSlug) ?? p.hackathonSlug,
      city: p.city,
      mode: p.mode,
      members: p.members,
      teamMax: p.teamMax,
      idea: excerpt(p.idea, 220),
      open: p.open,
      createdAt: p.createdAt,
      deletedAt: p.deletedAt ?? null,
    })),
    requests: requests.map((r) => ({
      id: String(r._id),
      hackathonSlug: postsById.get(String(r.postId))?.hackathonSlug ?? '',
      to: handleOf(r.toUserId),
      message: excerpt(r.message, 160),
      status: r.status,
      createdAt: r.createdAt,
    })),
    invites: invites.map((i) => ({
      id: String(i._id),
      hackathonSlug: i.postId ? postsById.get(String(i.postId))?.hackathonSlug ?? '' : '',
      to: handleOf(i.toUserId),
      message: excerpt(i.message, 160),
      status: i.status,
      createdAt: i.createdAt,
    })),
    wins: wins.map((w) => ({
      id: String(w._id),
      slug: w.slug,
      projectName: w.projectName,
      hackathon: w.hackathon,
      result: w.result,
      cheers: w.cheers,
      createdAt: w.createdAt,
      deletedAt: w.deletedAt ?? null,
      removedByAdmin: byAdmin(w.deletedBy),
    })),
    submissions: submissions.map((s) => submissionRow(s, subUsers)),
    hackathonsAdded: added.map((h) => ({ id: String(h._id), slug: h.slug, title: h.title, state: h.state, createdAt: h.createdAt })),
    saved: saved.map((s) => ({ hackathonSlug: s.hackathonSlug, title: titleOf.get(s.hackathonSlug) ?? s.hackathonSlug, status: s.status, createdAt: s.createdAt })),
    flags: flags.map((f) => ({ id: String(f._id), kind: f.kind, excerpt: f.excerpt, words: f.words, createdAt: f.createdAt })),
    analytics,
    timeline,
  };
}

/** Hides everything an account posted (threads, replies, stories, team posts) and withdraws its pending requests and invites. */
export async function hideUserContent(userId: string, admin: SessionUser) {
  const uid = oid(userId);
  const by = oid(admin.id);
  const now = new Date();
  const liveReplies = await Reply.aggregate<{ _id: Types.ObjectId; n: number }>([
    { $match: { authorId: uid, deletedAt: null } },
    { $group: { _id: '$threadId', n: { $sum: 1 } } },
  ]);
  const [threads, replies, wins, teamPosts] = await Promise.all([
    Thread.updateMany({ authorId: uid, deletedAt: null }, { $set: { deletedAt: now, deletedBy: by } }),
    Reply.updateMany({ authorId: uid, deletedAt: null }, { $set: { deletedAt: now, deletedBy: by } }),
    Win.updateMany({ authorId: uid, deletedAt: null }, { $set: { deletedAt: now, deletedBy: by } }),
    TeamPost.updateMany({ authorId: uid, deletedAt: null }, { $set: { deletedAt: now, open: false } }),
    TeamRequest.updateMany({ fromUserId: uid, status: 'pending' }, { $set: { status: 'withdrawn' } }),
    Invite.updateMany({ fromUserId: uid, status: 'pending' }, { $set: { status: 'withdrawn' } }),
  ]);
  for (const g of liveReplies) await changeReplyCount(g._id, -g.n);
  return { threads: threads.modifiedCount, replies: replies.modifiedCount, wins: wins.modifiedCount, teamPosts: teamPosts.modifiedCount };
}

/** Puts back threads, replies and stories that admins hid (not ones the student deleted themselves). */
export async function restoreUserContent(userId: string) {
  const uid = oid(userId);
  const hidden = { authorId: uid, deletedAt: { $ne: null }, deletedBy: { $nin: [uid, null] } };
  const replyGroups = await Reply.aggregate<{ _id: Types.ObjectId; n: number }>([{ $match: hidden }, { $group: { _id: '$threadId', n: { $sum: 1 } } }]);
  const restore = { $set: { deletedAt: null, deletedBy: null } };
  const [threads, replies, wins] = await Promise.all([Thread.updateMany(hidden, restore), Reply.updateMany(hidden, restore), Win.updateMany(hidden, restore)]);
  for (const g of replyGroups) await changeReplyCount(g._id, g.n);
  return { threads: threads.modifiedCount, replies: replies.modifiedCount, wins: wins.modifiedCount };
}

/** Moves a thread's reply count without letting it go below zero. */
async function changeReplyCount(threadId: Types.ObjectId, delta: number) {
  if (delta >= 0) {
    await Thread.updateOne({ _id: threadId }, { $inc: { replyCount: delta } }, { timestamps: false });
    return;
  }
  const res = await Thread.updateOne({ _id: threadId, replyCount: { $gte: -delta } }, { $inc: { replyCount: delta } }, { timestamps: false });
  if (!res.modifiedCount) await Thread.updateOne({ _id: threadId }, { $set: { replyCount: 0 } }, { timestamps: false });
}

export interface UserPatch {
  role?: Role;
  banned?: boolean;
  /** With a ban: hide everything they posted. With an unban: put back what admins hid. */
  content?: boolean;
}

/**
 * Role changes and bans. Nobody can ban, demote or delete themselves, and the last
 * admin can't lose access, so there's always a way back in.
 */
export async function moderateUser(id: string, patch: UserPatch, admin: SessionUser) {
  if (id === admin.id && (patch.banned || (patch.role && patch.role !== 'admin'))) {
    throw forbidden('You can’t remove your own admin access or ban yourself.');
  }
  const doc = await User.findById(id);
  if (!doc || doc.deletedAt) throw notFound('That account');
  const byEmail = isAdminEmail(doc.email);
  const isAdminNow = doc.role === 'admin' || byEmail;
  const losesAdmin = isAdminNow && (patch.banned === true || (patch.role !== undefined && patch.role !== 'admin' && !byEmail));
  if (losesAdmin && (await otherAdmins(id)) === 0) throw forbidden('This is the last admin. Make someone else an admin first.');
  if (patch.role === 'admin' && doc.isSample) throw forbidden('Sample students can’t sign in, so they can’t be admins.');

  const changes: string[] = [];
  const set: Record<string, unknown> = {};
  if (patch.role && patch.role !== doc.role) {
    set.role = patch.role;
    changes.push(`role ${doc.role} → ${patch.role}`);
  }
  if (patch.banned !== undefined && patch.banned !== Boolean(doc.banned)) {
    set.banned = patch.banned;
    changes.push(patch.banned ? 'banned' : 'unbanned');
  }
  // updateOne, not save(): older accounts may not pass today's validators, and that shouldn't block a ban.
  if (Object.keys(set).length) await User.updateOne({ _id: doc._id }, { $set: set });
  let content: Record<string, number> | null = null;
  if (patch.content && patch.banned === true) {
    content = await hideUserContent(id, admin);
    changes.push(`hid ${content.threads} threads, ${content.replies} replies, ${content.wins} stories, ${content.teamPosts} team posts`);
  } else if (patch.content && patch.banned === false) {
    content = await restoreUserContent(id);
    changes.push(`restored ${content.threads} threads, ${content.replies} replies, ${content.wins} stories`);
  }
  if (changes.length) {
    const action = patch.banned === true ? 'user.ban' : patch.banned === false ? 'user.unban' : 'user.role';
    await audit(admin, action, 'user', id, `@${doc.handle}: ${changes.join('; ')}`);
  }
  const fresh = await User.findById(id).lean();
  const note =
    patch.role && patch.role !== 'admin' && byEmail
      ? 'This email is in ADMIN_EMAILS, so it stays an admin. Remove it from ADMIN_EMAILS to make this stick.'
      : '';
  return { user: userRow(fresh!), note, content };
}

/** A free "deleted-…" handle from the end of the id (same as a student deleting their own account). */
async function deletedHandle(id: string): Promise<string> {
  for (const n of [6, 10, 14, 22]) {
    const candidate = `deleted-${id.slice(-n)}`;
    if (!(await User.exists({ handle: candidate, _id: { $ne: id } }))) return candidate;
  }
  return `deleted-${id.slice(-22)}`;
}

/**
 * Deletes an account the way a student deleting their own does: personal details are
 * wiped and sign-in stops working. Their posts stay as "Former student" unless
 * `hideContent` is set.
 */
export async function deleteUserAccount(id: string, admin: SessionUser, hideContent: boolean) {
  if (id === admin.id) throw forbidden('You can’t delete your own account from here.');
  const doc = await User.findById(id).lean();
  if (!doc || doc.deletedAt) throw notFound('That account');
  if ((doc.role === 'admin' || isAdminEmail(doc.email)) && (await otherAdmins(id)) === 0) {
    throw forbidden('This is the last admin. Make someone else an admin first.');
  }
  let content: Record<string, number> | null = null;
  if (hideContent) content = await hideUserContent(id, admin);
  await User.updateOne(
    { _id: doc._id },
    {
      $set: {
        name: 'Former student',
        handle: await deletedHandle(id),
        emailVerified: null,
        providers: [],
        about: '',
        college: '',
        city: '',
        skills: [],
        bio: '',
        github: '',
        linkedin: '',
        lookingForTeam: false,
        followedCities: [],
        record: [],
        prefs: { reminders: false, digest: false, teamEmails: false },
        deletedAt: new Date(),
      },
      $unset: { email: 1, passwordHash: 1, image: 1 },
    }
  );
  // Private data goes; open team posts close so nobody waits on a reply that won't come.
  await Promise.all([
    SavedEvent.deleteMany({ userId: doc._id }),
    Activity.deleteMany({ userId: doc._id }),
    Notification.deleteMany({ userId: doc._id }),
    AuthToken.deleteMany({ userId: doc._id }),
    DigestSubscriber.deleteMany(doc.email ? { $or: [{ userId: doc._id }, { email: doc.email }] } : { userId: doc._id }),
    TeamPost.updateMany({ authorId: doc._id, open: true }, { $set: { open: false } }),
    TeamRequest.updateMany({ fromUserId: doc._id, status: 'pending' }, { $set: { status: 'withdrawn' } }),
    Invite.updateMany({ fromUserId: doc._id, status: 'pending' }, { $set: { status: 'withdrawn' } }),
  ]);
  await audit(admin, 'user.delete', 'user', id, `Deleted the account @${doc.handle} (${doc.name})${hideContent ? ' and hid their posts' : ''}`);
  return { ok: true, content };
}

// ---------- Community moderation ----------

export type ContentType = 'thread' | 'reply' | 'team-post' | 'win' | 'request' | 'invite';
export type ContentOp = 'remove' | 'restore' | 'pin' | 'unpin' | 'withdraw';

const ALLOWED_OPS: Record<ContentType, ContentOp[]> = {
  thread: ['remove', 'restore', 'pin', 'unpin'],
  reply: ['remove', 'restore'],
  'team-post': ['remove', 'restore'],
  win: ['remove', 'restore'],
  request: ['withdraw'],
  invite: ['withdraw'],
};

/** Removes, restores or pins one piece of content. Removal is a soft delete that the public pages already hide. */
export async function contentAction(type: ContentType, id: string, op: ContentOp, admin: SessionUser) {
  if (!ALLOWED_OPS[type].includes(op)) throw badRequest(`You can’t ${op} a ${type}.`);
  const by = oid(admin.id);
  const now = new Date();
  let label = '';
  switch (type) {
    case 'thread': {
      const t = await Thread.findById(id).select('title deletedAt pinned').lean();
      if (!t) throw notFound('That discussion');
      label = `the thread “${t.title}”`;
      const set =
        op === 'remove' ? { deletedAt: t.deletedAt ?? now, deletedBy: t.deletedAt ? undefined : by } : op === 'restore' ? { deletedAt: null, deletedBy: null } : { pinned: op === 'pin' };
      await Thread.updateOne({ _id: t._id }, { $set: Object.fromEntries(Object.entries(set).filter(([, v]) => v !== undefined)) }, { timestamps: false });
      break;
    }
    case 'reply': {
      const r = await Reply.findById(id).select('threadId body deletedAt').lean();
      if (!r) throw notFound('That reply');
      label = `a reply (“${excerpt(r.body, 60)}”)`;
      const res =
        op === 'remove'
          ? await Reply.updateOne({ _id: r._id, deletedAt: null }, { $set: { deletedAt: now, deletedBy: by } })
          : await Reply.updateOne({ _id: r._id, deletedAt: { $ne: null } }, { $set: { deletedAt: null, deletedBy: null } });
      // Only the change that actually flipped it moves the count.
      if (res.modifiedCount) await changeReplyCount(r.threadId, op === 'remove' ? -1 : 1);
      break;
    }
    case 'team-post': {
      const p = await TeamPost.findById(id).select('hackathonSlug members teamMax deletedAt').lean();
      if (!p) throw notFound('That team post');
      label = `a team post for ${p.hackathonSlug}`;
      if (op === 'remove') await TeamPost.updateOne({ _id: p._id }, { $set: { deletedAt: p.deletedAt ?? now, open: false } });
      else await TeamPost.updateOne({ _id: p._id }, { $set: { deletedAt: null, open: p.members < p.teamMax } });
      break;
    }
    case 'win': {
      const w = await Win.findById(id).select('projectName deletedAt').lean();
      if (!w) throw notFound('That story');
      label = `the story “${w.projectName}”`;
      if (op === 'remove') await Win.updateOne({ _id: w._id, deletedAt: null }, { $set: { deletedAt: now, deletedBy: by } });
      else await Win.updateOne({ _id: w._id }, { $set: { deletedAt: null, deletedBy: null } });
      break;
    }
    case 'request':
    case 'invite': {
      const filter = { _id: oid(id), status: 'pending' as const };
      const update = { $set: { status: 'withdrawn' as const } };
      const res = type === 'request' ? await TeamRequest.updateOne(filter, update) : await Invite.updateOne(filter, update);
      if (!res.matchedCount) throw notFound(type === 'request' ? 'A pending request' : 'A pending invite');
      label = `a pending ${type}`;
      break;
    }
  }
  const verb = { remove: 'Removed', restore: 'Restored', pin: 'Pinned', unpin: 'Unpinned', withdraw: 'Withdrew' }[op];
  await audit(admin, `${type}.${op}`, type, id, `${verb} ${label}`);
  return { ok: true };
}

export type CommunityTab = 'threads' | 'replies' | 'teams' | 'wins' | 'flags';

/** The latest threads, replies, team posts, stories or word-filter hits, for moderation. */
export async function listCommunity(tab: CommunityTab, opts: { q: string; state: 'live' | 'removed' | 'all'; page: number; limit: number }) {
  const skip = (opts.page - 1) * opts.limit;
  const rx = opts.q ? searchRegex(opts.q) : null;
  const stateFilter = opts.state === 'live' ? { deletedAt: null } : opts.state === 'removed' ? { deletedAt: { $ne: null } } : {};
  const page = <T>(items: T[], total: number) => ({ items, total, page: opts.page, pages: Math.max(1, Math.ceil(total / opts.limit)) });
  const person = (people: Map<string, Person>, id: unknown) => {
    const p = people.get(String(id));
    return p ? { id: p.id, handle: p.handle, name: p.name } : null;
  };

  if (tab === 'threads') {
    const filter = { ...stateFilter, ...(rx ? { $or: [{ title: rx }, { body: rx }] } : {}) };
    const [total, rows] = await Promise.all([Thread.countDocuments(filter), Thread.find(filter).sort({ createdAt: -1 }).skip(skip).limit(opts.limit).lean()]);
    const people = await userMap(rows.map((r) => r.authorId));
    return page(
      rows.map((t) => ({
        id: String(t._id),
        slug: t.slug,
        title: t.title,
        text: excerpt(t.body, 180),
        category: t.category,
        author: person(people, t.authorId),
        replyCount: t.replyCount,
        votes: t.votes,
        pinned: Boolean(t.pinned),
        createdAt: t.createdAt,
        deletedAt: t.deletedAt ?? null,
      })),
      total
    );
  }
  if (tab === 'replies') {
    const filter = { ...stateFilter, ...(rx ? { body: rx } : {}) };
    const [total, rows] = await Promise.all([Reply.countDocuments(filter), Reply.find(filter).sort({ createdAt: -1 }).skip(skip).limit(opts.limit).lean()]);
    const [people, threads] = await Promise.all([
      userMap(rows.map((r) => r.authorId)),
      Thread.find({ _id: { $in: [...new Set(rows.map((r) => String(r.threadId)))] } }).select('slug title').lean(),
    ]);
    const byThread = new Map(threads.map((t) => [String(t._id), t]));
    return page(
      rows.map((r) => {
        const t = byThread.get(String(r.threadId));
        return {
          id: String(r._id),
          text: excerpt(r.body, 240),
          thread: t ? { slug: t.slug, title: t.title } : null,
          author: person(people, r.authorId),
          votes: r.votes,
          createdAt: r.createdAt,
          deletedAt: r.deletedAt ?? null,
        };
      }),
      total
    );
  }
  if (tab === 'teams') {
    const filter = { ...stateFilter, ...(rx ? { $or: [{ idea: rx }, { hackathonSlug: rx }] } : {}) };
    const [total, rows] = await Promise.all([TeamPost.countDocuments(filter), TeamPost.find(filter).sort({ createdAt: -1 }).skip(skip).limit(opts.limit).lean()]);
    const [people, listings] = await Promise.all([
      userMap(rows.map((r) => r.authorId)),
      Hackathon.find({ slug: { $in: [...new Set(rows.map((r) => r.hackathonSlug))] } }).select('slug title').lean(),
    ]);
    const titles = new Map(listings.map((l) => [l.slug, l.title]));
    return page(
      rows.map((p) => ({
        id: String(p._id),
        hackathonSlug: p.hackathonSlug,
        hackathonTitle: titles.get(p.hackathonSlug) ?? p.hackathonSlug,
        city: p.city,
        mode: p.mode,
        text: excerpt(p.idea, 200),
        needs: p.needs ?? [],
        members: p.members,
        teamMax: p.teamMax,
        open: p.open,
        author: person(people, p.authorId),
        createdAt: p.createdAt,
        deletedAt: p.deletedAt ?? null,
      })),
      total
    );
  }
  if (tab === 'wins') {
    const filter = { ...stateFilter, ...(rx ? { $or: [{ projectName: rx }, { hackathon: rx }, { tagline: rx }] } : {}) };
    const [total, rows] = await Promise.all([Win.countDocuments(filter), Win.find(filter).sort({ createdAt: -1 }).skip(skip).limit(opts.limit).lean()]);
    const people = await userMap(rows.map((r) => r.authorId));
    return page(
      rows.map((w) => ({
        id: String(w._id),
        slug: w.slug,
        title: w.projectName,
        text: w.tagline ?? '',
        hackathon: w.hackathon,
        result: w.result,
        cheers: w.cheers,
        author: person(people, w.authorId),
        createdAt: w.createdAt,
        deletedAt: w.deletedAt ?? null,
      })),
      total
    );
  }
  const filter = rx ? { $or: [{ excerpt: rx }, { words: rx }] } : {};
  const [total, rows] = await Promise.all([ContentFlag.countDocuments(filter), ContentFlag.find(filter).sort({ createdAt: -1 }).skip(skip).limit(opts.limit).select('-ip').lean()]);
  const people = await userMap(rows.map((r) => r.userId));
  return page(
    rows.map((f) => ({
      id: String(f._id),
      kind: f.kind,
      text: f.excerpt,
      words: f.words ?? [],
      author: f.userId ? person(people, f.userId) : null,
      createdAt: f.createdAt,
      deletedAt: null,
    })),
    total
  );
}

// ---------- Sources and runs ----------

export function runRow(r: Partial<IAgentRun> & { _id: unknown }) {
  return {
    id: String(r._id),
    agent: r.agent,
    source: r.source ?? '',
    sourceName: r.source ? sourceBySlug(r.source)?.name ?? r.source : '',
    status: r.status,
    trigger: r.trigger,
    startedAt: r.startedAt,
    finishedAt: r.finishedAt ?? null,
    counts: r.counts ?? null,
    errorLog: (r.errorLog ?? []).slice(-50),
    log: (r.log ?? []).slice(-200),
  };
}
export type RunRow = ReturnType<typeof runRow>;

export function sourceRow(s: ISource & { _id: unknown }, queued: Set<string>) {
  return {
    id: String(s._id),
    slug: s.slug,
    name: s.name,
    kind: s.kind,
    enabled: s.enabled,
    schedule: s.schedule,
    health: s.health,
    lastRunAt: s.lastRunAt ?? null,
    lastSuccessAt: s.lastSuccessAt ?? null,
    lastError: s.lastError ?? '',
    lastItemCount: s.lastItemCount ?? null,
    consecutiveFailures: s.consecutiveFailures ?? 0,
    queued: queued.has(s.slug),
  };
}

// ---------- Scraper ----------

/** "02:00" → "2:00 AM". */
function clock(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** The scheduled scrape times in words, e.g. "Runs automatically every day at 2:00 AM and 2:00 PM IST". */
export function scheduleLabel(): string {
  const times = SCRAPE_SCHEDULE.times.map(clock);
  const list = times.length > 1 ? `${times.slice(0, -1).join(', ')} and ${times[times.length - 1]}` : times[0];
  return `Runs automatically every day at ${list} ${SCRAPE_SCHEDULE.timezone === 'Asia/Kolkata' ? 'IST' : SCRAPE_SCHEDULE.timezone}`;
}

/** When the next scheduled scrape starts (India has no daylight saving, so this is exact). */
export function nextScheduledScrape(now = Date.now()): Date {
  const today = istMidnight(now);
  const slots = [0, 1]
    .flatMap((d) =>
      SCRAPE_SCHEDULE.times.map((t) => {
        const [h, m] = t.split(':').map(Number);
        return today + d * DAY + (h * 60 + m) * 60_000;
      })
    )
    .sort((a, b) => a - b);
  return new Date(slots.find((t) => t > now) ?? slots[0] + DAY);
}

/** The scraper engine's errors as a clean 503 for the dashboard, never a stack trace. */
export function scraperError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  const message = err instanceof Error ? err.message : String(err);
  console.error('[admin] Scraper call failed:', err);
  return new ApiError(503, 'scraper_unavailable', `The scraper isn’t ready yet: ${message.replace(/\s+/g, ' ').slice(0, 200)}`);
}

export interface ScrapeListing {
  id: string;
  slug: string;
  title: string;
  state: string;
  registrationUrl: string;
  registrationVia: 'link' | 'qr';
  imageUrl: string;
  place: string;
}

/** Adds each item's listing (registration link, QR or not, state) so the run view can show and act on it. */
export async function enrichScrapeItems<T extends ScrapeItem>(items: T[]): Promise<(T & { listing: ScrapeListing | null })[]> {
  const ids = [...new Set(items.map((i) => i.hackathonId).filter((id): id is string => Boolean(id && /^[a-f0-9]{24}$/i.test(id))))];
  const slugs = [...new Set(items.map((i) => i.slug).filter((s): s is string => Boolean(s && /^[a-z0-9-]{1,140}$/.test(s))))];
  const or: Record<string, unknown>[] = [];
  if (ids.length) or.push({ _id: { $in: ids.map(oid) } });
  if (slugs.length) or.push({ slug: { $in: slugs } });
  const docs = or.length
    ? await Hackathon.find({ $or: or }).select('slug title state registrationUrl registrationVia imageUrl mode city cityName').lean()
    : [];
  const byId = new Map(docs.map((d) => [String(d._id), d]));
  const bySlug = new Map(docs.map((d) => [d.slug, d]));
  return items.map((item) => {
    const d = (item.hackathonId && byId.get(item.hackathonId)) || (item.slug && bySlug.get(item.slug)) || null;
    return {
      ...item,
      listing: d
        ? {
            id: String(d._id),
            slug: d.slug,
            title: d.title,
            state: d.state,
            registrationUrl: d.registrationUrl,
            registrationVia: d.registrationVia === 'qr' ? 'qr' : 'link',
            imageUrl: d.imageUrl ?? '',
            place: placeName({ mode: d.mode, city: d.city, cityName: d.cityName }),
          }
        : null,
    };
  });
}

// ---------- Dashboard ----------

/** The admin home: traffic for today / 7 / 30 days, the daily chart, top lists, and what needs attention. */
export async function getDashboard() {
  const today = resolveRange('today');
  const week = resolveRange('7d');
  const month = resolveRange('30d');
  const [sToday, sYesterday, sWeek, sPrevWeek, sMonth, sPrevMonth, series, breakdowns, funnel] = await Promise.all([
    trafficSummary(today.from, today.to),
    trafficSummary(previousRange(today).from, previousRange(today).to),
    trafficSummary(week.from, week.to),
    trafficSummary(previousRange(week).from, previousRange(week).to),
    trafficSummary(month.from, month.to),
    trafficSummary(previousRange(month).from, previousRange(month).to),
    trafficSeries(month),
    trafficBreakdowns(week.from, week.to, 8, 10),
    hackathonFunnel(week.from, week.to, 300),
  ]);

  const [liveBySource, live, pending, pendingSubs, openReports, users, recentUsers, threads, teamPosts, wins] = await Promise.all([
    Hackathon.aggregate<{ _id: string; n: number }>([{ $match: { state: 'live' } }, { $unwind: '$sources' }, { $group: { _id: '$sources', n: { $sum: 1 } } }, { $sort: { n: -1 } }]),
    Hackathon.countDocuments({ state: 'live' }),
    Hackathon.countDocuments({ state: 'pending' }),
    Submission.countDocuments({ status: { $in: ['pending', 'processing'] } }),
    Report.countDocuments({ status: 'open' }),
    User.countDocuments({ isSample: { $ne: true }, deletedAt: null }),
    User.find({ isSample: { $ne: true }, deletedAt: null }).sort({ createdAt: -1 }).limit(8).select('name handle email image college city role createdAt lastLoginAt').lean(),
    Thread.find({ deletedAt: null }).sort({ createdAt: -1 }).limit(6).select('slug title authorId createdAt replyCount').lean(),
    TeamPost.find({ deletedAt: null }).sort({ createdAt: -1 }).limit(4).select('hackathonSlug idea authorId createdAt').lean(),
    Win.find({ deletedAt: null }).sort({ createdAt: -1 }).limit(3).select('slug projectName authorId createdAt').lean(),
  ]);
  const people = await userMap([...threads, ...teamPosts, ...wins].map((p) => p.authorId));
  const handle = (id: unknown) => people.get(String(id))?.handle ?? 'deleted';
  const posts = [
    ...threads.map((t) => ({ kind: 'thread', title: t.title, href: `/community/${t.slug}`, author: handle(t.authorId), at: t.createdAt })),
    ...teamPosts.map((p) => ({ kind: 'team post', title: excerpt(p.idea, 90), href: '/teams', author: handle(p.authorId), at: p.createdAt })),
    ...wins.map((w) => ({ kind: 'story', title: w.projectName, href: `/wins/${w.slug}`, author: handle(w.authorId), at: w.createdAt })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 10);

  let lastScrape: ScrapeRunSummary | null = null;
  let scrapeError = '';
  try {
    lastScrape = (await listScrapeRuns(1))[0] ?? null;
  } catch (err) {
    scrapeError = scraperError(err).message;
  }

  const top = (key: 'impressions' | 'views' | 'registerClicks') =>
    funnel
      .filter((r) => r[key] > 0)
      .sort((a, b) => b[key] - a[key])
      .slice(0, 6)
      .map((r) => ({ id: r.id, slug: r.slug, title: r.title, value: r[key] }));

  return {
    generatedAt: new Date(),
    summaries: {
      today: { label: 'Today', current: sToday, previous: sYesterday, compare: 'yesterday so far' },
      week: { label: 'Last 7 days', current: sWeek, previous: sPrevWeek, compare: 'the 7 days before' },
      month: { label: 'Last 30 days', current: sMonth, previous: sPrevMonth, compare: 'the 30 days before' },
    },
    series,
    breakdowns,
    topHackathons: { impressions: top('impressions'), views: top('views'), registerClicks: top('registerClicks') },
    ops: {
      live,
      liveBySource: liveBySource.map((s) => ({ source: s._id, name: sourceBySlug(s._id)?.name ?? s._id, count: s.n })),
      pending,
      pendingSubs,
      openReports,
      users,
      lastScrape,
      scrapeError,
      nextScrape: nextScheduledScrape(),
      schedule: scheduleLabel(),
    },
    recentUsers: recentUsers.map((u) => ({
      id: String(u._id),
      name: u.name,
      handle: u.handle,
      email: u.email ?? '',
      college: u.college ?? '',
      city: u.city ?? '',
      role: u.role,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt ?? null,
    })),
    recentPosts: posts,
  };
}

// ---------- Settings ----------

/** What's connected, as yes/no only. Never a key, secret or URL. */
export async function getSettings() {
  const emails = adminEmails();
  const [admins, users, listings, pageViews, events, auditEntries] = await Promise.all([
    User.find({ deletedAt: null, $or: [{ role: 'admin' }, ...(emails.length ? [{ email: { $in: emails } }] : [])] })
      .select('name handle email role banned isSample lastLoginAt')
      .lean(),
    User.countDocuments({ isSample: { $ne: true }, deletedAt: null }),
    Hackathon.aggregate<{ _id: string; n: number }>([{ $group: { _id: '$state', n: { $sum: 1 } } }]),
    PageView.estimatedDocumentCount(),
    AnalyticsEvent.estimatedDocumentCount(),
    AdminAction.estimatedDocumentCount(),
  ]);
  const env = (name: string) => Boolean(process.env[name]?.trim());
  const providers = enabledProviders();
  const accountEmails = new Set(admins.map((a) => a.email).filter(Boolean));
  return {
    services: [
      { name: 'Database (MongoDB)', ok: true, detail: 'Connected' },
      { name: 'Image storage (Cloudinary)', ok: storageMode() === 'cloudinary', detail: storageMode() === 'cloudinary' ? 'Cloudinary' : storageMode() === 'local' ? 'Local folder (development only)' : 'Not set up' },
      { name: 'Email (Resend)', ok: env('RESEND_API_KEY') && env('EMAIL_FROM'), detail: env('RESEND_API_KEY') ? (env('EMAIL_FROM') ? 'Set' : 'EMAIL_FROM missing') : 'Not set' },
      { name: 'Google sign-in', ok: providers.google, detail: providers.google ? 'On' : 'Off' },
      { name: 'GitHub sign-in', ok: providers.github, detail: providers.github ? 'On' : 'Off' },
      { name: 'AI extraction (Claude)', ok: isAiEnabled(), detail: isAiEnabled() ? 'On' : 'Off: rules-based reading only' },
      { name: 'Session secret (NEXTAUTH_SECRET)', ok: env('NEXTAUTH_SECRET'), detail: env('NEXTAUTH_SECRET') ? 'Set' : 'Missing: required in production' },
      { name: 'Cron secret (CRON_SECRET)', ok: env('CRON_SECRET'), detail: env('CRON_SECRET') ? 'Set' : 'Missing' },
    ],
    scraperKeys: [
      { name: 'Google search (GOOGLE_CSE_KEY, GOOGLE_CSE_CX)', ok: env('GOOGLE_CSE_KEY') && env('GOOGLE_CSE_CX') },
      { name: 'Instagram (INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_BUSINESS_ACCOUNT_ID)', ok: env('INSTAGRAM_ACCESS_TOKEN') && env('INSTAGRAM_BUSINESS_ACCOUNT_ID') },
      { name: 'Kaggle (KAGGLE_USERNAME, KAGGLE_KEY)', ok: env('KAGGLE_USERNAME') && env('KAGGLE_KEY') },
      { name: 'Eventbrite (EVENTBRITE_TOKEN)', ok: env('EVENTBRITE_TOKEN') },
      { name: 'Crawler name (CRAWLER_USER_AGENT)', ok: env('CRAWLER_USER_AGENT') },
    ],
    adminEmails: { count: emails.length, withAccount: emails.filter((e) => accountEmails.has(e)).length },
    admins: admins.map((a) => ({
      id: String(a._id),
      name: a.name,
      handle: a.handle,
      email: a.email ?? '',
      byRole: a.role === 'admin',
      byEmail: isAdminEmail(a.email),
      banned: Boolean(a.banned),
      lastLoginAt: a.lastLoginAt ?? null,
    })),
    counts: {
      users,
      listings: Object.fromEntries(listings.map((l) => [l._id, l.n])),
      pageViews,
      events,
      auditEntries,
    },
  };
}
