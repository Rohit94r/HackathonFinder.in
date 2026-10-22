import 'server-only';
import type { PipelineStage } from 'mongoose';
import { z } from 'zod';
import { CITIES } from '@hackathonfinder/shared';
import {
  AUTHOR_FIELDS,
  CATEGORY_IDS,
  connectDb,
  Hackathon,
  isDbConfigured,
  logActivity,
  notify,
  Reply,
  Thread,
  toAuthor,
  uniqueSlug,
  User,
  Vote,
  type CategoryId,
  type IReply,
  type IThread,
} from '@hackathonfinder/db';
import { excerpt } from '@/data/discussions';
import {
  BODY_MAX,
  BODY_MIN,
  EDIT_WINDOW_HOURS,
  MAX_TAGS,
  normalizeTag,
  REPLY_MAX,
  REPLY_MIN,
  TITLE_MAX,
  TITLE_MIN,
  type Author,
  type ReplyItem,
  type SortKey,
  type ThreadDetailData,
  type ThreadItem,
  type ThreadList,
  type Viewer,
} from '@/components/community/model';
import { ApiError, badRequest, forbidden, notFound } from './api';

const HOUR = 3_600_000;

type Id = { toString(): string } | string;
type ThreadDoc = Omit<IThread, never>;
type ReplyDoc = Omit<IReply, never>;

const iso = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString() : '');
const isAdmin = (viewer: Viewer | null | undefined) => viewer?.role === 'admin';

/** Pages call these reads directly, so they connect themselves (and show nothing without a database). */
async function dbReady(): Promise<boolean> {
  if (!isDbConfigured()) return false;
  await connectDb();
  return true;
}

// ── Validation shared by the routes ────────────────────────────────────────

const CITY_SLUGS = CITIES.map((c) => c.slug);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HANDLE = /^[a-z0-9](?:[a-z0-9-]{0,28}[a-z0-9])?$/;

/** Query strings send "" for an unset filter; treat it as missing. */
const blank = (v: unknown) => (v === '' || v === null ? undefined : v);
export const optional = <T extends z.ZodType>(schema: T) => z.preprocess(blank, schema.optional());
export const pageSchema = optional(z.coerce.number().int().min(1).max(500));
export const limitSchema = optional(z.coerce.number().int().min(1).max(50));

export const citySchema = z.string().trim().refine((v) => CITY_SLUGS.includes(v), 'Pick a city from the list.');
export const slugSchema = z.string().trim().toLowerCase().max(120).regex(SLUG, 'Not a valid link name.');
export const handleSchema = z.string().trim().toLowerCase().regex(HANDLE, 'Not a valid handle.');

const titleSchema = z
  .string('Add a title.')
  .trim()
  .min(TITLE_MIN, `Write a title of at least ${TITLE_MIN} characters. A clear question works best.`)
  .max(TITLE_MAX, `Keep the title under ${TITLE_MAX} characters.`);
const bodySchema = z
  .string('Add some details.')
  .trim()
  .min(BODY_MIN, `Add a few more details (at least ${BODY_MIN} characters).`)
  .max(BODY_MAX, `Keep it under ${BODY_MAX} characters.`);

/** Theme slugs or short words; "#Team Up" becomes "team-up". Duplicates are dropped. */
const tagsSchema = z
  .array(z.string().max(40))
  .max(MAX_TAGS * 2)
  .transform((tags) => [...new Set(tags.map(normalizeTag).filter(Boolean))])
  .refine((tags) => tags.length <= MAX_TAGS, `Use up to ${MAX_TAGS} tags.`);

export const NewThreadSchema = z.object({
  title: titleSchema,
  body: bodySchema,
  category: z.enum(CATEGORY_IDS as [CategoryId, ...CategoryId[]], 'Pick a topic so the right people see it.'),
  tags: tagsSchema.default([]),
  city: optional(citySchema),
  hackathonSlug: optional(slugSchema),
});

export const ThreadPatchSchema = z.object({
  title: titleSchema.optional(),
  body: bodySchema.optional(),
  tags: tagsSchema.optional(),
  pinned: z.boolean().optional(),
});

