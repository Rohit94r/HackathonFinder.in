import 'server-only';
import type { PipelineStage } from 'mongoose';
import { z } from 'zod';
import { CITIES, distanceKm, type LatLng } from '@hackathonfinder/shared';
import {
  AUTHOR_FIELDS,
  Hackathon,
  Invite,
  TeamPost,
  TeamRequest,
  Types,
  User,
  connectDb,
  isDbConfigured,
  logActivity,
  notify,
  toAuthor,
  toPublicUser,
  type IHackathon,
  type IInvite,
  type ITeamPost,
  type ITeamRequest,
  type IUser,
} from '@hackathonfinder/db';
import { SKILLS } from '@/data/skills';
import type {
  CitySnapshot,
  Inbox,
  JoinRequest,
  PeoplePage,
  PostSummary,
  ResultCounts,
  Student,
  TeamInvite,
  TeamPost as TeamPostView,
  TeamPostsPage,
  TeamStudent,
} from '@/data/teamPosts';
import { badRequest, conflict, forbidden, notFound } from './api';
import type { SessionUser } from './auth';

type Id = Types.ObjectId | string;
type Listing = Pick<IHackathon, 'slug' | 'title' | 'registrationDeadline' | 'startDate' | 'teamMax'>;

const CITY_SLUGS = CITIES.map((c) => c.slug);
const STATES = [...new Set(CITIES.map((c) => c.state))];
const FAR = 1e9;
const INBOX_LIMIT = 100;

const iso = (d: Date | string | undefined | null) => (d ? new Date(d).toISOString() : '');
const oid = (id: Id) => (typeof id === 'string' ? new Types.ObjectId(id) : id);
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const cityPoint = (slug: string) => CITIES.find((c) => c.slug === slug);

// ---------------------------------------------------------------------------
// Query and body schemas (shared by the routes and the server-rendered pages)

const csv = z
  .string()
  .max(500)
  .transform((s) => [...new Set(s.split(',').map((x) => x.trim()).filter(Boolean))].slice(0, 20));

const flag = z.enum(['0', '1', 'true', 'false']).transform((v) => v === '1' || v === 'true');

/** "lat,lng" or "lat,lng,km": where the student is, and optionally how far they'll go. */
const near = z
  .string()
  .regex(/^-?\d{1,2}(\.\d+)?,-?\d{1,3}(\.\d+)?(,\d{1,5}(\.\d+)?)?$/, 'Use near=lat,lng or near=lat,lng,km.')
  .transform((s) => {
    const [lat, lng, km] = s.split(',').map(Number);
    return { lat, lng, km: km > 0 ? km : undefined };
  })
  .refine((p) => Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180, 'That place is off the map.');

const city = z.string().trim().refine((v) => v === '' || v === 'online' || CITY_SLUGS.includes(v), 'Unknown city.');
const state = z.string().trim().refine((v) => v === '' || STATES.includes(v), 'Unknown state.');
const page = z.coerce.number().int().min(1).max(500).default(1);
const limit = z.coerce.number().int().min(1).max(100).default(24);

export const TeamPostQuery = z.object({
  city: city.optional(),
  state: state.optional(),
  hackathon: z.string().trim().max(120).optional(),
  skills: csv.optional(),
  /** Match `skills` against what a team needs (default) or already has. */
  skillIn: z.enum(['needs', 'has']).default('needs'),
  /** Teams that work this way: in-person and online include "either". */
  mode: z.enum(['in-person', 'online', 'either']).optional(),
  q: z.string().trim().max(100).optional(),
  near: near.optional(),
  sort: z.enum(['newest', 'nearest', 'match']).default('newest'),
  /** The viewer's skills, for sort=match: teams needing more of them come first. */
  match: csv.optional(),
  /** 'me' or a handle: that student's posts, including closed ones. */
  author: z.string().trim().toLowerCase().max(40).optional(),
  /** Leave out the signed-in student's own posts. */
  notMine: flag.optional(),
  /** Add open post totals per city. */
  counts: flag.optional(),
  page,
  limit,
});
export type TeamPostQueryInput = z.infer<typeof TeamPostQuery>;

export const PeopleQuery = z.object({
  city: city.optional(),
  state: state.optional(),
  skills: csv.optional(),
  q: z.string().trim().max(100).optional(),
  near: near.optional(),
  sort: z.enum(['newest', 'nearest', 'match']).default('newest'),
  /** Skills a team needs, for sort=match: students who have more of them come first. */
  match: csv.optional(),
  /** The viewer's skills, for sort=match: students who bring skills the viewer lacks come first. */
  lack: csv.optional(),
  /** Leave out the signed-in student. */
  notMe: flag.optional(),
  page,
  limit,
});
export type PeopleQueryInput = z.infer<typeof PeopleQuery>;

