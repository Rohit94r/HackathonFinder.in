import type { Model, Types } from 'mongoose';
import { connectDb } from '../connect';
import { ALL_MODELS } from '../models';
import { User } from '../models/User';
import { Conversation, Message } from '../models/chat';
import { Reply, Thread, Vote } from '../models/community';
import { Activity, Notification, SavedEvent } from '../models/student';
import { Cheer, Win } from '../models/wins';
import { Invite, TeamPost, TeamRequest } from '../models/teams';
import { PEOPLE } from './data/people';
import { THREADS } from './data/discussions';
import { WINS } from './data/wins';
import { sampleTeamPosts } from './data/teamPosts';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export interface SeedResult {
  skipped: boolean;
  users: number;
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
 * Deletes sample students and everything tied to them: discussions and replies (with
 * their votes), stories (with cheers), team posts, requests, invites, chats,
 * notifications, activity and saved events. Only ever deletes users marked isSample.
 */
export async function removeSampleContent(ids: Types.ObjectId[]): Promise<void> {
  if (!ids.length) return;
  const threadIds = (await Thread.find({ authorId: { $in: ids } }).select('_id').lean()).map((t) => t._id);
  const replyIds = (await Reply.find({ $or: [{ threadId: { $in: threadIds } }, { authorId: { $in: ids } }] }).select('_id').lean()).map((r) => r._id);
  const winIds = (await Win.find({ authorId: { $in: ids } }).select('_id').lean()).map((w) => w._id);
  const postIds = (await TeamPost.find({ authorId: { $in: ids } }).select('_id').lean()).map((p) => p._id);
  const convIds = (await Conversation.find({ members: { $in: ids } }).select('_id').lean()).map((c) => c._id);
  await Promise.all([
    Vote.deleteMany({ $or: [{ userId: { $in: ids } }, { targetId: { $in: [...threadIds, ...replyIds] } }] }),
    Cheer.deleteMany({ $or: [{ userId: { $in: ids } }, { winId: { $in: winIds } }] }),
    Reply.deleteMany({ _id: { $in: replyIds } }),
    Thread.deleteMany({ _id: { $in: threadIds } }),
    Win.deleteMany({ _id: { $in: winIds } }),
    TeamRequest.deleteMany({ $or: [{ postId: { $in: postIds } }, { fromUserId: { $in: ids } }, { toUserId: { $in: ids } }] }),
    Invite.deleteMany({ $or: [{ postId: { $in: postIds } }, { fromUserId: { $in: ids } }, { toUserId: { $in: ids } }] }),
    TeamPost.deleteMany({ _id: { $in: postIds } }),
    Message.deleteMany({ conversationId: { $in: convIds } }),
    Conversation.deleteMany({ _id: { $in: convIds } }),
    Notification.deleteMany({ userId: { $in: ids } }),
    Activity.deleteMany({ userId: { $in: ids } }),
    SavedEvent.deleteMany({ userId: { $in: ids } }),
  ]);
  await User.deleteMany({ _id: { $in: ids }, isSample: true });
}

/**
 * Loads the preview's four sample students with their discussions, winning stories and
 * team posts. Hackathons are not seeded: listings come from the discovery agents and
 * student submissions. Skips if the samples are already there, unless `reset` (which
 * only removes sample content, never real students' data).
 */
export async function seedDatabase({ reset = false, now = new Date(), log = console.log } = {}): Promise<SeedResult> {
  await ensureIndexes();

  const existing = await User.find({ isSample: true }).select('_id').lean();
  if (existing.length && !reset) {
    log(`[seed] Sample data already loaded (${existing.length} sample students). Use --reset to reload it.`);
    return { skipped: true, users: 0, threads: 0, replies: 0, wins: 0, teamPosts: 0 };
  }

  if (reset) {
    await removeSampleContent(existing.map((u) => u._id));
    log('[seed] Removed previous sample content.');
  }
  return loadSampleContent(now, log);
}

/** Inserts the sample students and their content. Expects none of it to be there yet. */
export async function loadSampleContent(now = new Date(), log: (msg: string) => void = console.log): Promise<SeedResult> {
  // Students
  const months = (n: number) => new Date(now.getTime() - n * 30 * DAY);
  await insertValidated(
    User,
    PEOPLE.map((p) => ({
      name: p.name,
      handle: p.handle,
      image: p.image,
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
    threads: THREADS.length,
    replies,
    wins: WINS.length,
    teamPosts: sampleTeamPosts.length,
  };
  log(
    `[seed] Loaded ${result.users} sample students, ${result.threads} discussions (${result.replies} replies), ${result.wins} winning stories and ${result.teamPosts} team posts.`
  );
  return result;
}
