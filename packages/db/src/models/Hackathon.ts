import { Schema, type Types } from 'mongoose';
import type { Currency, Eligibility, EventType, Mode, OrganizerType, ThemeSlug } from '@hackathonfinder/shared';
import { defineModel, SLUG_PATTERN } from './define';

/** live: shown to students. pending: waiting in the review queue. rejected/removed: hidden. */
export type ListingState = 'live' | 'pending' | 'rejected' | 'removed';

/** One place we found the event. The same event on three sites has three refs. */
export interface ISourceRef {
  /** Source slug from SOURCES (unstop, devfolio, instagram, …). */
  source: string;
  url: string;
  /** The source's own id for the event, when it has one. */
  externalId?: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
}

export interface IHackathon {
  _id: Types.ObjectId;
  slug: string;
  title: string;
  tagline: string;
  type: EventType;
  organizer: string;
  organizerType: OrganizerType;
  mode: Mode;
  /** City slug; empty for online events. */
  city?: string;
  /** Display name when the city isn't one of our catalog cities (e.g. "Bhopal"). */
  cityName?: string;
  /** Indian state (or region abroad), when known. */
  region?: string;
  venue?: string;
  country: string;
  /** GeoJSON point [lng, lat] of the venue, for "near me" queries. */
  location?: { type: 'Point'; coordinates: [number, number] };
  startDate: Date;
  endDate: Date;
  registrationDeadline: Date;
  teamMin: number;
  teamMax: number;
  eligibility: Eligibility[];
  /** Entry fee in INR; 0 means free. */
  fee: number;
  prizePool: number;
  prizeCurrency: Currency;
  prizes: string[];
  perks: string[];
  themes: ThemeSlug[];
  beginnerFriendly: boolean;
  featured: boolean;
  /** Organizer or listing checked by a person. */
  verified: boolean;
  registrationUrl: string;
  /** link: register on the page. qr: the poster has a QR code (registrationUrl is what it points to, or the post). */
  registrationVia: 'link' | 'qr';
  /** Source slugs, first one is where we found it first. */
  sources: string[];
  sourceRefs: ISourceRef[];
  /** Our own short summary; never the organizer's full text. */
  summary: string;
  /** Banner or poster image (scraped or uploaded), served from Cloudinary when it is set up. */
  imageUrl?: string;
  /** Where the banner came from before we stored a copy. */
  sourceImageUrl?: string;
  logoUrl?: string;
  lastChecked: Date;
  state: ListingState;
  /** 0–1: how sure the pipeline is about the extracted details. */
  confidence: number;
  /** Why the verifier flagged it, shown in the review queue. */
  flags: string[];
  /** Why an admin removed or rejected it, and who. */
  removedReason?: string;
  removedBy?: Types.ObjectId;
  removedAt?: Date;
  submittedBy?: Types.ObjectId;
  claimedBy?: Types.ObjectId;
  stats: { views: number; saves: number; registerClicks: number };
  createdAt: Date;
  updatedAt: Date;
}

const pointSchema = new Schema(
  {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true },
  },
  { _id: false }
);

const sourceRefSchema = new Schema<ISourceRef>(
  {
    source: { type: String, required: true },
    url: { type: String, required: true },
    externalId: String,
    firstSeenAt: { type: Date, default: () => new Date() },
    lastSeenAt: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const hackathonSchema = new Schema<IHackathon>(
  {
    slug: { type: String, required: true, match: SLUG_PATTERN },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    tagline: { type: String, trim: true, maxlength: 200, default: '' },
    type: {
      type: String,
      enum: ['hackathon', 'ideathon', 'coding-contest', 'case-competition', 'build-challenge', 'open-source'],
      default: 'hackathon',
    },
    organizer: { type: String, trim: true, maxlength: 140, default: '' },
    organizerType: { type: String, enum: ['college', 'company', 'community', 'government'], default: 'community' },
    mode: { type: String, enum: ['online', 'offline', 'hybrid'], required: true },
    city: { type: String, trim: true },
    cityName: { type: String, trim: true, maxlength: 80 },
    region: { type: String, trim: true, maxlength: 80 },
    venue: { type: String, trim: true, maxlength: 200 },
    country: { type: String, trim: true, default: 'India' },
    // No default: a 2dsphere index rejects half-filled points, so unknown places stay unset.
    location: { type: pointSchema, default: undefined },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    registrationDeadline: { type: Date, required: true },
    teamMin: { type: Number, min: 1, default: 1 },
    teamMax: { type: Number, min: 1, default: 4 },
    eligibility: { type: [String], default: ['students'] },
    fee: { type: Number, min: 0, default: 0 },
    prizePool: { type: Number, min: 0, default: 0 },
    prizeCurrency: { type: String, enum: ['INR', 'USD'], default: 'INR' },
    prizes: { type: [String], default: [] },
    perks: { type: [String], default: [] },
    themes: { type: [String], default: [] },
    beginnerFriendly: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    registrationUrl: { type: String, required: true, trim: true },
    registrationVia: { type: String, enum: ['link', 'qr'], default: 'link' },
    sources: { type: [String], default: [] },
    sourceRefs: { type: [sourceRefSchema], default: [] },
    summary: { type: String, trim: true, maxlength: 1200, default: '' },
    imageUrl: { type: String, trim: true },
    sourceImageUrl: { type: String, trim: true },
    logoUrl: { type: String, trim: true },
    lastChecked: { type: Date, default: () => new Date() },
    state: { type: String, enum: ['live', 'pending', 'rejected', 'removed'], default: 'pending' },
    confidence: { type: Number, min: 0, max: 1, default: 1 },
    flags: { type: [String], default: [] },
    removedReason: { type: String, trim: true, maxlength: 300 },
    removedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    removedAt: Date,
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    claimedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    stats: {
      views: { type: Number, default: 0 },
      saves: { type: Number, default: 0 },
      registerClicks: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

hackathonSchema.index({ slug: 1 }, { unique: true });
hackathonSchema.index({ location: '2dsphere' });
hackathonSchema.index({ state: 1, registrationDeadline: 1 });
hackathonSchema.index({ state: 1, city: 1 });
hackathonSchema.index({ state: 1, themes: 1 });
hackathonSchema.index({ state: 1, createdAt: -1 });
hackathonSchema.index({ 'sourceRefs.source': 1, 'sourceRefs.externalId': 1 });
hackathonSchema.index({ 'sourceRefs.url': 1 });
hackathonSchema.index(
  { title: 'text', tagline: 'text', organizer: 'text', summary: 'text', venue: 'text' },
  { weights: { title: 10, organizer: 4, tagline: 3, venue: 2, summary: 1 }, name: 'hackathon_text' }
);

export const Hackathon = defineModel<IHackathon>('Hackathon', hackathonSchema);