const skillList = z
  .array(z.string().refine((s) => SKILLS.includes(s), 'Pick skills from the list.'))
  .max(SKILLS.length)
  .transform((list) => [...new Set(list)]);
const idea = z
  .string()
  .trim()
  .min(20, 'Tell people your idea in a line or two (at least 20 characters).')
  .max(500, 'Keep your idea under 500 characters.');

export const NewTeamPost = z.object({
  hackathonSlug: z.string().trim().min(1, 'Pick a hackathon.').max(120),
  city: z.string().trim().refine((v) => v === 'online' || CITY_SLUGS.includes(v), 'Pick where your team works from.'),
  mode: z.enum(['in-person', 'online', 'either']),
  members: z.number().int().min(1, 'Count yourself in.').max(19),
  teamMax: z.number().int().min(2, 'A team needs at least 2 people.').max(20),
  has: skillList.default([]),
  needs: skillList.refine((list) => list.length > 0, 'Pick at least one skill you need.'),
  idea,
});

export const TeamPostPatch = z
  .object({
    idea: idea.optional(),
    has: skillList.optional(),
    needs: skillList.refine((list) => list.length > 0, 'Pick at least one skill you need.').optional(),
    members: z.number().int().min(1).max(20).optional(),
    teamMax: z.number().int().min(2).max(20).optional(),
    open: z.boolean().optional(),
  })
  .refine((p) => Object.values(p).some((v) => v !== undefined), 'Send at least one change.');

export const Message = z.string().trim().max(500, 'Keep your message under 500 characters.').default('');

// ---------------------------------------------------------------------------
// Shared lookups

function isOpenListing(l: Pick<IHackathon, 'registrationDeadline' | 'startDate'>, now: Date): boolean {
  return new Date(l.registrationDeadline) >= now && new Date(l.startDate) > now;
}

/** Live listings still taking registrations: team posts for anything else are hidden. */
async function openListingSlugs(now: Date): Promise<string[]> {
  const docs = await Hackathon.find({ state: 'live', registrationDeadline: { $gte: now }, startDate: { $gt: now } })
    .select('slug')
    .lean();
  return docs.map((d) => d.slug);
}

/** Banned and deleted students: their posts and profiles don't show. */
async function hiddenUserIds(): Promise<Types.ObjectId[]> {
  const docs = await User.find({ $or: [{ banned: true }, { deletedAt: { $ne: null } }] })
    .select('_id')
    .lean();
  return docs.map((d) => d._id);
}

async function usersById(ids: Id[]): Promise<Map<string, IUser>> {
  if (!ids.length) return new Map();
  const docs = await User.find({ _id: { $in: ids } })
    .select(`${AUTHOR_FIELDS} deletedAt`)
    .lean();
  return new Map(docs.map((d) => [String(d._id), d]));
}

function student(doc: IUser | undefined): TeamStudent {
  return toAuthor(doc && !doc.deletedAt ? doc : null);
}

async function listingsBySlug(slugs: string[]): Promise<Map<string, Listing>> {
  if (!slugs.length) return new Map();
  const docs = await Hackathon.find({ slug: { $in: [...new Set(slugs)] } })
    .select('slug title registrationDeadline startDate teamMax')
    .lean();
  return new Map(docs.map((d) => [d.slug, d]));
}

function citiesWithin(origin: LatLng, km: number): string[] {
  return CITIES.filter((c) => distanceKm(origin, c) <= km).map((c) => c.slug);
}

/** Km from `origin` to the record's city centre; far away for online teams or unknown cities. */
function kmExpression(origin: LatLng) {
  return {
    $switch: {
      branches: CITIES.map((c) => ({ case: { $eq: ['$city', c.slug] }, then: distanceKm(origin, c) })),
      default: FAR,
    },
  };
}

function kmFrom(origin: LatLng | undefined, slug: string): number | undefined {
  const point = cityPoint(slug);
  return origin && point ? Math.round(distanceKm(origin, point)) : undefined;
}

const citiesInState = (name: string) => CITIES.filter((c) => c.state === name).map((c) => c.slug);
const citiesMatching = (rx: RegExp) => CITIES.filter((c) => rx.test(c.name) || rx.test(c.state)).map((c) => c.slug);

