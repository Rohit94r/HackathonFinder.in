import 'server-only';
import { redirect } from 'next/navigation';
import {
  AgentRun,
  connectDb,
  Hackathon,
  isDbConfigured,
  notify,
  RawItem,
  Report,
  SavedEvent,
  Source,
  Submission,
  slugify,
  Types,
  uniqueSlug,
  User,
  type IAgentRun,
  type IHackathon,
  type ISource,
  type ISourceRef,
  type ISubmission,
  type IUser,
} from '@hackathonfinder/db';
import type { HydratedDocument } from 'mongoose';
import { cityPoint, templateSummary } from '@hackathonfinder/ai';
import { sourceBySlug } from '@hackathonfinder/shared';
import {
  cityForForm,
  draftToForm,
  EMPTY_LISTING_FORM,
  toIstInput,
  type Draft,
  type ListingFormValues,
  type ListingInputValues,
} from '@/components/admin/listingFields';
import { forbidden, notFound, route, type Ctx } from './api';
import { getSessionUser, type SessionUser } from './auth';
import { sendEmail, siteUrl } from './email';
import { isAdminEmail } from './users';
import { isSocialLink, sourceFor, submissionTitle } from './submissions';

const DAY = 24 * 60 * 60 * 1000;

// ---------- Who may use the admin area ----------

/**
 * The session says "admin", but roles can change after sign-in, so check the
 * account itself too. A demoted or banned admin loses access at once.
 */
async function stillAdmin(user: SessionUser): Promise<boolean> {
  if (!isDbConfigured()) return user.role === 'admin';
  await connectDb();
  const doc = await User.findById(user.id).select('role email banned deletedAt').lean();
  if (!doc || doc.banned || doc.deletedAt) return false;
  return doc.role === 'admin' || isAdminEmail(doc.email);
}

/** For admin pages: sends signed-out visitors to sign in and everyone else home. */
export async function requireAdminPage(next = '/admin'): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (user.role !== 'admin' || !(await stillAdmin(user))) redirect('/');
  return user;
}

type AdminHandler<P> = (ctx: Ctx<P> & { user: SessionUser }) => Promise<unknown>;

/** route() for /api/admin/**: admins only, checked against the account on every call. */
export function adminRoute<P = Record<string, string>>(handler: AdminHandler<P>, rate?: { limit: number; windowMs: number }) {
  return route<P>(
    async (ctx) => {
      if (!(await stillAdmin(ctx.user!))) throw forbidden('This is for admins only.');
      return handler(ctx as Ctx<P> & { user: SessionUser });
    },
    { auth: 'admin', rate: rate ?? { limit: 240, windowMs: 60_000, key: 'admin' } }
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
    stats: h.stats ?? { views: 0, saves: 0, registerClicks: 0 },
    createdAt: h.createdAt,
    updatedAt: h.updatedAt,
  };
}
export type ListingRow = ReturnType<typeof listingRow>;

/** A stored listing → the editor's fields (dates in India time). */
export function listingToForm(h: LeanHackathon): ListingFormValues {
  const [lng, lat] = h.location?.coordinates ?? [];
  const point = cityPoint(h.city);
  // Only show coordinates when they differ from the city centre (a real venue point).
  const exact = typeof lat === 'number' && !(point && Math.abs(point.lat - lat) < 1e-6 && Math.abs(point.lng - lng) < 1e-6);
  return {
    ...EMPTY_LISTING_FORM,
    title: h.title,
    tagline: h.tagline ?? '',
    type: h.type,
    organizer: h.organizer ?? '',
    organizerType: h.organizerType ?? 'community',
    mode: h.mode,
    ...cityForForm(h.city),
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
    summary: h.summary ?? '',
    imageUrl: h.imageUrl ?? '',
    logoUrl: h.logoUrl ?? '',
  };
}

type LeanSubmission = ISubmission & { _id: unknown };

