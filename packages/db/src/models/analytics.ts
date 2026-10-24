import { Schema, type Types } from 'mongoose';
import { defineModel } from './define';

export type Device = 'mobile' | 'tablet' | 'desktop';

/**
 * One page view on the public site. Visitors are counted with a random first-party id,
 * never an IP address or fingerprint. Rows expire after about 13 months.
 */
export interface IPageView {
  _id: Types.ObjectId;
  /** Random id kept in a first-party cookie. */
  visitorId: string;
  /** Random id that ends after 30 minutes without a page view. */
  sessionId: string;
  userId?: Types.ObjectId;
  /** Path without the query string, e.g. /hackathons/devfest-pune. */
  path: string;
  /** Set on hackathon pages (/hackathons/<slug>), for per-listing views and funnels. */
  hackathonSlug?: string;
  /** Host of the page the visitor came from, or empty for direct visits. */
  referrerHost: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  device: Device;
  browser: string;
  os: string;
  /** From the host's geo headers when it sends them (ISO country code). */
  country?: string;
  region?: string;
  city?: string;
  /** Time on the page, sent when the visitor leaves it. */
  durationMs?: number;
  createdAt: Date;
}

export type AnalyticsEventType = 'impression' | 'click' | 'register' | 'search' | 'share' | 'signup' | 'login';

/** Something a visitor did besides opening a page: a hackathon card shown, a register click, a search. */
export interface IAnalyticsEvent {
  _id: Types.ObjectId;
  type: AnalyticsEventType;
  visitorId?: string;
  sessionId?: string;
  userId?: Types.ObjectId;
  /** What it was about, e.g. a hackathon slug or the search text. */
  target: string;
  path?: string;
  meta: Record<string, unknown>;
  createdAt: Date;
}

const RETENTION_SECONDS = 400 * 24 * 60 * 60;

const pageViewSchema = new Schema<IPageView>(
  {
    visitorId: { type: String, required: true, maxlength: 64 },
    sessionId: { type: String, required: true, maxlength: 64 },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    path: { type: String, required: true, maxlength: 300 },
    hackathonSlug: { type: String, maxlength: 120 },
    referrerHost: { type: String, default: '', maxlength: 200 },
    utmSource: { type: String, maxlength: 100 },
    utmMedium: { type: String, maxlength: 100 },
    utmCampaign: { type: String, maxlength: 100 },
    device: { type: String, enum: ['mobile', 'tablet', 'desktop'], default: 'desktop' },
    browser: { type: String, default: 'Other', maxlength: 40 },
    os: { type: String, default: 'Other', maxlength: 40 },
    country: { type: String, maxlength: 8 },
    region: { type: String, maxlength: 80 },
    city: { type: String, maxlength: 80 },
    durationMs: { type: Number, min: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
pageViewSchema.index({ createdAt: -1 });
pageViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: RETENTION_SECONDS, name: 'pageview_ttl' });
pageViewSchema.index({ visitorId: 1, createdAt: -1 });
pageViewSchema.index({ path: 1, createdAt: -1 });
pageViewSchema.index({ userId: 1, createdAt: -1 });
pageViewSchema.index({ hackathonSlug: 1, createdAt: -1 }, { partialFilterExpression: { hackathonSlug: { $type: 'string' } } });

const eventSchema = new Schema<IAnalyticsEvent>(
  {
    type: { type: String, enum: ['impression', 'click', 'register', 'search', 'share', 'signup', 'login'], required: true },
    visitorId: { type: String, maxlength: 64 },
    sessionId: { type: String, maxlength: 64 },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    target: { type: String, default: '', maxlength: 200 },
    path: { type: String, maxlength: 300 },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false }, minimize: false }
);
eventSchema.index({ type: 1, createdAt: -1 });
eventSchema.index({ createdAt: 1 }, { expireAfterSeconds: RETENTION_SECONDS, name: 'event_ttl' });
eventSchema.index({ target: 1, type: 1, createdAt: -1 });
eventSchema.index({ userId: 1, createdAt: -1 }, { partialFilterExpression: { userId: { $type: 'objectId' } } });

export const PageView = defineModel<IPageView>('PageView', pageViewSchema);
export const AnalyticsEvent = defineModel<IAnalyticsEvent>('AnalyticsEvent', eventSchema);