function pageOf<T>(items: T[], total: number, q: { page: number; limit: number }) {
  return { items, total, page: q.page, pages: Math.max(1, Math.ceil(total / q.limit)) };
}

async function runPaged<T>(
  model: typeof TeamPost | typeof User,
  match: Record<string, unknown>,
  extra: PipelineStage[],
  sort: Record<string, 1 | -1>,
  q: { page: number; limit: number },
  project?: Record<string, 0 | 1>
): Promise<{ docs: T[]; total: number }> {
  const items: PipelineStage.FacetPipelineStage[] = [{ $sort: sort }, { $skip: (q.page - 1) * q.limit }, { $limit: q.limit }];
  if (project) items.push({ $project: project });
  const pipeline: PipelineStage[] = [{ $match: match }, ...extra, { $facet: { items, total: [{ $count: 'n' }] } }];
  const [res] = await (model as typeof TeamPost).aggregate<{ items: T[]; total: { n: number }[] }>(pipeline);
  return { docs: res?.items ?? [], total: res?.total[0]?.n ?? 0 };
}

// ---------------------------------------------------------------------------
// Team posts

function toTeamPost(d: ITeamPost, author: IUser | undefined, listing: Listing | undefined, origin?: LatLng): TeamPostView {
  return {
    id: String(d._id),
    author: student(author),
    city: d.city,
    mode: d.mode,
    hackathonSlug: d.hackathonSlug,
    hackathonTitle: listing?.title ?? 'A hackathon',
    hackathonDeadline: iso(listing?.registrationDeadline),
    members: d.members,
    teamMax: d.teamMax,
    has: d.has ?? [],
    needs: d.needs ?? [],
    idea: d.idea,
    open: Boolean(d.open) && d.members < d.teamMax,
    createdAt: iso(d.createdAt),
    updatedAt: iso(d.updatedAt),
    km: kmFrom(origin, d.city),
  };
}

async function decoratePosts(docs: ITeamPost[], origin?: LatLng): Promise<TeamPostView[]> {
  const [authors, listings] = await Promise.all([
    usersById(docs.map((d) => d.authorId)),
    listingsBySlug(docs.map((d) => d.hackathonSlug)),
  ]);
  return docs.map((d) => toTeamPost(d, authors.get(String(d.authorId)), listings.get(d.hackathonSlug), origin));
}

/** Text search over the idea, skills, city, hackathon title and the author's name and college. */
async function teamSearch(q: string): Promise<Record<string, unknown>[]> {
  const rx = new RegExp(escapeRegex(q), 'i');
  const [authors, listings] = await Promise.all([
    User.find({ $or: [{ name: rx }, { college: rx }, { about: rx }, { handle: rx }] }).select('_id').limit(500).lean(),
    Hackathon.find({ $or: [{ title: rx }, { organizer: rx }] }).select('slug').limit(200).lean(),
  ]);
  const cities = citiesMatching(rx);
  if (rx.test('online')) cities.push('online');
  return [
    { idea: rx },
    { has: rx },
    { needs: rx },
    { authorId: { $in: authors.map((a) => a._id) } },
    { hackathonSlug: { $in: listings.map((l) => l.slug) } },
    { city: { $in: cities } },
  ];
}

/** Open posts for open listings by students who are still around. */
async function baseTeamMatch(now: Date, exclude: Types.ObjectId[] = []) {
  const [slugs, hidden] = await Promise.all([openListingSlugs(now), hiddenUserIds()]);
  const match: Record<string, unknown> = { deletedAt: null, open: true, hackathonSlug: { $in: slugs } };
  const out = [...hidden, ...exclude];
  if (out.length) match.authorId = { $nin: out };
  return match;
}

