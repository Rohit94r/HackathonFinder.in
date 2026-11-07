import type { Currency, Eligibility, EventType, Mode, OrganizerType, SourceKind } from '@hackathonfinder/shared';
import type { Http } from './http';

/**
 * Listing fields a connector could read directly from its source. Everything is
 * optional; dates are ISO strings (an offset or Z when the source gives one).
 */
export interface CandidateData {
  title?: string;
  type?: EventType;
  organizer?: string;
  organizerType?: OrganizerType;
  mode?: Mode;
  city?: string;
  /** Indian state (or region abroad) as the source names it. */
  region?: string;
  venue?: string;
  address?: string;
  country?: string;
  lat?: number;
  lng?: number;
  startDate?: string;
  endDate?: string;
  registrationDeadline?: string;
  /** IANA zone for date strings without an offset. Defaults to Asia/Kolkata. */
  timezone?: string;
  /** The source gives no deadline, so the connector used the start (or end) date. */
  deadlineAssumed?: boolean;
  teamMin?: number;
  teamMax?: number;
  teamSizeText?: string;
  /** Entry fee in INR; 0 is free. */
  fee?: number;
  isPaid?: boolean;
  prizePool?: number;
  prizeCurrency?: Currency;
  prizeText?: string;
  prizes?: string[];
  perks?: string[];
  /** Tracks, themes or skills as the source names them. */
  tags?: string[];
  eligibility?: Eligibility[];
  beginnerFriendly?: boolean;
  imageUrl?: string;
  logoUrl?: string;
  registrationUrl?: string;
  /** "qr" when the source says registration is by scanning a QR code on the poster. */
  registrationVia?: 'link' | 'qr';
  /**
   * A hybrid event whose main way to take part is online (MLH "hybrid_digital", lablab's
   * online build phase). Only these may be listed online when the venue is abroad; other
   * hybrid events abroad are in-person first and are rejected like any event outside India.
   */
  remoteOk?: boolean;
  /** SOURCES slug shown on the listing when it differs from the connector (a Google result on linkedin.com → "linkedin"). */
  listingSource?: string;
  /** Review notes from the connector (a search lead, a QR to check). Any flag keeps the listing in review. */
  flags?: string[];
}

/** One thing the Scout found: an event from a platform, a post, a search result or a page. */
export interface RawCandidate {
  externalId?: string;
  /** Where we found it (the event page, post permalink or search result link). Unique per source. */
  url: string;
  title?: string;
  /** Plain text for the Extractor and the rule-based taggers. Never shown as our summary. */
  text?: string;
  data: CandidateData;
  /** Posters and banners, for the Extractor (and the listing image when the source allows it). */
  imageUrls: string[];
}

export interface SourceInfo {
  slug: string;
  name: string;
  config: Record<string, unknown>;
}

export interface ConnectorContext {
  http: Http;
  source: SourceInfo;
  /** Most candidates to return; Infinity when not set. */
  limit: number;
  now: Date;
  env: NodeJS.ProcessEnv;
  log: (message: string) => void;
  /** A short, human-readable line for the live run header (the detailed log goes through `log`). */
  progress?: (message: string) => void;
  /** A partial failure (one bad item, one page that failed). The run goes on and ends "partial". */
  warn: (message: string) => void;
}

export interface Connector {
  /** A SOURCES slug from @hackathonfinder/shared where one exists. */
  slug: string;
  name: string;
  kind: SourceKind;
  /** Cron expression, read in Asia/Kolkata. */
  defaultSchedule: string;
  /** Env vars without which the connector is skipped ("needs KEY"). */
  requiredEnv?: string[];
  defaultConfig?: Record<string, unknown>;
  /** One line for the sources table and README. */
  description: string;
  /** Base confidence for details read from this source (0–1). */
  trust: number;
  /** "always": every candidate goes through the Extractor (posts, snippets). "missing": only when key fields are missing. */
  extract: 'always' | 'missing';
  /**
   * True when fetch() returns every currently listed event (all pages), so an event
   * it stops returning can be counted as missing. Never set it for search/social
   * connectors, which only find a sample.
   */
  complete?: boolean;
  /** False when image URLs expire or may not be hotlinked (Instagram CDN); they're then only read, or mirrored. */
  storeImages?: boolean;
  /** Env vars that add to the connector when set (an official API) but aren't needed. */
  optionalEnv?: string[];
  /** Off until an admin turns it on (new Source docs start disabled). */
  disabledByDefault?: boolean;
  fetch(ctx: ConnectorContext): Promise<RawCandidate[]>;
  /**
   * Reads the event's own page for what the list leaves out (banner, start date, fee).
   * The runner calls it only for new events and ones still missing an image, so repeat
   * runs stay fast. Returns the candidate with the extra details filled in.
   */
  detail?(candidate: RawCandidate, ctx: ConnectorContext): Promise<RawCandidate>;
}

export interface RunCounts {
  found: number;
  new: number;
  created: number;
  updated: number;
  merged: number;
  review: number;
  rejected: number;
  errors: number;
}

export const zeroCounts = (): RunCounts => ({ found: 0, new: 0, created: 0, updated: 0, merged: 0, review: 0, rejected: 0, errors: 0 });