export function submissionRow(s: LeanSubmission, users: Map<string, { handle: string; name: string }>) {
  const draft = (s.extracted ?? null) as Draft | null;
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
    user: s.userId ? users.get(String(s.userId)) ?? null : null,
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

async function userMap(ids: unknown[]) {
  const list = ids.filter(Boolean).map(String);
  if (!list.length) return new Map<string, { handle: string; name: string }>();
  const users = await User.find({ _id: { $in: [...new Set(list)] } }).select('handle name email').lean();
  return new Map(users.map((u) => [String(u._id), { handle: u.handle, name: u.name, email: u.email ?? '' }]));
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
    AgentRun.find().sort({ startedAt: -1 }).limit(6).select('-log -errorLog').lean(),
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
  note?: string;
}

/** Edits a listing and/or moves it between states (approve, reject, remove, restore). */
export async function updateListing(id: string, patch: ListingPatch, admin: SessionUser) {
  const doc = await Hackathon.findById(id);
  if (!doc) throw notFound('That listing');
  const before = doc.state;
  // The slug stays as it is, so shared links keep working after a title edit.
  if (patch.fields) for (const [key, value] of Object.entries(inputToListing(patch.fields))) doc.set(key, value);
  if (patch.featured !== undefined) doc.featured = patch.featured;
  if (patch.verified !== undefined) doc.verified = patch.verified;
  if (patch.state && patch.state !== before) {
    const by = `@${admin.handle}${patch.note ? `: ${patch.note}` : ''}`;
    // Flags explain why it waited in the queue; once a person approves it they're settled.
    if (patch.state === 'live' && before === 'pending') doc.flags = [];
    if (patch.state === 'rejected') doc.flags = [...(doc.flags ?? []), `Rejected by ${by}`];
    if (patch.state === 'removed') doc.flags = [...(doc.flags ?? []), `Removed by ${by}`];
    if (patch.state === 'live' && (before === 'removed' || before === 'rejected')) doc.flags = [...(doc.flags ?? []), `Restored by ${by}`];
    doc.state = patch.state;
  }
  await doc.save();
  if (before === 'pending' && doc.state === 'live' && doc.submittedBy) {
    await notify(doc.submittedBy, 'listing-live', `“${doc.title}” is live`, 'Thanks for sharing it. Students can find it now.', `/hackathons/${doc.slug}`);
  }
  return listingRow(doc.toObject());
}

export async function getListingDetail(id: string) {
  const doc = await Hackathon.findById(id).lean();
  if (!doc) throw notFound('That listing');
  const [raw, subs, reports] = await Promise.all([
    RawItem.find({ hackathonId: doc._id })
      .sort({ fetchedAt: -1 })
      .limit(20)
      .select('source url title status confidence notes imageUrls fetchedAt error')
      .lean(),
    Submission.find({ hackathonId: doc._id }).sort({ createdAt: -1 }).limit(20).lean(),
    Report.find({ hackathonSlug: doc.slug }).sort({ createdAt: -1 }).limit(20).lean(),
  ]);
  const users = await userMap(subs.map((s) => s.userId));
  return {
    listing: { ...listingRow(doc), tagline: doc.tagline ?? '', summary: doc.summary ?? '', submittedBy: doc.submittedBy ? String(doc.submittedBy) : null },
    form: listingToForm(doc),
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
  await from.save();

  await Promise.all([
    RawItem.updateMany({ hackathonId: from._id }, { $set: { hackathonId: into._id, status: 'merged' } }),
    Submission.updateMany({ hackathonId: from._id }, { $set: { hackathonId: into._id } }),
    moveSaves(from.slug, into.slug),
  ]);
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
  sub.reviewedBy = new Types.ObjectId(admin.id);
  sub.reviewedAt = new Date();
  sub.reviewNote = note;
  await sub.save();
  await tellSubmitter(sub, listing, false);
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
  sub.reviewedBy = new Types.ObjectId(admin.id);
  sub.reviewedAt = new Date();
  sub.reviewNote = note;
  await sub.save();
  if (into.state === 'live') await tellSubmitter(sub, into, true);
  return { id: String(into._id), slug: into.slug };
}

export async function rejectSubmission(id: string, admin: SessionUser, note: string) {
  const sub = await loadPendingSubmission(id);
  sub.status = 'rejected';
  sub.reviewedBy = new Types.ObjectId(admin.id);
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
}

export async function getSubmissionDetail(id: string) {
  const sub = await Submission.findById(id).lean();
  if (!sub) throw notFound('That submission');
  const users = await userMap([sub.userId, sub.reviewedBy]);
  const draft = (sub.extracted ?? null) as Draft | null;
  const linked = sub.hackathonId ? await Hackathon.findById(sub.hackathonId).lean() : null;
  return {
    submission: {
      ...submissionRow(sub, users),
      message: sub.message ?? '',
      imageUrls: sub.imageUrls ?? [],
      fields: sub.fields ?? {},
      draft,
      reviewedBy: sub.reviewedBy ? users.get(String(sub.reviewedBy)) ?? null : null,
      ip: sub.ip ?? '',
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
  };
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