export async function listTeamPosts(q: TeamPostQueryInput, viewerId?: string | null): Promise<TeamPostsPage> {
  const now = new Date();
  let match: Record<string, unknown>;
  if (q.author) {
    // One student's posts, open or closed, for their own list and profile pages.
    const authorId =
      q.author === 'me' ? (viewerId ? oid(viewerId) : null) : (await User.findOne({ handle: q.author, deletedAt: null }).select('_id').lean())?._id;
    if (!authorId) return pageOf([], 0, q);
    match = { deletedAt: null, authorId };
  } else {
    match = await baseTeamMatch(now, q.notMine && viewerId ? [oid(viewerId)] : []);
  }

  const and: Record<string, unknown>[] = [];
  if (q.city) and.push({ city: q.city });
  if (q.state) and.push({ city: { $in: citiesInState(q.state) } });
  if (q.hackathon) and.push({ hackathonSlug: q.hackathon });
  if (q.mode === 'either') and.push({ mode: 'either' });
  else if (q.mode) and.push({ mode: { $in: [q.mode, 'either'] } });
  if (q.skills?.length) and.push({ [q.skillIn]: { $in: q.skills } });
  // Distance is city to city; online teams have no place, so a distance filter leaves them out.
  if (q.near?.km) and.push({ city: { $in: citiesWithin(q.near, q.near.km) } });
  if (q.q) and.push({ $or: await teamSearch(q.q) });
  if (and.length) match.$and = and;

  const extra: PipelineStage[] = [];
  const sort: Record<string, 1 | -1> = {};
  const fields: Record<string, unknown> = {};
  if (q.near) fields._km = kmExpression(q.near);
  if (q.sort === 'match' && q.match?.length) {
    fields._hits = { $size: { $setIntersection: ['$needs', q.match] } };
    extra.push({ $addFields: fields });
    extra.push({
      $addFields: { _pct: { $cond: [{ $gt: [{ $size: '$needs' }, 0] }, { $divide: ['$_hits', { $size: '$needs' }] }, -1] } },
    });
    Object.assign(sort, { _pct: -1, _hits: -1 }, q.near ? { _km: 1 } : {});
  } else {
    if (Object.keys(fields).length) extra.push({ $addFields: fields });
    if (q.sort === 'nearest' && q.near) sort._km = 1;
  }
  Object.assign(sort, { createdAt: -1, _id: -1 });

  const [{ docs, total }, counts] = await Promise.all([
    runPaged<ITeamPost>(TeamPost, match, extra, sort, q),
    q.counts ? teamPostCounts(now) : Promise.resolve(undefined),
  ]);
  const items = await decoratePosts(docs, q.near);
  return { ...pageOf(items, total, q), ...(counts ? { counts } : {}) };
}

/** Open team posts per city slug, plus 'online'. */
export async function teamPostCounts(now = new Date()): Promise<Record<string, number>> {
  const match = await baseTeamMatch(now);
  const rows = await TeamPost.aggregate<{ _id: string; n: number }>([{ $match: match }, { $group: { _id: '$city', n: { $sum: 1 } } }]);
  return Object.fromEntries(rows.map((r) => [r._id, r.n]));
}

export async function createTeamPost(user: SessionUser, input: z.infer<typeof NewTeamPost>): Promise<TeamPostView> {
  const now = new Date();
  const listing = await Hackathon.findOne({ slug: input.hackathonSlug, state: 'live' })
    .select('slug title registrationDeadline startDate teamMax')
    .lean();
  if (!listing || !isOpenListing(listing, now)) {
    throw badRequest('That hackathon isn’t taking registrations any more. Pick another one.', { hackathonSlug: 'Pick an open hackathon.' });
  }
  if (listing.teamMax < 2) {
    throw badRequest('That hackathon is solo only, so it doesn’t need a team.', { hackathonSlug: 'This one is solo only.' });
  }
  if (input.teamMax > listing.teamMax) {
    const msg = `Teams for ${listing.title} can have at most ${listing.teamMax} people.`;
    throw badRequest(msg, { teamMax: msg });
  }
  if (input.members >= input.teamMax) {
    throw badRequest('Leave at least one spot open for someone to join.', { members: 'Leave at least one spot open.' });
  }
  if (await TeamPost.exists({ authorId: user.id, hackathonSlug: listing.slug, deletedAt: null, open: true })) {
    throw conflict('You already have an open team post for this hackathon. Update that one instead.');
  }

  const doc = await TeamPost.create({
    authorId: user.id,
    city: input.city,
    mode: input.city === 'online' ? 'online' : input.mode,
    hackathonSlug: listing.slug,
    members: input.members,
    teamMax: input.teamMax,
    has: input.has,
    needs: input.needs,
    idea: input.idea,
    open: true,
  });
  await logActivity(user.id, 'team-post', `Team post for ${listing.title}`, `/teams?hackathon=${listing.slug}`);
  const [post] = await decoratePosts([doc.toObject()]);
  return post;
}

async function ownPost(user: SessionUser, id: string, { allowAdmin = false } = {}) {
  const post = await TeamPost.findOne({ _id: id, deletedAt: null });
  if (!post) throw notFound('That team post');
  if (String(post.authorId) !== user.id && !(allowAdmin && user.role === 'admin')) {
    throw forbidden('Only the student who posted this team can change it.');
  }
  return post;
}

