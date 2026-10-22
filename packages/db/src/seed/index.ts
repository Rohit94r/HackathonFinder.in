import type { Model, Types } from 'mongoose';
import { createSampleHackathons, eventPoint } from '@hackathonfinder/shared';
import { connectDb } from '../connect';
import { ALL_MODELS } from '../models';
import { Hackathon } from '../models/Hackathon';
import { User } from '../models/User';
import { Reply, Thread } from '../models/community';
import { Win } from '../models/wins';
import { TeamPost } from '../models/teams';
import { PEOPLE } from './data/people';
import { THREADS } from './data/discussions';
import { WINS } from './data/wins';
import { sampleTeamPosts } from './data/teamPosts';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export interface SeedResult {
  skipped: boolean;
  users: number;
  hackathons: number;
  threads: number;
  replies: number;
  wins: number;
  teamPosts: number;
}

/** Creates every collection's indexes. Safe to run on every start; never drops anything. */
export async function ensureIndexes(): Promise<void> {
  await connectDb();
  await Promise.all(ALL_MODELS.map((m) => m.createIndexes()));
}

// Validates through Mongoose (defaults, enums) but inserts natively, so seeded
// createdAt dates stay in the past instead of being stamped with "now".
async function insertValidated<T>(model: Model<T>, items: Partial<T>[]): Promise<void> {
  if (!items.length) return;
  const docs = items.map((item) => new model(item));
  await Promise.all(docs.map((d) => d.validate()));
  await model.collection.insertMany(docs.map((d) => d.toObject({ depopulate: true })) as any[]);
}

/**
 * Loads the preview's sample students, hackathons, discussions, winning stories and
 * team posts. Skips if they're already there, unless `reset` (which only removes
 * sample content, never real students' data).
 */
