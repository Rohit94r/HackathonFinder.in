import { Schema, type Types } from 'mongoose';
import { defineModel } from './define';

export type Role = 'student' | 'organizer' | 'admin';
export type ResultKind = 'winner' | 'runner-up' | 'finalist' | 'participant';

/** One hackathon a student took part in, shown on their profile. */
export interface IRecord {
  _id?: Types.ObjectId;
  event: string;
  hackathonSlug?: string;
  result: ResultKind;
  project: string;
  date: Date;
}

export interface IUser {
  _id: Types.ObjectId;
  email?: string;
  emailVerified?: Date | null;
  /** bcrypt hash; never selected unless asked for. */
  passwordHash?: string;
  /** Sessions signed in before this are ended (set on password change and reset). */
  passwordChangedAt?: Date | null;
  name: string;
  /** URL name, unique, used at /u/[handle]. */
  handle: string;
  image?: string;
  about?: string;
  college?: string;
  /** City slug from CITIES. */
  city?: string;
  skills: string[];
  bio?: string;
  github?: string;
  linkedin?: string;
  lookingForTeam: boolean;
  /** City slugs the student follows: their city shortlist. */
  followedCities: string[];
  record: IRecord[];
  role: Role;
  /** OAuth accounts linked to this user. */
  providers: { provider: string; providerAccountId: string }[];
  /** Seeded sample students; they can't sign in. */
  isSample: boolean;
  /** Set once the student finishes onboarding. */
  onboarded: boolean;
  /** What the student wants emailed to them. */
  prefs: { reminders: boolean; digest: boolean; teamEmails: boolean };
  joinedAt: Date;
  lastLoginAt?: Date;
  banned?: boolean;
  /** Set when the student deletes their account; personal fields are cleared. */
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const recordSchema = new Schema<IRecord>({
  event: { type: String, required: true, trim: true, maxlength: 120 },
  hackathonSlug: { type: String, trim: true },
  result: { type: String, enum: ['winner', 'runner-up', 'finalist', 'participant'], required: true },
  project: { type: String, trim: true, maxlength: 120, default: '' },
  date: { type: Date, required: true },
});

const userSchema = new Schema<IUser>(
  {
    email: { type: String, lowercase: true, trim: true },
    emailVerified: { type: Date, default: null },
    passwordHash: { type: String, select: false },
    passwordChangedAt: { type: Date, default: null },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    handle: { type: String, required: true, lowercase: true, trim: true, match: /^[a-z0-9](?:[a-z0-9-]{0,28}[a-z0-9])?$/ },
    image: { type: String, trim: true },
    about: { type: String, trim: true, maxlength: 80, default: '' },
    college: { type: String, trim: true, maxlength: 120, default: '' },
    city: { type: String, trim: true, default: '' },
    skills: { type: [String], default: [] },
    bio: { type: String, trim: true, maxlength: 280, default: '' },
    github: { type: String, trim: true, default: '' },
    linkedin: { type: String, trim: true, default: '' },
    lookingForTeam: { type: Boolean, default: false },
    followedCities: { type: [String], default: [] },
    record: { type: [recordSchema], default: [] },
    role: { type: String, enum: ['student', 'organizer', 'admin'], default: 'student' },
    providers: {
      type: [{ _id: false, provider: { type: String, required: true }, providerAccountId: { type: String, required: true } }],
      default: [],
    },
    isSample: { type: Boolean, default: false },
    onboarded: { type: Boolean, default: false },
    prefs: {
      reminders: { type: Boolean, default: true },
      digest: { type: Boolean, default: true },
      teamEmails: { type: Boolean, default: true },
    },
    joinedAt: { type: Date, default: () => new Date() },
    lastLoginAt: Date,
    banned: Boolean,
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Sample students have no email, so uniqueness only applies where one exists.
userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } });
userSchema.index({ handle: 1 }, { unique: true });
userSchema.index({ 'providers.provider': 1, 'providers.providerAccountId': 1 });
userSchema.index({ city: 1, lookingForTeam: 1 });

export const User = defineModel<IUser>('User', userSchema);