export async function updateTeamPost(user: SessionUser, id: string, patch: z.infer<typeof TeamPostPatch>): Promise<TeamPostView> {
  const post = await ownPost(user, id);
  const members = patch.members ?? post.members;
  const teamMax = patch.teamMax ?? post.teamMax;
  if (patch.teamMax !== undefined) {
    const listing = await Hackathon.findOne({ slug: post.hackathonSlug }).select('title teamMax').lean();
    if (listing && teamMax > listing.teamMax) {
      const msg = `Teams for ${listing.title} can have at most ${listing.teamMax} people.`;
      throw badRequest(msg, { teamMax: msg });
    }
  }
  if (members > teamMax) {
    throw badRequest('That’s more members than your team size. Raise the team size first.', { members: 'More than your team size.' });
  }
  if (patch.open === true && members >= teamMax) {
    throw badRequest('Your team is full. Raise the team size to open it again.', { open: 'Your team is full.' });
  }

  if (patch.idea !== undefined) post.idea = patch.idea;
  if (patch.has !== undefined) post.has = patch.has;
  if (patch.needs !== undefined) post.needs = patch.needs;
  post.members = members;
  post.teamMax = teamMax;
  // A full team closes itself; otherwise the author decides.
  post.open = members < teamMax && (patch.open ?? post.open);
  await post.save();
  const [view] = await decoratePosts([post.toObject()]);
  return view;
}

/** Soft delete. Pending requests stay, and show the post as removed. */
export async function removeTeamPost(user: SessionUser, id: string): Promise<void> {
  const post = await ownPost(user, id, { allowAdmin: true });
  post.deletedAt = new Date();
  post.open = false;
  await post.save();
}

/** Adds one member if there's room, closing the post when that fills it. Null when full or removed. */
async function addMember(postId: Id): Promise<ITeamPost | null> {
  const post = await TeamPost.findOneAndUpdate(
    { _id: postId, deletedAt: null, $expr: { $lt: ['$members', '$teamMax'] } },
    { $inc: { members: 1 } },
    { new: true }
  ).lean();
  if (post && post.members >= post.teamMax && post.open) {
    await TeamPost.updateOne({ _id: postId }, { $set: { open: false } });
    post.open = false;
  }
  return post;
}

// ---------------------------------------------------------------------------
// Requests and invites

async function postSummaries(ids: Id[]): Promise<Map<string, PostSummary>> {
  if (!ids.length) return new Map();
  const posts = await TeamPost.find({ _id: { $in: ids } }).lean();
  const listings = await listingsBySlug(posts.map((p) => p.hackathonSlug));
  return new Map(
    posts.map((p) => [
      String(p._id),
      {
        id: String(p._id),
        hackathonSlug: p.hackathonSlug,
        hackathonTitle: listings.get(p.hackathonSlug)?.title ?? 'A hackathon',
        city: p.city,
        members: p.members,
        teamMax: p.teamMax,
        open: Boolean(p.open) && !p.deletedAt && p.members < p.teamMax,
        removed: Boolean(p.deletedAt),
      },
    ])
  );
}

type Link = Pick<ITeamRequest, '_id' | 'fromUserId' | 'toUserId' | 'message' | 'status' | 'createdAt' | 'updatedAt'> & {
  postId?: Types.ObjectId | null;
};

async function decorateLinks(docs: Link[]): Promise<(JoinRequest & TeamInvite)[]> {
  const postIds = docs.map((d) => d.postId).filter((id): id is Types.ObjectId => Boolean(id));
  const [posts, users] = await Promise.all([postSummaries(postIds), usersById(docs.flatMap((d) => [d.fromUserId, d.toUserId]))]);
  return docs.map((d) => ({
    id: String(d._id),
    status: d.status,
    message: d.message ?? '',
    createdAt: iso(d.createdAt),
    updatedAt: iso(d.updatedAt),
    post: d.postId ? posts.get(String(d.postId)) ?? null : null,
    from: student(users.get(String(d.fromUserId))),
    to: student(users.get(String(d.toUserId))),
  }));
}

const answeredAlready = (status: string) => conflict(`This was already ${status === 'withdrawn' ? 'withdrawn' : status}.`);