export const ThreadQuerySchema = z.object({
  category: optional(z.enum(CATEGORY_IDS as [CategoryId, ...CategoryId[]])),
  city: optional(citySchema),
  hackathon: optional(slugSchema),
  author: optional(handleSchema),
  q: optional(z.string().trim().max(100)),
  sort: optional(z.enum(['hot', 'new', 'top'])),
  pinned: optional(z.enum(['0', '1']).transform((v) => v === '1')),
  page: pageSchema,
  limit: limitSchema,
});

export const ReplySchema = z.object({
  body: z
    .string('Write your reply first.')
    .trim()
    .min(REPLY_MIN, 'Write your reply first.')
    .max(REPLY_MAX, `Keep replies under ${REPLY_MAX} characters.`),
});

export const VoteSchema = z.object({
  targetType: z.enum(['thread', 'reply']),
  targetId: z.string().regex(/^[a-f0-9]{24}$/i, 'Not a valid id.'),
});

// ── Reading ────────────────────────────────────────────────────────────────

/** Author lines for these user ids. Missing or deleted accounts read "Former student". */
export async function loadAuthors(ids: Id[]): Promise<(id: Id) => Author> {
  const unique = [...new Set(ids.map(String))];
  const docs = unique.length
    ? await User.find({ _id: { $in: unique } }).select(`${AUTHOR_FIELDS} deletedAt`).lean()
    : [];
  const byId = new Map(docs.map((d) => [String(d._id), toAuthor(d.deletedAt ? null : d)]));
  return (id) => byId.get(String(id)) ?? toAuthor(null);
}

/** Banned or deleted accounts can't post, even with a session that hasn't expired yet. */
export async function assertCanPost(userId: string): Promise<{ name: string }> {
  const user = await User.findById(userId).select('name banned deletedAt').lean();
  if (!user || user.deletedAt) throw new ApiError(401, 'unauthorized', 'Please sign in again.');
  if (user.banned) throw forbidden('Your account can’t post right now. Email us if you think this is a mistake.');
  return { name: user.name };
}

const canEditUntil = (t: Pick<ThreadDoc, 'createdAt'>) => new Date(t.createdAt).getTime() + EDIT_WINDOW_HOURS * HOUR;

function toThreadItem(
  t: ThreadDoc,
  author: Author,
  viewer: Viewer | null,
  voted: boolean,
  hackathonTitle: string | undefined,
  now: Date
): ThreadItem {
  const mine = Boolean(viewer && String(t.authorId) === viewer.id);
  return {
    id: String(t._id),
    slug: t.slug,
    title: t.title,
    body: t.body,
    category: t.category,
    tags: t.tags ?? [],
    city: t.city || undefined,
    hackathonSlug: t.hackathonSlug || undefined,
    hackathonTitle,
    pinned: Boolean(t.pinned),
    author,
    votes: t.votes ?? 0,
    voted,
    replyCount: t.replyCount ?? 0,
    mine,
    canEdit: mine && now.getTime() < canEditUntil(t),
    createdAt: iso(t.createdAt),
    lastActivityAt: iso(t.lastActivityAt ?? t.createdAt),
    editedAt: t.editedAt ? iso(t.editedAt) : undefined,
  };
}

function toReplyItem(r: ReplyDoc, author: Author, viewer: Viewer | null, voted: boolean): ReplyItem {
  return {
    id: String(r._id),
    body: r.body,
    author,
    votes: r.votes ?? 0,
    voted,
    mine: Boolean(viewer && String(r.authorId) === viewer.id),
    createdAt: iso(r.createdAt),
  };
}

async function votedIds(viewer: Viewer | null, targetType: 'thread' | 'reply', ids: Id[]): Promise<Set<string>> {
  if (!viewer || !ids.length) return new Set();
  const votes = await Vote.find({ userId: viewer.id, targetType, targetId: { $in: ids.map(String) } }).select('targetId').lean();
  return new Set(votes.map((v) => String(v.targetId)));
}

async function hackathonTitles(slugs: (string | undefined)[]): Promise<Map<string, string>> {
  const wanted = [...new Set(slugs.filter((s): s is string => Boolean(s)))];
  if (!wanted.length) return new Map();
  const docs = await Hackathon.find({ slug: { $in: wanted } }).select('slug title').lean();
  return new Map(docs.map((h) => [h.slug, h.title]));
}

