import type { Types } from 'mongoose';
import mongoose from 'mongoose';
import { connectDb } from '../connect';
import { ALL_MODELS } from '../models';
import { User } from '../models/User';
import { Conversation, Message } from '../models/chat';
import { Reply, Thread, Vote } from '../models/community';
import { Activity, Notification, SavedEvent } from '../models/student';
import { Cheer, Win } from '../models/wins';
import { Invite, TeamPost, TeamRequest } from '../models/teams';

export interface SetupResult {
  /** Collections that didn't exist yet and were created. */
  created: string[];
  /** Sample students removed, with everything tied to them. */
  removedSamples: number;
}

/** Creates every collection's indexes. Safe to run on every start; never drops anything. */
export async function ensureIndexes(): Promise<void> {
  await connectDb();
  await Promise.all(ALL_MODELS.map((m) => m.createIndexes()));
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
 * Prepares a database for production: creates every collection and its indexes, and
 * removes any sample students left over from older previews (with their discussions,
 * stories and team posts). Never touches real students' data. Safe to run any time.
 */
export async function setupDatabase({ log = console.log }: { log?: (msg: string) => void } = {}): Promise<SetupResult> {
  await connectDb();
  const db = mongoose.connection.db!;
  const existing = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name));
  const created: string[] = [];
  for (const model of ALL_MODELS) {
    if (!existing.has(model.collection.collectionName)) {
      await model.createCollection();
      created.push(model.collection.collectionName);
    }
  }
  await ensureIndexes();

  const samples = await User.find({ isSample: true }).select('_id').lean();
  await removeSampleContent(samples.map((u) => u._id));

  log(
    `[db] ${ALL_MODELS.length} collections ready${created.length ? ` (created ${created.join(', ')})` : ''}, indexes in place` +
      (samples.length ? `, removed ${samples.length} sample students and their content.` : '. No sample data.')
  );
  return { created, removedSamples: samples.length };
}