export async function requestToJoin(user: SessionUser, postId: string, message: string): Promise<JoinRequest> {
  const post = await TeamPost.findOne({ _id: postId, deletedAt: null }).lean();
  if (!post) throw notFound('That team post');
  if (String(post.authorId) === user.id) throw badRequest('That’s your own team.');
  if (!post.open || post.members >= post.teamMax) throw conflict('This team isn’t taking new members right now.');

  let doc = await TeamRequest.findOne({ postId: post._id, fromUserId: user.id });
  if (doc) {
    if (doc.status === 'pending') throw conflict('You already asked to join this team.');
    if (doc.status === 'accepted') throw conflict('You’re already on this team.');
    if (doc.status === 'declined') throw conflict('This team already answered your request.');
    // A withdrawn request can be sent again.
    doc.status = 'pending';
    doc.message = message;
    await doc.save();
  } else {
    doc = await TeamRequest.create({ postId: post._id, fromUserId: user.id, toUserId: post.authorId, message });
  }

  const title = (await listingsBySlug([post.hackathonSlug])).get(post.hackathonSlug)?.title ?? 'a hackathon';
  await notify(post.authorId, 'team-request', `${user.name} asked to join your team`, message || `For ${title}.`, '/teams#my-requests');
  const [view] = await decorateLinks([doc.toObject()]);
  return view;
}

export async function answerRequest(user: SessionUser, id: string, status: 'accepted' | 'declined' | 'withdrawn'): Promise<JoinRequest> {
  const request = await TeamRequest.findById(id).lean();
  if (!request) throw notFound('That request');
  if (status === 'withdrawn') {
    if (String(request.fromUserId) !== user.id) throw forbidden('Only the student who sent this request can withdraw it.');
  } else if (String(request.toUserId) !== user.id) {
    throw forbidden('Only the team’s author can answer this request.');
  }
  if (request.status !== 'pending') throw answeredAlready(request.status);

  // Claim the request first, so two clicks can't add the same student twice.
  const updated = await TeamRequest.findOneAndUpdate({ _id: request._id, status: 'pending' }, { $set: { status } }, { new: true }).lean();
  if (!updated) throw conflict('This request was just answered.');

  if (status !== 'withdrawn') {
    const post = status === 'accepted' ? await addMember(request.postId) : await TeamPost.findById(request.postId).lean();
    if (status === 'accepted' && !post) {
      await TeamRequest.updateOne({ _id: request._id }, { $set: { status: 'pending' } });
      throw conflict('Your team is full or the post was removed. Raise the team size to take more people.');
    }
    const title = post ? (await listingsBySlug([post.hackathonSlug])).get(post.hackathonSlug)?.title ?? 'a hackathon' : 'a hackathon';
    if (status === 'accepted') {
      await notify(request.fromUserId, 'request-accepted', `${user.name} accepted your request`, `You’re on the team for ${title}.`, '/teams#my-requests');
    } else {
      await notify(
        request.fromUserId,
        'request-declined',
        `${user.name}’s team didn’t take your request`,
        `No worries, there are more teams for ${title}.`,
        post ? `/teams?hackathon=${post.hackathonSlug}` : '/teams'
      );
    }
  }
  const [view] = await decorateLinks([updated]);
  return view;
}

export async function myRequests(userId: string): Promise<Inbox<JoinRequest>> {
  const [sent, received] = await Promise.all([
    TeamRequest.find({ fromUserId: userId, status: { $ne: 'withdrawn' } }).sort({ updatedAt: -1 }).limit(INBOX_LIMIT).lean(),
    TeamRequest.find({ toUserId: userId, status: { $ne: 'withdrawn' } }).sort({ updatedAt: -1 }).limit(INBOX_LIMIT).lean(),
  ]);
  const [sentViews, receivedViews] = await Promise.all([decorateLinks(sent), decorateLinks(received)]);
  // Requests to a post the author removed are only noise for them.
  return { sent: sentViews, received: receivedViews.filter((r) => r.post && !r.post.removed) };
}