/** Threads with their authors, the viewer's votes and event titles filled in. */
async function toThreadItems(threads: ThreadDoc[], viewer: Viewer | null, now: Date): Promise<ThreadItem[]> {
  const [authorOf, voted, titles] = await Promise.all([
    loadAuthors(threads.map((t) => t.authorId)),
    votedIds(viewer, 'thread', threads.map((t) => t._id)),
    hackathonTitles(threads.map((t) => t.hackathonSlug)),
  ]);
  return threads.map((t) =>
    toThreadItem(t, authorOf(t.authorId), viewer, voted.has(String(t._id)), t.hackathonSlug ? titles.get(t.hackathonSlug) : undefined, now)
  );
}

export interface ThreadFilters {
  category?: CategoryId;
  city?: string;
  hackathon?: string;
  /** Author handle. */
  author?: string;
  q?: string;
  /** Default hot. */
  sort?: SortKey;
  /** false hides pinned threads (for "From the community" boxes); true shows only them. */
  pinned?: boolean;
  /** Default 1. */
  page?: number;
  /** Default 20. */
  limit?: number;
}

/** Votes that decay with age: (votes + 1) / (hours since posting + 2)^1.5. */
function hotScore(now: Date) {
  return {
    $divide: [
      { $add: ['$votes', 1] },
      { $pow: [{ $add: [{ $divide: [{ $max: [0, { $subtract: [now, '$createdAt'] }] }, HOUR] }, 2] }, 1.5] },
    ],
  };
}

/** A page of threads, pinned first, then hot, new or top. Deleted threads never show. */
export async function listThreads(filters: ThreadFilters, viewer: Viewer | null): Promise<ThreadList> {
  const f = { ...filters, sort: filters.sort ?? 'hot', page: filters.page ?? 1, limit: filters.limit ?? 20 };
  const now = new Date();
  const empty: ThreadList = { items: [], page: f.page, limit: f.limit, total: 0, hasMore: false, counts: {}, now: now.toISOString() };
  if (!(await dbReady())) return empty;

  // $text has to come first in the pipeline, so it lives in the same $match.
  const base: Record<string, unknown> = { deletedAt: null };
  if (f.q) base.$text = { $search: f.q };
  if (f.city) base.city = f.city;
  if (f.hackathon) base.hackathonSlug = f.hackathon;
  if (f.pinned !== undefined) base.pinned = f.pinned ? true : { $ne: true };
  if (f.author) {
    const author = await User.findOne({ handle: f.author.toLowerCase(), deletedAt: null }).select('_id').lean();
    if (!author) return empty;
    base.authorId = author._id;
  }
  const match = f.category ? { ...base, category: f.category } : base;

  const order: Record<string, 1 | -1> =
    f.sort === 'new'
      ? { pinned: -1, createdAt: -1 }
      : f.sort === 'top'
        ? { pinned: -1, votes: -1, createdAt: -1 }
        : { pinned: -1, hot: -1, createdAt: -1 };
  const pipeline: PipelineStage[] = [{ $match: match }];
  if (f.sort === 'hot') pipeline.push({ $addFields: { hot: hotScore(now) } });
  pipeline.push({ $sort: order }, { $skip: (f.page - 1) * f.limit }, { $limit: f.limit + 1 });

  const [rows, total, perCategory] = await Promise.all([
    Thread.aggregate<ThreadDoc>(pipeline),
    Thread.countDocuments(match),
    Thread.aggregate<{ _id: string; n: number }>([{ $match: base }, { $group: { _id: '$category', n: { $sum: 1 } } }]),
  ]);

  const items = await toThreadItems(rows.slice(0, f.limit), viewer, now);
  return {
    items,
    page: f.page,
    limit: f.limit,
    total,
    hasMore: rows.length > f.limit,
    counts: Object.fromEntries(perCategory.map((c) => [c._id, c.n])),
    now: now.toISOString(),
  };
}

