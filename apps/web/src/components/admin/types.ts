// JSON shapes the admin API sends to the admin pages (dates arrive as ISO strings).
// Kept free of server imports so client components can use them.

export type ListingState = 'live' | 'pending' | 'rejected' | 'removed';
export type Role = 'student' | 'organizer' | 'admin';

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

export interface PersonRef {
  id: string;
  handle: string;
  name: string;
}

export interface ListingRow {
  id: string;
  slug: string;
  title: string;
  organizer: string;
  state: ListingState;
  mode: 'online' | 'offline' | 'hybrid';
  city: string;
  cityName: string;
  place: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  sources: string[];
  sourceRefs: { source: string; url: string; lastSeenAt: string }[];
  confidence: number;
  flags: string[];
  featured: boolean;
  verified: boolean;
  imageUrl: string;
  registrationUrl: string;
  registrationVia: 'link' | 'qr';
  removedReason: string;
  removedAt: string | null;
  submittedBy: string | null;
  submitter?: PersonRef | null;
  stats: { views: number; saves: number; registerClicks: number };
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionRow {
  id: string;
  kind: 'quick' | 'organizer' | 'extension';
  status: string;
  title: string;
  url: string;
  seenOn: string;
  source: string;
  posterUrl: string;
  imageUrl: string;
  email: string;
  userId: string | null;
  user: { handle: string; name: string } | null;
  method: 'ai' | 'rules' | 'form' | null;
  confidence: number | null;
  isEvent: boolean | null;
  missing: string[];
  duplicateOf: { id: string; slug: string; title: string; state: string } | null;
  hackathonId: string | null;
  reviewNote: string;
  createdAt: string;
  reviewedAt: string | null;
}

export interface UserRow {
  id: string;
  name: string;
  handle: string;
  email: string;
  image: string;
  role: Role;
  adminByEmail: boolean;
  banned: boolean;
  isSample: boolean;
  emailVerified: boolean;
  college: string;
  city: string;
  joinedAt: string;
  lastLoginAt: string | null;
  deletedAt: string | null;
  counts?: { threads: number; replies: number; teamPosts: number; messages: number; wins: number; submissions: number };
}

export interface TrafficSummary {
  visitors: number;
  sessions: number;
  pageViews: number;
  avgTimeMs: number | null;
  bounceRate: number | null;
  activeUsers: number;
  hackathonViews: number;
  impressions: number;
  registerClicks: number;
  clicks: number;
  signups: number;
  logins: number;
}

export interface SeriesPoint {
  key: string;
  views: number;
  visitors: number;
}

export interface CountRow {
  key: string;
  visitors: number;
  views?: number;
}

export interface Breakdowns {
  pages: { path: string; views: number; visitors: number; avgTimeMs: number | null }[];
  referrers: CountRow[];
  utm: { source: string; medium: string; campaign: string; views: number; visitors: number }[];
  devices: CountRow[];
  browsers: CountRow[];
  os: CountRow[];
  countries: CountRow[];
  cities: CountRow[];
  clicks: { label: string; clicks: number }[];
}

export interface FunnelRow {
  slug: string;
  id: string | null;
  title: string;
  state: string;
  impressions: number;
  views: number;
  visitors: number;
  registerClicks: number;
  saves: number;
}

export type ScrapeStatus = 'queued' | 'running' | 'success' | 'partial' | 'failed' | 'skipped';
export type ScrapeItemAction = 'created' | 'updated' | 'merged' | 'review' | 'rejected' | 'error';

export interface ScrapeCounts {
  found: number;
  new: number;
  created: number;
  updated: number;
  merged: number;
  review: number;
  rejected: number;
  errors: number;
}

export interface ScrapeRunSummary {
  id: string;
  status: ScrapeStatus;
  trigger: 'manual' | 'schedule' | 'api';
  sources: string[];
  startedAt: string;
  finishedAt?: string;
  startedBy?: string;
  counts: ScrapeCounts;
  progress: { done: number; total: number; current: string };
}

export interface ScrapeListing {
  id: string;
  slug: string;
  title: string;
  state: ListingState;
  registrationUrl: string;
  registrationVia: 'link' | 'qr';
  imageUrl: string;
  place: string;
}

export interface ScrapeItem {
  action: ScrapeItemAction;
  source: string;
  title: string;
  url: string;
  slug?: string;
  hackathonId?: string;
  imageUrl?: string;
  place?: string;
  mode?: string;
  reason?: string;
  listing: ScrapeListing | null;
}

export interface ScrapeRunDetail extends ScrapeRunSummary {
  items: ScrapeItem[];
  errorLog: string[];
  log: string[];
}

export interface ScrapeSource {
  slug: string;
  name: string;
  kind: string;
  description: string;
  enabled: boolean;
  missingEnv: string[];
  health: 'ok' | 'degraded' | 'failing' | 'blocked' | 'unknown';
  lastRunAt?: string;
  lastSuccessAt?: string;
  lastError?: string;
  lastItemCount?: number;
}
