import { Schema, type Types } from 'mongoose';
import { defineModel } from './define';

export type RawItemStatus = 'new' | 'extracted' | 'published' | 'merged' | 'review' | 'rejected' | 'error' | 'skipped';
/** queued: asked for from the admin dashboard; the agents scheduler picks it up. */
export type RunStatus = 'queued' | 'running' | 'success' | 'partial' | 'failed' | 'skipped';

/** A place the Scout checks, with its schedule and health. */
export interface ISource {
  _id: Types.ObjectId;
  /** Connector id, e.g. "devpost", "unstop", "google-cse", or "watch:<host>" for watched pages. */
  slug: string;
  name: string;
  /** Matches SourceKind in @hackathonfinder/shared. */
  kind: 'platform' | 'search' | 'social' | 'events' | 'college' | 'community' | 'people';
  enabled: boolean;
  /** Cron expression in IST. */
  schedule: string;
  /** Extra settings for the connector, e.g. queries, hashtags, URLs to watch. */
  config: Record<string, unknown>;
  lastRunAt?: Date;
  lastSuccessAt?: Date;
  lastError?: string;
  lastItemCount?: number;
  consecutiveFailures: number;
  /** ok: last run worked. degraded: some errors. failing: several runs in a row failed. blocked: robots.txt or terms. */
  health: 'ok' | 'degraded' | 'failing' | 'blocked' | 'unknown';
  createdAt: Date;
  updatedAt: Date;
}

/** Anything the Scout found, kept so the pipeline can re-run and so we can show where a listing came from. */
export interface IRawItem {
  _id: Types.ObjectId;
  source: string;
  externalId?: string;
  url: string;
  title?: string;
  /** Plain text of the page, post caption or message. */
  text?: string;
  /** Structured fields the connector could read directly (dates, prizes, …). */
  data: Record<string, unknown>;
  imageUrls: string[];
  /** Hash of the content, so unchanged items are skipped. */
  contentHash: string;
  status: RawItemStatus;
  hackathonId?: Types.ObjectId;
  error?: string;
  /** Extractor confidence and the reasons behind it. */
  confidence?: number;
  notes: string[];
  fetchedAt: Date;
  /** Last time the Scout saw this item at its source (unchanged items only touch this). */
  lastSeenAt?: Date;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** One run of an agent over a source. */
export interface IAgentRun {
  _id: Types.ObjectId;
  agent: 'scout' | 'pipeline' | 'verifier' | 'alerts' | 'digest';
  source?: string;
  status: RunStatus;
  trigger: 'schedule' | 'manual' | 'api';
  startedAt: Date;
  finishedAt?: Date;
  counts: { found: number; new: number; created: number; updated: number; merged: number; review: number; rejected: number; errors: number };
  /** Error messages from the run ("errors" is reserved by Mongoose). */
  errorLog: string[];
  log: string[];
}

const sourceSchema = new Schema<ISource>(
  {
    slug: { type: String, required: true },
    name: { type: String, required: true },
    kind: { type: String, enum: ['platform', 'search', 'social', 'events', 'college', 'community', 'people'], required: true },
    enabled: { type: Boolean, default: true },
    schedule: { type: String, default: '0 */6 * * *' },
    config: { type: Schema.Types.Mixed, default: {} },
    lastRunAt: Date,
    lastSuccessAt: Date,
    lastError: String,
    lastItemCount: Number,
    consecutiveFailures: { type: Number, default: 0 },
    health: { type: String, enum: ['ok', 'degraded', 'failing', 'blocked', 'unknown'], default: 'unknown' },
  },
  { timestamps: true, minimize: false }
);
sourceSchema.index({ slug: 1 }, { unique: true });

const rawItemSchema = new Schema<IRawItem>(
  {
    source: { type: String, required: true },
    externalId: String,
    url: { type: String, required: true },
    title: String,
    text: { type: String, maxlength: 60_000 },
    data: { type: Schema.Types.Mixed, default: {} },
    imageUrls: { type: [String], default: [] },
    contentHash: { type: String, required: true },
    status: {
      type: String,
      enum: ['new', 'extracted', 'published', 'merged', 'review', 'rejected', 'error', 'skipped'],
      default: 'new',
    },
    hackathonId: { type: Schema.Types.ObjectId, ref: 'Hackathon' },
    error: String,
    confidence: Number,
    notes: { type: [String], default: [] },
    fetchedAt: { type: Date, default: () => new Date() },
    lastSeenAt: Date,
    processedAt: Date,
  },
  { timestamps: true, minimize: false }
);
rawItemSchema.index({ source: 1, url: 1 }, { unique: true });
rawItemSchema.index({ status: 1, createdAt: 1 });
rawItemSchema.index({ hackathonId: 1 });

const zeroCounts = { found: 0, new: 0, created: 0, updated: 0, merged: 0, review: 0, rejected: 0, errors: 0 };

const agentRunSchema = new Schema<IAgentRun>({
  agent: { type: String, enum: ['scout', 'pipeline', 'verifier', 'alerts', 'digest'], required: true },
  source: String,
  status: { type: String, enum: ['queued', 'running', 'success', 'partial', 'failed', 'skipped'], default: 'running' },
  trigger: { type: String, enum: ['schedule', 'manual', 'api'], default: 'manual' },
  startedAt: { type: Date, default: () => new Date() },
  finishedAt: Date,
  counts: { type: Schema.Types.Mixed, default: () => ({ ...zeroCounts }) },
  errorLog: { type: [String], default: [] },
  log: { type: [String], default: [] },
});
agentRunSchema.index({ startedAt: -1 });
agentRunSchema.index({ source: 1, startedAt: -1 });
agentRunSchema.index({ status: 1, startedAt: -1 });

export const Source = defineModel<ISource>('Source', sourceSchema);
export const RawItem = defineModel<IRawItem>('RawItem', rawItemSchema);
export const AgentRun = defineModel<IAgentRun>('AgentRun', agentRunSchema);
export const EMPTY_RUN_COUNTS = zeroCounts;
