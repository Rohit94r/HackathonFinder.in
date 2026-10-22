import { deleteModel, models, Schema, type Types } from 'mongoose';
import { defineModel } from './define';

export type SubmissionKind = 'quick' | 'organizer' | 'extension';
export type SubmissionStatus = 'pending' | 'processing' | 'approved' | 'merged' | 'rejected';

/** A hackathon sent to us by a student, an organizer or the browser extension. */
export interface ISubmission {
  _id: Types.ObjectId;
  kind: SubmissionKind;
  userId?: Types.ObjectId;
  email?: string;
  /** Where the student saw it: instagram, whatsapp, facebook, linkedin, website, other. */
  seenOn?: string;
  url?: string;
  /** Page or post title (browser extension, organizer form). */
  title?: string;
  /** Pasted post, forwarded message or page text. */
  message?: string;
  posterUrl?: string;
  /** Images on the page the extension read (post image, og:image). Linked, not copied. */
  imageUrls: string[];
  /** Fields typed into the organizer form. */
  fields: Record<string, unknown>;
  /** What the Extractor read from the link, message or poster. */
  extracted?: Record<string, unknown> | null;
  status: SubmissionStatus;
  hackathonId?: Types.ObjectId;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  reviewNote?: string;
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** "Report this listing": wrong details, scam, expired, duplicate. */
export interface IReport {
  _id: Types.ObjectId;
  hackathonSlug: string;
  userId?: Types.ObjectId;
  reason: 'wrong-details' | 'scam' | 'expired' | 'duplicate' | 'broken-link' | 'other';
  details: string;
  status: 'open' | 'resolved' | 'dismissed';
  resolvedBy?: Types.ObjectId;
  resolvedAt?: Date;
  /** What the admin did about it. */
  resolutionNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDigestSubscriber {
  _id: Types.ObjectId;
  email: string;
  userId?: Types.ObjectId;
  cities: string[];
  themes: string[];
  /** Random token for one-click unsubscribe links. */
  token: string;
  confirmedAt?: Date | null;
  unsubscribedAt?: Date | null;
  lastSentAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** One-time tokens for email verification and password reset. Only the hash is stored. */
export interface IAuthToken {
  _id: Types.ObjectId;
  type: 'verify-email' | 'reset-password';
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date | null;
  createdAt: Date;
}

const submissionSchema = new Schema<ISubmission>(
  {
    kind: { type: String, enum: ['quick', 'organizer', 'extension'], required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    email: { type: String, lowercase: true, trim: true },
    seenOn: String,
    url: { type: String, trim: true },
    title: { type: String, trim: true, maxlength: 300 },
    message: { type: String, maxlength: 5000 },
    posterUrl: String,
    imageUrls: { type: [String], default: [] },
    fields: { type: Schema.Types.Mixed, default: {} },
    extracted: { type: Schema.Types.Mixed, default: null },
    status: { type: String, enum: ['pending', 'processing', 'approved', 'merged', 'rejected'], default: 'pending' },
    hackathonId: { type: Schema.Types.ObjectId, ref: 'Hackathon' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    reviewNote: String,
    ip: String,
  },
  { timestamps: true, minimize: false }
);
submissionSchema.index({ status: 1, createdAt: -1 });
submissionSchema.index({ userId: 1, createdAt: -1 });
// Duplicate check: the same link shared again within a day.
submissionSchema.index({ url: 1, createdAt: -1 });

const reportSchema = new Schema<IReport>(
  {
    hackathonSlug: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, enum: ['wrong-details', 'scam', 'expired', 'duplicate', 'broken-link', 'other'], required: true },
    details: { type: String, trim: true, maxlength: 1000, default: '' },
    status: { type: String, enum: ['open', 'resolved', 'dismissed'], default: 'open' },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date,
    resolutionNote: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ hackathonSlug: 1 });

const digestSchema = new Schema<IDigestSubscriber>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    cities: { type: [String], default: [] },
    themes: { type: [String], default: [] },
    token: { type: String, required: true },
    confirmedAt: { type: Date, default: null },
    unsubscribedAt: { type: Date, default: null },
    lastSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);
digestSchema.index({ email: 1 }, { unique: true });
digestSchema.index({ token: 1 }, { unique: true });

const authTokenSchema = new Schema<IAuthToken>(
  {
    type: { type: String, enum: ['verify-email', 'reset-password'], required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
authTokenSchema.index({ tokenHash: 1 }, { unique: true });
// MongoDB deletes expired tokens on its own.
authTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * In development a reloaded module can find the model still registered with an older
 * schema, which silently drops new fields. Re-register only when fields were added.
 */
function withNewFields<T>(name: string, schema: Schema<T>) {
  const existing = models[name];
  if (existing && Object.keys(schema.paths).some((p) => !existing.schema.path(p))) deleteModel(name);
  return defineModel<T>(name, schema);
}

export const Submission = withNewFields<ISubmission>('Submission', submissionSchema);
export const Report = withNewFields<IReport>('Report', reportSchema);
export const DigestSubscriber = defineModel<IDigestSubscriber>('DigestSubscriber', digestSchema);
export const AuthToken = defineModel<IAuthToken>('AuthToken', authTokenSchema);
