import 'server-only';
import type { NextRequest } from 'next/server';
import { z, type ZodType } from 'zod';
import { CITIES, THEMES, type ThemeSlug } from '@hackathonfinder/shared';
import { Cheer, connectDb, Hackathon, isDbConfigured, logActivity, uniqueSlug, User, Win, type IWin } from '@hackathonfinder/db';
import { RESULT_LABELS } from '@/data/people';
import type { Viewer } from '@/components/community/model';
import {
  HACKATHON_MAX,
  HACKATHON_MIN,
  MAX_TECH,
  MAX_TEAMMATES,
  MAX_THEMES,
  PRIZE_MAX,
  PROJECT_MAX,
  PROJECT_MIN,
  SECTION_MAX,
  SECTION_MIN,
  TAGLINE_MAX,
  TAGLINE_MIN,
  type WinItem,
  type WinList,
  type WinSort,
} from '@/components/wins/model';
import { badRequest, forbidden, notFound, readBody } from './api';
import { assertCanPost, citySchema, handleSchema, limitSchema, loadAuthors, optional, pageSchema, slugSchema } from './community';
import { assertRespectful } from './moderation';
import { readUpload, storeImage } from './storage';

type WinDoc = Omit<IWin, never>;
type Section = keyof WinDoc['sections'];

const SECTIONS: Section[] = ['problem', 'built', 'won', 'lessons'];
const RESULTS = ['winner', 'runner-up', 'finalist'] as const;
const THEME_SLUGS = THEMES.map((t) => t.slug) as [ThemeSlug, ...ThemeSlug[]];
const CITY_SLUGS = CITIES.map((c) => c.slug);

const iso = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString() : '');
const isAdmin = (viewer: Viewer | null | undefined) => viewer?.role === 'admin';

async function dbReady(): Promise<boolean> {
  if (!isDbConfigured()) return false;
  await connectDb();
  return true;
}

// ── Validation ─────────────────────────────────────────────────────────────

