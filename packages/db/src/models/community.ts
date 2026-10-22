import { Schema, type Types } from 'mongoose';
import { defineModel } from './define';

export type CategoryId = 'general' | 'hackathon-qa' | 'team-up' | 'feedback' | 'resources' | 'city-talk';
export const CATEGORY_IDS: CategoryId[] = ['general', 'hackathon-qa', 'team-up', 'feedback', 'resources', 'city-talk'];

export interface IThread {
  _id: Types.ObjectId;
  /** Readable id used in URLs (/community/[slug]). */
  slug: string;
  title: string;
  /** Plain text; paragraphs separated by a blank line. */
  body: string;
  category: CategoryId;
  tags: string[];
  city?: string;
  hackathonSlug?: string;
  authorId: Types.ObjectId;
  votes: number;
  replyCount: number;
  pinned: boolean;
  lastActivityAt: Date;
  /** Set when the author edits the title, body or tags. */
  editedAt?: Date | null;
  deletedAt?: Date | null;
  /** Who removed it: the author, or an admin moderating. */
  deletedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReply {
  _id: Types.ObjectId;
  threadId: Types.ObjectId;
  authorId: Types.ObjectId;
  body: string;
  votes: number;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

/** One upvote per student per thread or reply. */
export interface IVote {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  targetType: 'thread' | 'reply';
  targetId: Types.ObjectId;
  createdAt: Date;
}

const threadSchema = new Schema<IThread>(
  {
    slug: { type: String, required: true },
    title: { type: String, required: true, trim: true, minlength: 8, maxlength: 140 },
    body: { type: String, required: true, trim: true, minlength: 20, maxlength: 5000 },
    category: { type: String, enum: CATEGORY_IDS, required: true },
    tags: { type: [String], default: [] },
    city: { type: String, trim: true },
    hackathonSlug: { type: String, trim: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    votes: { type: Number, default: 0 },
    replyCount: { type: Number, default: 0 },
    pinned: { type: Boolean, default: false },
    lastActivityAt: { type: Date, default: () => new Date() },
    editedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);
threadSchema.index({ slug: 1 }, { unique: true });
threadSchema.index({ deletedAt: 1, pinned: -1, lastActivityAt: -1 });
threadSchema.index({ category: 1, createdAt: -1 });
threadSchema.index({ city: 1 });
threadSchema.index({ hackathonSlug: 1 });
threadSchema.index({ authorId: 1, createdAt: -1 });
threadSchema.index({ title: 'text', body: 'text', tags: 'text' }, { name: 'thread_text' });

const replySchema = new Schema<IReply>(
  {
    threadId: { type: Schema.Types.ObjectId, ref: 'Thread', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true, minlength: 2, maxlength: 3000 },
    votes: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);
replySchema.index({ threadId: 1, createdAt: 1 });
replySchema.index({ authorId: 1, createdAt: -1 });

const voteSchema = new Schema<IVote>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['thread', 'reply'], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
voteSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });

export const Thread = defineModel<IThread>('Thread', threadSchema);
export const Reply = defineModel<IReply>('Reply', replySchema);
export const Vote = defineModel<IVote>('Vote', voteSchema);