export async function sendInvite(
  user: SessionUser,
  input: { toHandle: string; postId?: string; message: string }
): Promise<TeamInvite> {
  const target = await User.findOne({ handle: input.toHandle }).select('_id name deletedAt banned').lean();
  if (!target || target.deletedAt || target.banned) throw notFound('That student');
  if (String(target._id) === user.id) throw badRequest('You can’t invite yourself.');

  let title = '';
  if (input.postId) {
    const post = await TeamPost.findOne({ _id: input.postId, deletedAt: null }).lean();
    if (!post) throw notFound('That team post');
    if (String(post.authorId) !== user.id) throw forbidden('You can only invite people to your own team.');
    if (!post.open || post.members >= post.teamMax) throw conflict('That team is full or closed. Open it again first.');
    title = (await listingsBySlug([post.hackathonSlug])).get(post.hackathonSlug)?.title ?? '';
  }

  let doc = await Invite.findOne({ fromUserId: user.id, toUserId: target._id });
  if (doc) {
    if (doc.status === 'pending') throw conflict(`You already invited ${target.name}.`);
    if (doc.status === 'accepted') throw conflict(`${target.name} already accepted your invite.`);
    if (doc.status === 'declined') throw conflict(`${target.name} already answered your invite.`);
    doc.status = 'pending';
    doc.message = input.message;
    doc.postId = input.postId ? oid(input.postId) : undefined;
    await doc.save();
  } else {
    doc = await Invite.create({ fromUserId: user.id, toUserId: target._id, postId: input.postId, message: input.message });
  }

  await notify(
    target._id,
    'invite',
    `${user.name} invited you to their team`,
    input.message || (title ? `For ${title}.` : 'Take a look at their profile and say hi.'),
    '/teams#my-requests'
  );
  const [view] = await decorateLinks([doc.toObject() as IInvite]);
  return view;
}

export async function answerInvite(user: SessionUser, id: string, status: 'accepted' | 'declined' | 'withdrawn'): Promise<TeamInvite> {
  const invite = await Invite.findById(id).lean();
  if (!invite) throw notFound('That invite');
  if (status === 'withdrawn') {
    if (String(invite.fromUserId) !== user.id) throw forbidden('Only the student who sent this invite can withdraw it.');
  } else if (String(invite.toUserId) !== user.id) {
    throw forbidden('Only the invited student can answer this invite.');
  }
  if (invite.status !== 'pending') throw answeredAlready(invite.status);

  const updated = await Invite.findOneAndUpdate({ _id: invite._id, status: 'pending' }, { $set: { status } }, { new: true }).lean();
  if (!updated) throw conflict('This invite was just answered.');

  if (status === 'accepted') {
    let title = '';
    if (invite.postId) {
      const post = await addMember(invite.postId);
      if (!post) {
        await Invite.updateOne({ _id: invite._id }, { $set: { status: 'pending' } });
        throw conflict('That team is already full or the post was removed.');
      }
      title = (await listingsBySlug([post.hackathonSlug])).get(post.hackathonSlug)?.title ?? '';
    }
    await notify(
      invite.fromUserId,
      'invite-accepted',
      `${user.name} accepted your invite`,
      title ? `They’re on your team for ${title}.` : 'Say hi and plan your next hackathon together.',
      '/teams#my-requests'
    );
  }
  const [view] = await decorateLinks([updated]);
  return view;
}

export async function myInvites(userId: string): Promise<Inbox<TeamInvite>> {
  const [sent, received] = await Promise.all([
    Invite.find({ fromUserId: userId, status: { $ne: 'withdrawn' } }).sort({ updatedAt: -1 }).limit(INBOX_LIMIT).lean(),
    Invite.find({ toUserId: userId, status: { $ne: 'withdrawn' } }).sort({ updatedAt: -1 }).limit(INBOX_LIMIT).lean(),
  ]);
  const [s, r] = await Promise.all([decorateLinks(sent), decorateLinks(received)]);
  return { sent: s, received: r };
}

// ---------------------------------------------------------------------------
// People

function resultCounts(record: { result: string }[] = []): ResultCounts {
  return {
    hackathons: record.length,
    wins: record.filter((r) => r.result === 'winner').length,
    podiums: record.filter((r) => r.result === 'winner' || r.result === 'runner-up').length,
    finals: record.filter((r) => r.result !== 'participant').length,
  };
}

// Aggregations skip `select: false`, so list exactly what's public.
const PERSON_FIELDS = {
  name: 1, handle: 1, image: 1, about: 1, college: 1, city: 1, skills: 1, bio: 1, github: 1, linkedin: 1,
  lookingForTeam: 1, role: 1, isSample: 1, joinedAt: 1, createdAt: 1, 'record.result': 1,
} as const;

