import { Schema, type Types } from 'mongoose';
import { defineModel } from './define';

export type TrackStatus = 'saved' | 'registered' | 'submitted' | 'done';
export type ActivityType = 'saved' | 'registered' | 'submitted' | 'done' | 'team-post' | 'thread' | 'reply' | 'win';

/** A hackathon in a student's "My hackathons" tracker. */
export interface ISavedEvent {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  hackathonSlug: string;
  status: TrackStatus;
  /** When to remind them before the deadline (days); empty means no reminder. */
  remindDaysBefore?: number | null;
  remindedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Things a student did; they feed the profile heatmap, streaks and badges. */
export interface IActivity {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: ActivityType;
  label: string;
  href?: string;
  at: Date;
}

export interface INotification {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type:
    | 'team-request'
    | 'request-accepted'
    | 'request-declined'
    | 'invite'
    | 'invite-accepted'
    | 'reply'
    | 'deadline'
    | 'listing-live'
    | 'system'
    /** A chat opened with another student. */
    | 'chat';
  title: string;
  body: string;
  href?: string;
  readAt?: Date | null;
  createdAt: Date;
}

const savedSchema = new Schema<ISavedEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hackathonSlug: { type: String, required: true },
    status: { type: String, enum: ['saved', 'registered', 'submitted', 'done'], default: 'saved' },
    remindDaysBefore: { type: Number, default: 2 },
    remindedAt: { type: Date, default: null },
  },
  { timestamps: true }
);
savedSchema.index({ userId: 1, hackathonSlug: 1 }, { unique: true });
savedSchema.index({ hackathonSlug: 1 });

const activitySchema = new Schema<IActivity>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['saved', 'registered', 'submitted', 'done', 'team-post', 'thread', 'reply', 'win'],
    required: true,
  },
  label: { type: String, required: true, maxlength: 200 },
  href: String,
  at: { type: Date, default: () => new Date() },
});
activitySchema.index({ userId: 1, at: -1 });

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['team-request', 'request-accepted', 'request-declined', 'invite', 'invite-accepted', 'reply', 'deadline', 'listing-live', 'system', 'chat'],
      required: true,
    },
    title: { type: String, required: true, maxlength: 160 },
    body: { type: String, default: '', maxlength: 500 },
    href: String,
    readAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });
// The notifications page lists read and unread together, newest first.
notificationSchema.index({ userId: 1, createdAt: -1 });

export const SavedEvent = defineModel<ISavedEvent>('SavedEvent', savedSchema);
export const Activity = defineModel<IActivity>('Activity', activitySchema);
export const Notification = defineModel<INotification>('Notification', notificationSchema);
