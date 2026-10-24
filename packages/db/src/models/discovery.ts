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
  /** Rules version that last processed it; older ones get their listing's derived fields rewritten. */
  pipelineVersion?: number;
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

export type RunItemAction = 'created' | 'updated' | 'merged' | 'review' | 'rejected' | 'error';

/** What a run did with one thing it found, so admins can see exactly what was added. */
export interface IRunItem {
  action: RunItemAction;
  /** Source slug (unstop, devfolio, instagram, …). */
  source: string;
  title: string;
  /** Where we found it. */
  url: string;
  slug?: string;
  hackathonId?: Types.ObjectId;
  imageUrl?: string;
  city?: string;
  mode?: string;
  /** Why it went to review or was rejected, or what changed. */
  reason?: string;
}

/** One run of an agent. A "scrape" run covers several sources in one go. */
export interface IAgentRun {
  _id: Types.ObjectId;
  agent: 'scrape' | 'scout' | 'pipeline' | 'verifier' | 'alerts' | 'digest';
  source?: string;
  /** Sources a scrape run covers. */
  sources: string[];
  status: RunStatus;
  trigger: 'schedule' | 'manual' | 'api';
  /** "2026-10-25T02:00+05:30" for scheduled runs, so one time slot never runs twice. */
  slot?: string;
  /** The admin who pressed "Scrape now". */
  startedBy?: Types.ObjectId;
  startedAt: Date;
  finishedAt?: Date;
  /** Last time a running run reported progress; a run silent for 30 minutes is taken as dead. */
  heartbeatAt?: Date;
  counts: { found: number; new: number; created: number; updated: number; merged: number; review: number; rejected: number; errors: number };
  /** Live progress for the admin dashboard. */
  progress: { done: number; total: number; current: string };
  /** What happened to each item (capped), newest last. */
  items: IRunItem[];
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
    pipelineVersion: Number,
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

const runItemSchema = new Schema<IRunItem>(
  {
    action: { type: String, enum: ['created', 'updated', 'merged', 'review', 'rejected', 'error'], required: true },
    source: { type: String, required: true },
    title: { type: String, default: '' },
    url: { type: String, default: '' },
    slug: String,
    hackathonId: { type: Schema.Types.ObjectId, ref: 'Hackathon' },
    imageUrl: String,
    city: String,
    mode: String,
    reason: String,
  },
  { _id: false }
);

const agentRunSchema = new Schema<IAgentRun>(
  {
    agent: { type: String, enum: ['scrape', 'scout', 'pipeline', 'verifier', 'alerts', 'digest'], required: true },
    source: String,
    sources: { type: [String], default: [] },
    status: { type: String, enum: ['queued', 'running', 'success', 'partial', 'failed', 'skipped'], default: 'running' },
    trigger: { type: String, enum: ['schedule', 'manual', 'api'], default: 'manual' },
    slot: String,
    startedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    startedAt: { type: Date, default: () => new Date() },
    finishedAt: Date,
    heartbeatAt: Date,
    counts: { type: Schema.Types.Mixed, default: () => ({ ...zeroCounts }) },
    progress: {
      done: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      current: { type: String, default: '' },
    },
    items: { type: [runItemSchema], default: [] },
    errorLog: { type: [String], default: [] },
    log: { type: [String], default: [] },
  },
  { minimize: false }
);
agentRunSchema.index({ startedAt: -1 });
agentRunSchema.index({ source: 1, startedAt: -1 });
agentRunSchema.index({ status: 1, startedAt: -1 });
agentRunSchema.index({ agent: 1, startedAt: -1 });
// One scheduled scrape per time slot, even with several servers or a cron and a timer both firing.
agentRunSchema.index({ slot: 1 }, { unique: true, partialFilterExpression: { slot: { $type: 'string' } } });
// At most one running run per agent, so two scrapes never overlap (the database decides, not a timer).
agentRunSchema.index({ agent: 1 }, { unique: true, partialFilterExpression: { status: 'running' }, name: 'one_running_per_agent' });

export const Source = defineModel<ISource>('Source', sourceSchema);
export const RawItem = defineModel<IRawItem>('RawItem', rawItemSchema);
export const AgentRun = defineModel<IAgentRun>('AgentRun', agentRunSchema);
export const EMPTY_RUN_COUNTS = zeroCounts;