export async function listPeople(q: PeopleQueryInput, viewerId?: string | null): Promise<PeoplePage> {
  const match: Record<string, unknown> = { lookingForTeam: true, deletedAt: null, banned: { $ne: true } };
  if (q.notMe && viewerId) match._id = { $ne: oid(viewerId) };

  const and: Record<string, unknown>[] = [];
  if (q.city && q.city !== 'online') and.push({ city: q.city });
  if (q.state) and.push({ city: { $in: citiesInState(q.state) } });
  if (q.skills?.length) and.push({ skills: { $in: q.skills } });
  if (q.near?.km) and.push({ city: { $in: citiesWithin(q.near, q.near.km) } });
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), 'i');
    and.push({
      $or: [{ name: rx }, { handle: rx }, { college: rx }, { about: rx }, { bio: rx }, { skills: rx }, { city: { $in: citiesMatching(rx) } }],
    });
  }
  if (and.length) match.$and = and;

  const extra: PipelineStage[] = [];
  const sort: Record<string, 1 | -1> = {};
  const fields: Record<string, unknown> = {};
  if (q.near) fields._km = kmExpression(q.near);
  const skills = { $ifNull: ['$skills', []] };
  if (q.sort === 'match' && (q.match?.length || q.lack?.length)) {
    if (q.match?.length) {
      // Share of the skills a team needs that this student has.
      fields._hits = { $size: { $setIntersection: [skills, q.match] } };
      extra.push({ $addFields: fields }, { $addFields: { _pct: { $divide: ['$_hits', q.match.length] } } });
    } else {
      // Share of this student's skills the viewer doesn't have.
      fields._hits = { $size: { $setDifference: [skills, q.lack] } };
      extra.push(
        { $addFields: fields },
        { $addFields: { _pct: { $cond: [{ $gt: [{ $size: skills }, 0] }, { $divide: ['$_hits', { $size: skills }] }, -1] } } }
      );
    }
    Object.assign(sort, { _pct: -1, _hits: -1 }, q.near ? { _km: 1 } : {});
  } else {
    if (Object.keys(fields).length) extra.push({ $addFields: fields });
    if (q.sort === 'nearest' && q.near) sort._km = 1;
  }
  Object.assign(sort, { joinedAt: -1, _id: -1 });

  const { docs, total } = await runPaged<IUser>(User, match, extra, sort, q, PERSON_FIELDS);
  const items: Student[] = docs.map((d) => {
    const pub = toPublicUser(d);
    return {
      id: pub.id,
      handle: pub.handle,
      name: pub.name,
      image: pub.image,
      about: pub.about,
      college: pub.college,
      city: pub.city,
      skills: pub.skills,
      isSample: pub.isSample,
      bio: pub.bio,
      github: pub.github,
      linkedin: pub.linkedin,
      lookingForTeam: pub.lookingForTeam,
      joinedAt: pub.joinedAt,
      results: resultCounts(d.record),
      km: kmFrom(q.near, pub.city),
    };
  });
  return pageOf(items, total, q);
}

// ---------------------------------------------------------------------------
// Pages

const emptyPage = { items: [], total: 0, page: 1, pages: 1 };

/** First pages for the Team Finder, rendered on the server for a fast first paint. Empty without a database. */
export async function loadTeamBoard(teamsQs: string, peopleQs: string, viewerId?: string | null) {
  if (!isDbConfigured()) return { teams: emptyPage as TeamPostsPage, people: emptyPage as PeoplePage };
  await connectDb();
  const parse = <T>(schema: z.ZodType<T>, qs: string) => schema.parse(Object.fromEntries(new URLSearchParams(qs)));
  const [teams, people] = await Promise.all([
    listTeamPosts(parse(TeamPostQuery, teamsQs), viewerId),
    listPeople(parse(PeopleQuery, peopleQs), viewerId),
  ]);
  return { teams, people };
}

/** Students and open teams in one city, for the city page. */
export async function loadCitySnapshot(slug: string): Promise<CitySnapshot> {
  if (!isDbConfigured()) return { students: [], studentTotal: 0, lookingTotal: 0, teamTotal: 0 };
  await connectDb();
  const who = { city: slug, deletedAt: null, banned: { $ne: true } };
  const [students, studentTotal, lookingTotal, teamMatch] = await Promise.all([
    User.find(who).sort({ lookingForTeam: -1, joinedAt: -1 }).limit(6).select('handle name').lean(),
    User.countDocuments(who),
    User.countDocuments({ ...who, lookingForTeam: true }),
    baseTeamMatch(new Date()),
  ]);
  const teamTotal = await TeamPost.countDocuments({ ...teamMatch, city: slug });
  return { students: students.map((s) => ({ handle: s.handle, name: s.name })), studentTotal, lookingTotal, teamTotal };
}