const httpUrl = z
  .string()
  .trim()
  .max(300, 'That link is too long.')
  .refine((v) => /^https?:\/\/[^\s/$.?#][^\s]*$/i.test(v), 'Paste the full link, starting with https://');

/** Keeps the first spelling of each item, ignoring case: ["Next.js", "next.js"] → ["Next.js"]. */
function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((i) => i && !seen.has(i.toLowerCase()) && seen.add(i.toLowerCase()));
}

/** Comma-list fields arrive as arrays: trimmed, blanks and repeats dropped. */
const listOf = (max: number, maxLength: number, what: string) =>
  z
    .array(z.string().trim().max(maxLength, `Keep each ${what} under ${maxLength} characters.`))
    .max(max * 2)
    .transform(dedupe)
    .refine((items) => items.length <= max, `Add up to ${max} ${what}s.`);

const section = z
  .string(`Write this part (at least ${SECTION_MIN} characters).`)
  .trim()
  .min(SECTION_MIN, `Write a little more (at least ${SECTION_MIN} characters).`)
  .max(SECTION_MAX, `Keep it under ${SECTION_MAX} characters.`);

const fields = {
  hackathon: z.string('Add the hackathon’s name.').trim().min(HACKATHON_MIN, 'Add the hackathon’s name.').max(HACKATHON_MAX),
  /** "" means it isn't one of our listings. */
  hackathonSlug: z.union([z.literal(''), slugSchema]),
  /** A city slug, or "online". */
  city: z
    .string('Pick the city, or Online.')
    .trim()
    .refine((v) => v === 'online' || CITY_SLUGS.includes(v), 'Pick the city, or Online.'),
  result: z.enum(RESULTS, 'Pick your result.'),
  prize: z.string().trim().max(PRIZE_MAX, `Keep the prize under ${PRIZE_MAX} characters.`),
  projectName: z.string('Add your project’s name.').trim().min(PROJECT_MIN, 'Add your project’s name.').max(PROJECT_MAX),
  tagline: z
    .string('Describe the project in one line.')
    .trim()
    .min(TAGLINE_MIN, `Describe the project in one line (at least ${TAGLINE_MIN} characters).`)
    .max(TAGLINE_MAX),
  themes: z
    .array(z.enum(THEME_SLUGS, 'Pick themes from the list.'), 'Pick at least one theme.')
    .min(1, 'Pick at least one theme.')
    .max(MAX_THEMES, `Pick up to ${MAX_THEMES} themes.`)
    .transform((t) => [...new Set(t)]),
  techStack: listOf(MAX_TECH, 40, 'tool'),
  /** Teammates besides the author; the author's name is added first. */
  team: listOf(MAX_TEAMMATES, 60, 'teammate'),
  sections: z.object({ problem: section, built: section, won: section, lessons: section }, 'Write the four parts of your story.'),
  links: z.object({ demo: optional(httpUrl), github: optional(httpUrl) }),
};

export const NewWinSchema = z.object({
  ...fields,
  hackathonSlug: fields.hackathonSlug.default(''),
  prize: fields.prize.default(''),
  techStack: fields.techStack.default([]),
  team: fields.team.default([]),
  links: fields.links.default({}),
  /** Also add the result to the student's hackathon record on their profile. */
  addToRecord: z.boolean().default(false),
});

// No defaults here: a missing field means "leave it as it is".
export const WinPatchSchema = z.object({
  ...z.object(fields).partial().shape,
  sections: fields.sections.partial().optional(),
  removeCover: z.boolean().optional(),
});

export const WinQuerySchema = z.object({
  result: optional(z.enum(RESULTS)),
  theme: optional(z.enum(THEME_SLUGS)),
  /** A city slug, or "online" for online events. */
  city: optional(z.union([z.literal('online'), citySchema])),
  author: optional(handleSchema),
  q: optional(z.string().trim().max(100)),
  sort: optional(z.enum(['newest', 'cheers'])),
  page: pageSchema,
  limit: limitSchema,
});

export type NewWinInput = z.output<typeof NewWinSchema>;
export type WinPatch = z.output<typeof WinPatchSchema>;

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/**
 * Reads a story from JSON, or from multipart form data with the details as JSON in
 * `data` and an optional `cover` image.
 */
export async function readWinRequest<T>(req: NextRequest, schema: ZodType<T>): Promise<{ body: T; cover: Buffer | null }> {
  if (!(req.headers.get('content-type') ?? '').includes('multipart/form-data')) {
    return { body: await readBody(req, schema), cover: null };
  }
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw badRequest('We couldn’t read that form. Please try again.');
  }
  let raw: unknown;
  try {
    const data = form.get('data');
    raw = JSON.parse(typeof data === 'string' ? data : '');
  } catch {
    throw badRequest('Send the story details as JSON in the “data” field.');
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw badRequest('Some details need fixing.', fieldErrors(parsed.error));
  return { body: parsed.data, cover: await readUpload(form, 'cover') };
}

// ── Reading ────────────────────────────────────────────────────────────────

function toWinItem(w: WinDoc, author: WinItem['author'], viewer: Viewer | null, cheered: boolean): WinItem {
  return {
    id: String(w._id),
    slug: w.slug,
    author,
    hackathon: w.hackathon,
    hackathonSlug: w.hackathonSlug || undefined,
    city: w.city || undefined,
    result: w.result,
    prize: w.prize ?? '',
    projectName: w.projectName,
    tagline: w.tagline ?? '',
    themes: w.themes ?? [],
    techStack: w.techStack ?? [],
    team: w.team ?? [],
    sections: {
      problem: w.sections?.problem ?? '',
      built: w.sections?.built ?? '',
      won: w.sections?.won ?? '',
      lessons: w.sections?.lessons ?? '',
    },
    links: { demo: w.links?.demo || undefined, github: w.links?.github || undefined },
    coverUrl: w.coverUrl || undefined,
    cheers: w.cheers ?? 0,
    cheered,
    mine: Boolean(viewer && String(w.authorId) === viewer.id),
    createdAt: iso(w.createdAt),
    updatedAt: iso(w.updatedAt),
  };
}

async function toWinItems(wins: WinDoc[], viewer: Viewer | null): Promise<WinItem[]> {
  const [authorOf, cheers] = await Promise.all([
    loadAuthors(wins.map((w) => w.authorId)),
    viewer && wins.length
      ? Cheer.find({ userId: viewer.id, winId: { $in: wins.map((w) => w._id) } }).select('winId').lean()
      : Promise.resolve([]),
  ]);
  const cheered = new Set(cheers.map((c) => String(c.winId)));
  return wins.map((w) => toWinItem(w, authorOf(w.authorId), viewer, cheered.has(String(w._id))));
}

export interface WinFilters {
  result?: WinDoc['result'];
  theme?: ThemeSlug;
  city?: string;
  author?: string;
  q?: string;
  /** Default newest. */
  sort?: WinSort;
  /** Default 1. */
  page?: number;
  /** Default 12. */
  limit?: number;
}

/** A page of winning stories, newest or most cheered first. Deleted stories never show. */
export async function listWins(filters: WinFilters, viewer: Viewer | null): Promise<WinList> {
  const f = { ...filters, sort: filters.sort ?? 'newest', page: filters.page ?? 1, limit: filters.limit ?? 12 };
  const now = new Date().toISOString();
  const empty: WinList = { items: [], page: f.page, limit: f.limit, total: 0, hasMore: false, now };
  if (!(await dbReady())) return empty;

  const filter: Record<string, unknown> = { deletedAt: null };
  if (f.q) filter.$text = { $search: f.q };
  if (f.result) filter.result = f.result;
  if (f.theme) filter.themes = f.theme;
  if (f.city) filter.city = f.city === 'online' ? { $in: [null, ''] } : f.city;
  if (f.author) {
    const author = await User.findOne({ handle: f.author.toLowerCase(), deletedAt: null }).select('_id').lean();
    if (!author) return empty;
    filter.authorId = author._id;
  }
  const order: Record<string, 1 | -1> = f.sort === 'cheers' ? { cheers: -1, createdAt: -1 } : { createdAt: -1 };
  const [rows, total] = await Promise.all([
    Win.find(filter).sort(order).skip((f.page - 1) * f.limit).limit(f.limit + 1).lean(),
    Win.countDocuments(filter),
  ]);
  return { items: await toWinItems(rows.slice(0, f.limit), viewer), page: f.page, limit: f.limit, total, hasMore: rows.length > f.limit, now };
}

/** The newest stories, e.g. for the blog page. */
export async function latestWins(limit: number, viewer: Viewer | null): Promise<WinList> {
  return listWins({ sort: 'newest', page: 1, limit }, viewer);
}

export async function getWin(slug: string, viewer: Viewer | null): Promise<{ win: WinItem; now: string } | null> {
  if (!(await dbReady())) return null;
  const doc = await Win.findOne({ slug, deletedAt: null }).lean();
  if (!doc) return null;
  const [win] = await toWinItems([doc], viewer);
  return { win, now: new Date().toISOString() };
}

/** Other stories, sharing a theme or the author first, then the newest. */
export async function moreWins(win: Pick<WinItem, 'id' | 'themes' | 'author'>, viewer: Viewer | null, limit = 3): Promise<WinItem[]> {
  if (!(await dbReady())) return [];
  const candidates = await Win.find({ deletedAt: null, _id: { $ne: win.id } }).sort({ createdAt: -1 }).limit(60).lean();
  const picked = candidates
    .map((w, i) => ({
      w,
      i,
      score: (w.themes ?? []).filter((t) => win.themes.includes(t)).length + (win.author.id && String(w.authorId) === win.author.id ? 2 : 0),
    }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, limit)
    .map(({ w }) => w);
  return toWinItems(picked, viewer);
}

// ── Writing ────────────────────────────────────────────────────────────────

/** Every piece of text in a story (or a story edit), for the bad-word filter. */
function storyText(w: Partial<Pick<NewWinInput, 'hackathon' | 'prize' | 'projectName' | 'tagline' | 'techStack' | 'team'>> & { sections?: Partial<NewWinInput['sections']> }): string[] {
  return [w.hackathon, w.prize, w.projectName, w.tagline, ...(w.techStack ?? []), ...(w.team ?? []), ...SECTIONS.map((s) => w.sections?.[s])].filter(
    (t): t is string => Boolean(t)
  );
}

/** The author's name first, then teammates (without repeating the author). */
function teamWith(authorName: string, teammates: string[]): string[] {
  const me = authorName.trim().toLowerCase();
  return [authorName, ...teammates.filter((n) => n.trim().toLowerCase() !== me)].slice(0, MAX_TEAMMATES + 1);
}

async function findListing(slug: string) {
  const listing = await Hackathon.findOne({ slug }).select('slug title endDate').lean();
  if (!listing) throw badRequest('Pick a hackathon from the list.', { hackathonSlug: 'We couldn’t find that hackathon.' });
  return listing;
}

export async function createWin(viewer: Viewer, input: NewWinInput, cover: Buffer | null, ip?: string): Promise<WinItem> {
  const { name } = await assertCanPost(viewer.id);
  await assertRespectful({ userId: viewer.id, kind: 'win', ip }, storyText(input));
  const listing = input.hackathonSlug ? await findListing(input.hackathonSlug) : null;
  // Checked and stored before anything is written, so a bad image fails the whole post.
  const coverUrl = cover ? (await storeImage(cover, 'covers')).url : undefined;

  const doc = {
    authorId: viewer.id,
    hackathon: input.hackathon,
    hackathonSlug: listing?.slug,
    city: input.city === 'online' ? undefined : input.city,
    result: input.result,
    prize: input.prize,
    projectName: input.projectName,
    tagline: input.tagline,
    themes: input.themes,
    techStack: input.techStack,
    team: teamWith(name, input.team),
    sections: input.sections,
    links: { demo: input.links.demo, github: input.links.github },
    coverUrl,
  };
  const base = `${input.projectName} ${input.hackathon}`;
  let created;
  try {
    created = await Win.create({ ...doc, slug: await uniqueSlug(Win, base) });
  } catch (err) {
    if ((err as { code?: number }).code !== 11000) throw err;
    created = await Win.create({ ...doc, slug: await uniqueSlug(Win, `${base} ${Date.now().toString(36)}`) });
  }

  if (input.addToRecord) {
    // The event's end date when it's over, otherwise today. Skipped if the record already has it.
    const ended = listing?.endDate && new Date(listing.endDate) < new Date() ? new Date(listing.endDate) : new Date();
    await User.updateOne(
      { _id: viewer.id, record: { $not: { $elemMatch: { event: input.hackathon, project: input.projectName } } } },
      { $push: { record: { event: input.hackathon, hackathonSlug: listing?.slug, result: input.result, project: input.projectName, date: ended } } },
      { runValidators: true }
    );
  }
  await logActivity(viewer.id, 'win', `${RESULT_LABELS[input.result]} at ${input.hackathon}: ${input.projectName}`, `/wins/${created.slug}`);
  const [item] = await toWinItems([created.toObject()], viewer);
  return item;
}

async function ownWin(slug: string, viewer: Viewer) {
  const win = await Win.findOne({ slug, deletedAt: null }).lean();
  if (!win) throw notFound('That story');
  if (String(win.authorId) !== viewer.id && !isAdmin(viewer)) throw forbidden('You can only change your own stories.');
  return win;
}

/** The author (or an admin) edits a story. The link stays the same. */
export async function updateWin(slug: string, viewer: Viewer, patch: WinPatch, cover: Buffer | null, ip?: string): Promise<WinItem> {
  const win = await ownWin(slug, viewer);
  await assertRespectful({ userId: viewer.id, kind: 'win', ip }, storyText(patch));
  const set: Record<string, unknown> = {};
  const unset: Record<string, ''> = {};

  for (const key of ['hackathon', 'result', 'prize', 'projectName', 'tagline', 'themes', 'techStack'] as const) {
    if (patch[key] !== undefined) set[key] = patch[key];
  }
  if (patch.city !== undefined) {
    if (patch.city === 'online') unset.city = '';
    else set.city = patch.city;
  }
  if (patch.hackathonSlug !== undefined) {
    if (patch.hackathonSlug === '') unset.hackathonSlug = '';
    else set.hackathonSlug = (await findListing(patch.hackathonSlug)).slug;
  }
  if (patch.team !== undefined) {
    const author = await User.findById(win.authorId).select('name').lean();
    set.team = teamWith(author?.name ?? win.team?.[0] ?? 'Student', patch.team);
  }
  for (const key of SECTIONS) {
    const value = patch.sections?.[key];
    if (value !== undefined) set[`sections.${key}`] = value;
  }
  if (patch.links !== undefined) set.links = { demo: patch.links.demo, github: patch.links.github };
  if (cover) set.coverUrl = (await storeImage(cover, 'covers')).url;
  else if (patch.removeCover) unset.coverUrl = '';
  if (!Object.keys(set).length && !Object.keys(unset).length) throw badRequest('Nothing to change.');

  const updated = await Win.findOneAndUpdate(
    { _id: win._id },
    { ...(Object.keys(set).length ? { $set: set } : {}), ...(Object.keys(unset).length ? { $unset: unset } : {}) },
    { new: true, runValidators: true }
  ).lean();
  if (!updated) throw notFound('That story');
  const [item] = await toWinItems([updated], viewer);
  return item;
}

/** Soft delete by the author or an admin. */
export async function deleteWin(slug: string, viewer: Viewer): Promise<void> {
  const win = await ownWin(slug, viewer);
  await Win.updateOne({ _id: win._id }, { $set: { deletedAt: new Date(), deletedBy: viewer.id } });
}

/** Cheer for a story, or take the cheer back. */
export async function toggleCheer(viewer: Viewer, slug: string): Promise<{ cheers: number; cheered: boolean }> {
  const win = await Win.findOne({ slug, deletedAt: null }).select('_id').lean();
  if (!win) throw notFound('That story');

  const key = { userId: viewer.id, winId: win._id };
  const removed = await Cheer.deleteOne(key);
  let delta = removed.deletedCount ? -1 : 0;
  let cheered = false;
  if (!removed.deletedCount) {
    try {
      await Cheer.create(key);
      delta = 1;
      cheered = true;
    } catch (err) {
      // A second click raced the first: the cheer is there, so the count already includes it.
      if ((err as { code?: number }).code !== 11000) throw err;
      cheered = true;
    }
  }
  const filter = delta < 0 ? { _id: win._id, cheers: { $gt: 0 } } : { _id: win._id };
  const doc = delta
    ? await Win.findOneAndUpdate(filter, { $inc: { cheers: delta } }, { new: true, timestamps: false }).select('cheers').lean()
    : await Win.findById(win._id).select('cheers').lean();
  return { cheers: doc?.cheers ?? 0, cheered };
}