/** One thread and its replies, oldest first, or null when it doesn't exist or was deleted. */
export async function getThread(slug: string, viewer: Viewer | null): Promise<ThreadDetailData | null> {
  const now = new Date();
  if (!(await dbReady())) return null;
  const thread = await Thread.findOne({ slug, deletedAt: null }).lean();
  if (!thread) return null;
  const replies = await Reply.find({ threadId: thread._id, deletedAt: null }).sort({ createdAt: 1 }).limit(1000).lean();
  const [authorOf, threadVoted, replyVoted, titles] = await Promise.all([
    loadAuthors([thread.authorId, ...replies.map((r) => r.authorId)]),
    votedIds(viewer, 'thread', [thread._id]),
    votedIds(viewer, 'reply', replies.map((r) => r._id)),
    hackathonTitles([thread.hackathonSlug]),
  ]);
  return {
    thread: toThreadItem(
      thread,
      authorOf(thread.authorId),
      viewer,
      threadVoted.has(String(thread._id)),
      thread.hackathonSlug ? titles.get(thread.hackathonSlug) : undefined,
      now
    ),
    replies: replies.map((r) => toReplyItem(r, authorOf(r.authorId), viewer, replyVoted.has(String(r._id)))),
    now: now.toISOString(),
  };
}

/** Hot threads in the same category, for the sidebar on a thread page. */
export async function moreInCategory(thread: Pick<ThreadItem, 'id' | 'category'>, viewer: Viewer | null, limit = 5): Promise<ThreadItem[]> {
  const list = await listThreads({ category: thread.category, sort: 'hot', pinned: false, page: 1, limit: limit + 1 }, viewer);
  return list.items.filter((t) => t.id !== thread.id).slice(0, limit);
}

export interface NewThreadInput {
  title: string;
  body: string;
  category: CategoryId;
  tags: string[];
  city?: string;
  hackathonSlug?: string;
}

export async function createThread(viewer: Viewer, input: NewThreadInput): Promise<ThreadItem> {
  await assertCanPost(viewer.id);
  if (input.hackathonSlug && !(await Hackathon.exists({ slug: input.hackathonSlug }))) {
    throw badRequest('Pick a hackathon from the list.', { hackathonSlug: 'We couldn’t find that hackathon.' });
  }
  const doc = {
    title: input.title,
    body: input.body,
    category: input.category,
    tags: input.tags,
    city: input.city || undefined,
    hackathonSlug: input.hackathonSlug || undefined,
    authorId: viewer.id,
    lastActivityAt: new Date(),
  };
  let created;
  try {
    created = await Thread.create({ ...doc, slug: await uniqueSlug(Thread, input.title) });
  } catch (err) {
    // Two posts with the same title at the same moment: try once more with a fresh slug.
    if ((err as { code?: number }).code !== 11000) throw err;
    created = await Thread.create({ ...doc, slug: await uniqueSlug(Thread, `${input.title} ${Date.now().toString(36)}`) });
  }
  await logActivity(viewer.id, 'thread', input.title, `/community/${created.slug}`);
  const [item] = await toThreadItems([created.toObject()], viewer, new Date());
  return item;
}

export interface ThreadPatch {
  title?: string;
  body?: string;
  tags?: string[];
  pinned?: boolean;
}

/** Authors edit the title, body and tags in the first 24 hours; admins pin and unpin. */
export async function updateThread(slug: string, viewer: Viewer, patch: ThreadPatch): Promise<ThreadItem> {
  const thread = await Thread.findOne({ slug, deletedAt: null }).lean();
  if (!thread) throw notFound('That discussion');
  const now = new Date();
  const set: Record<string, unknown> = {};

  if (patch.pinned !== undefined) {
    if (!isAdmin(viewer)) throw forbidden('Only admins can pin discussions.');
    set.pinned = patch.pinned;
  }
  const edits = (['title', 'body', 'tags'] as const).filter((k) => patch[k] !== undefined);
  if (edits.length) {
    if (String(thread.authorId) !== viewer.id) throw forbidden('You can only edit your own discussions.');
    if (now.getTime() > canEditUntil(thread)) {
      throw new ApiError(403, 'edit_window_closed', `Discussions can only be edited in the first ${EDIT_WINDOW_HOURS} hours.`);
    }
    for (const k of edits) set[k] = patch[k];
    set.editedAt = now;
  }
  if (!Object.keys(set).length) throw badRequest('Nothing to change.');

  const updated = await Thread.findOneAndUpdate({ _id: thread._id }, { $set: set }, { new: true, runValidators: true }).lean();
  if (!updated) throw notFound('That discussion');
  const [item] = await toThreadItems([updated], viewer, now);
  return item;
}

