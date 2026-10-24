import { Schema, type Types } from 'mongoose';
import { defineModel } from './define';

export type TeamMode = 'in-person' | 'online' | 'either';
export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn';

export interface ITeamPost {
  _id: Types.ObjectId;
  authorId: Types.ObjectId;
  /** City slug from CITIES, or 'online' for teams with no home city. */
  city: string;
  mode: TeamMode;
  /** The listing the team is for; empty when they're open to any hackathon. */
  hackathonSlug: string;
  /** The listing's title when the post was made, so the post still reads right if the listing goes away. */
  hackathonTitle?: string;
  /** Current team size, including the author. */
  members: number;
  teamMax: number;
  has: string[];
  needs: string[];
  idea: string;
  /** Closed once the team is full or the author closes it. */
  open: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** A student asking to join a team post. */
export interface ITeamRequest {
  _id: Types.ObjectId;
  postId: Types.ObjectId;
  fromUserId: Types.ObjectId;
  /** Copied from the post so "requests to my teams" is one query. */
  toUserId: Types.ObjectId;
  message: string;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

/** A student inviting another student to their team. */
export interface IInvite {
  _id: Types.ObjectId;
  fromUserId: Types.ObjectId;
  toUserId: Types.ObjectId;
  postId?: Types.ObjectId;
  message: string;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

const teamPostSchema = new Schema<ITeamPost>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    city: { type: String, required: true, trim: true },
    mode: { type: String, enum: ['in-person', 'online', 'either'], required: true },
    hackathonSlug: { type: String, trim: true, default: '' },
    hackathonTitle: { type: String, trim: true, maxlength: 200 },
    members: { type: Number, min: 1, max: 20, default: 1 },
    teamMax: { type: Number, min: 1, max: 20, default: 4 },
    has: { type: [String], default: [] },
    needs: { type: [String], default: [] },
    idea: { type: String, required: true, trim: true, minlength: 20, maxlength: 500 },
    open: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);
teamPostSchema.index({ deletedAt: 1, open: 1, createdAt: -1 });
teamPostSchema.index({ hackathonSlug: 1 });
teamPostSchema.index({ city: 1 });
teamPostSchema.index({ authorId: 1 });

const requestSchema = new Schema<ITeamRequest>(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'TeamPost', required: true },
    fromUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    toUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, trim: true, maxlength: 500, default: '' },
    status: { type: String, enum: ['pending', 'accepted', 'declined', 'withdrawn'], default: 'pending' },
  },
  { timestamps: true }
);
requestSchema.index({ postId: 1, fromUserId: 1 }, { unique: true });
requestSchema.index({ toUserId: 1, status: 1, createdAt: -1 });
requestSchema.index({ fromUserId: 1, createdAt: -1 });

const inviteSchema = new Schema<IInvite>(
  {
    fromUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    toUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    postId: { type: Schema.Types.ObjectId, ref: 'TeamPost' },
    message: { type: String, trim: true, maxlength: 500, default: '' },
    status: { type: String, enum: ['pending', 'accepted', 'declined', 'withdrawn'], default: 'pending' },
  },
  { timestamps: true }
);
inviteSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });
inviteSchema.index({ toUserId: 1, status: 1, createdAt: -1 });

export const TeamPost = defineModel<ITeamPost>('TeamPost', teamPostSchema);
export const TeamRequest = defineModel<ITeamRequest>('TeamRequest', requestSchema);
export const Invite = defineModel<IInvite>('Invite', inviteSchema);