export async function seedDatabase({ reset = false, now = new Date(), log = console.log } = {}): Promise<SeedResult> {
  await ensureIndexes();

  const existing = await User.find({ isSample: true }).select('_id').lean();
  if (existing.length && !reset) {
    log(`[seed] Sample data already loaded (${existing.length} sample students). Use --reset to reload it.`);
    return { skipped: true, users: 0, hackathons: 0, threads: 0, replies: 0, wins: 0, teamPosts: 0 };
  }

  if (reset) {
    const ids = existing.map((u) => u._id);
    const threadIds = (await Thread.find({ authorId: { $in: ids } }).select('_id').lean()).map((t) => t._id);
    await Promise.all([
      Reply.deleteMany({ $or: [{ threadId: { $in: threadIds } }, { authorId: { $in: ids } }] }),
      Thread.deleteMany({ _id: { $in: threadIds } }),
      Win.deleteMany({ authorId: { $in: ids } }),
      TeamPost.deleteMany({ authorId: { $in: ids } }),
      Hackathon.deleteMany({ flags: 'sample' }),
      User.deleteMany({ _id: { $in: ids } }),
    ]);
    log('[seed] Removed previous sample content.');
  }

  // Students
  const months = (n: number) => new Date(now.getTime() - n * 30 * DAY);
  await insertValidated(
    User,
    PEOPLE.map((p) => ({
      name: p.name,
      handle: p.handle,
      about: p.about,
      college: p.college,
      city: p.city,
      skills: p.skills,
      bio: p.bio,
      github: p.github ?? '',
      linkedin: p.linkedin ?? '',
      lookingForTeam: p.lookingForTeam,
      record: p.record.map((r) => ({ event: r.event, hackathonSlug: r.hackathonSlug, result: r.result, project: r.project, date: months(r.monthsAgo) })),
      isSample: true,
      onboarded: true,
      role: 'student' as const,
      joinedAt: months(p.joinedMonthsAgo),
      createdAt: months(p.joinedMonthsAgo),
      updatedAt: now,
    }))
  );
  const users = await User.find({ isSample: true }).select('_id handle').lean();
  const idOf = new Map<string, Types.ObjectId>(users.map((u) => [u.handle, u._id]));
  const author = (handle: string) => {
    const id = idOf.get(handle);
    if (!id) throw new Error(`[seed] Unknown sample author: ${handle}`);
    return id;
  };

  // Hackathons
  const samples = createSampleHackathons(now);
  await insertValidated(
    Hackathon,
    samples.map((h) => {
      const point = eventPoint(h);
      return {
        ...h,
        lat: undefined,
        lng: undefined,
        location: point ? { type: 'Point' as const, coordinates: [point.lng, point.lat] as [number, number] } : undefined,
        startDate: new Date(h.startDate),
        endDate: new Date(h.endDate),
        registrationDeadline: new Date(h.registrationDeadline),
        lastChecked: new Date(h.lastChecked),
        sourceRefs: h.sources.map((s) => ({ source: s, url: h.registrationUrl, externalId: h.slug, firstSeenAt: new Date(h.addedAt), lastSeenAt: now })),
        state: 'live' as const,
        confidence: 1,
        flags: ['sample'],
        createdAt: new Date(h.addedAt),
        updatedAt: now,
      };
    })
  );

  // Discussions
  let replies = 0;
  for (const t of THREADS) {
    const createdAt = new Date(now.getTime() - t.hoursAgo * HOUR);
    const replyDocs = t.replies.map((r) => ({
      authorId: author(r.authorHandle),
      body: r.body,
      votes: r.votes,
      createdAt: new Date(now.getTime() - r.hoursAgo * HOUR),
      updatedAt: new Date(now.getTime() - r.hoursAgo * HOUR),
    }));
    const lastActivityAt = new Date(Math.max(createdAt.getTime(), ...replyDocs.map((r) => r.createdAt.getTime())));
    const thread = new Thread({
      slug: t.id,
      title: t.title,
      body: t.body,
      category: t.category,
      tags: t.tags,
      city: t.city,
      hackathonSlug: t.hackathonSlug,
      authorId: author(t.authorHandle),
      votes: t.votes,
      replyCount: t.replies.length,
      pinned: Boolean(t.pinned),
      lastActivityAt,
      createdAt,
      updatedAt: lastActivityAt,
    });
    await thread.validate();
    await Thread.collection.insertOne(thread.toObject() as any);
    await insertValidated(Reply, replyDocs.map((r) => ({ ...r, threadId: thread._id })));
    replies += replyDocs.length;
  }

  // Winning stories
  await insertValidated(
    Win,
    WINS.map((w) => {
      const createdAt = new Date(now.getTime() - w.daysAgo * DAY);
      return {
        slug: w.id,
        authorId: author(w.authorHandle),
        hackathon: w.hackathon,
        hackathonSlug: w.hackathonSlug,
        city: w.city,
        result: w.result,
        prize: w.prize,
        projectName: w.projectName,
        tagline: w.tagline,
        themes: w.themes,
        techStack: w.techStack,
        team: w.team,
        sections: w.sections,
        links: w.links,
        cheers: w.cheers,
        createdAt,
        updatedAt: createdAt,
      };
    })
  );

  // Team posts
  await insertValidated(
    TeamPost,
    sampleTeamPosts.map((p) => {
      const createdAt = new Date(now.getTime() - p.postedDaysAgo * DAY);
      return {
        authorId: author(p.authorHandle),
        city: p.city,
        mode: p.mode,
        hackathonSlug: p.hackathonSlug,
        members: p.members,
        teamMax: p.teamMax,
        has: p.has,
        needs: p.needs,
        idea: p.idea,
        open: p.members < p.teamMax,
        createdAt,
        updatedAt: createdAt,
      };
    })
  );

  const result: SeedResult = {
    skipped: false,
    users: PEOPLE.length,
    hackathons: samples.length,
    threads: THREADS.length,
    replies,
    wins: WINS.length,
    teamPosts: sampleTeamPosts.length,
  };
  log(
    `[seed] Loaded ${result.users} students, ${result.hackathons} hackathons, ${result.threads} discussions (${result.replies} replies), ${result.wins} winning stories and ${result.teamPosts} team posts.`
  );
  return result;
}