/** Soft delete by the author or an admin. Replies stay in the database but are hidden with it. */
export async function deleteThread(slug: string, viewer: Viewer): Promise<void> {
  const thread = await Thread.findOne({ slug, deletedAt: null }).select('authorId').lean();
  if (!thread) throw notFound('That discussion');
  if (String(thread.authorId) !== viewer.id && !isAdmin(viewer)) throw forbidden('You can only delete your own discussions.');
  await Thread.updateOne({ _id: thread._id }, { $set: { deletedAt: new Date(), deletedBy: viewer.id } });
}

export async function addReply(slug: string, viewer: Viewer, body: string): Promise<ReplyItem> {
  const { name } = await assertCanPost(viewer.id);
  const thread = await Thread.findOne({ slug, deletedAt: null }).select('_id slug title authorId').lean();
  if (!thread) throw notFound('That discussion');

  const reply = await Reply.create({ threadId: thread._id, authorId: viewer.id, body });
  await Thread.updateOne({ _id: thread._id }, { $inc: { replyCount: 1 }, $set: { lastActivityAt: reply.createdAt } });

  const href = `/community/${thread.slug}#reply-${reply._id}`;
  await Promise.all([
    logActivity(viewer.id, 'reply', `Re: ${thread.title}`, href),
    String(thread.authorId) !== viewer.id
      ? notify(thread.authorId, 'reply', `${name} replied to “${thread.title}”`, excerpt(body, 200), href)
      : Promise.resolve(),
  ]);

  const authorOf = await loadAuthors([viewer.id]);
  return toReplyItem(reply.toObject(), authorOf(viewer.id), viewer, false);
}

/** Soft delete by the reply's author or an admin. */
export async function deleteReply(id: string, viewer: Viewer): Promise<{ threadSlug: string; replyCount: number }> {
  const reply = await Reply.findOne({ _id: id, deletedAt: null }).select('authorId threadId').lean();
  if (!reply) throw notFound('That reply');
  if (String(reply.authorId) !== viewer.id && !isAdmin(viewer)) throw forbidden('You can only delete your own replies.');
  // Only the request that actually flips deletedAt lowers the count, so double clicks can't.
  const res = await Reply.updateOne({ _id: reply._id, deletedAt: null }, { $set: { deletedAt: new Date(), deletedBy: viewer.id } });
  const thread = res.modifiedCount
    ? await Thread.findOneAndUpdate({ _id: reply.threadId, replyCount: { $gt: 0 } }, { $inc: { replyCount: -1 } }, { new: true }).select('slug replyCount').lean()
    : await Thread.findById(reply.threadId).select('slug replyCount').lean();
  return { threadSlug: thread?.slug ?? '', replyCount: thread?.replyCount ?? 0 };
}

/** Upvote, or take the upvote back. Returns the new count and whether the student has voted. */
export async function toggleVote(viewer: Viewer, targetType: 'thread' | 'reply', targetId: string): Promise<{ votes: number; voted: boolean }> {
  if (targetType === 'thread') {
    if (!(await Thread.exists({ _id: targetId, deletedAt: null }))) throw notFound('That discussion');
  } else {
    const reply = await Reply.findOne({ _id: targetId, deletedAt: null }).select('threadId').lean();
    // Replies in a deleted thread are hidden, so they can't be voted on either.
    if (!reply || !(await Thread.exists({ _id: reply.threadId, deletedAt: null }))) throw notFound('That reply');
  }

  const key = { userId: viewer.id, targetType, targetId };
  const removed = await Vote.deleteOne(key);
  let delta = removed.deletedCount ? -1 : 0;
  let voted = false;
  if (!removed.deletedCount) {
    try {
      await Vote.create(key);
      delta = 1;
      voted = true;
    } catch (err) {
      // Another click got there first: the vote exists, so leave the count alone.
      if ((err as { code?: number }).code !== 11000) throw err;
      voted = true;
    }
  }
  // Votes don't count as an edit, so updatedAt stays put.
  const filter = delta < 0 ? { _id: targetId, votes: { $gt: 0 } } : { _id: targetId };
  const update = { $inc: { votes: delta } };
  const opts = { new: true, timestamps: false } as const;
  const doc =
    targetType === 'thread'
      ? await (delta ? Thread.findOneAndUpdate(filter, update, opts) : Thread.findById(targetId)).select('votes').lean()
      : await (delta ? Reply.findOneAndUpdate(filter, update, opts) : Reply.findById(targetId)).select('votes').lean();
  return { votes: doc?.votes ?? 0, voted };
}
