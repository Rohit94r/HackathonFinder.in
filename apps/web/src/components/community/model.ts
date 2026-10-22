import type { CategoryId } from '@/data/discussions';

// Types and helpers shared by the community components, the API and server pages.
// No 'use client' here, so server code can import from it too.

/** The author line on a post, as the API sends it. An empty id means a deleted account. */
export interface Author {
  id: string;
  handle: string;
  name: string;
  image?: string;
  about: string;
  college: string;
  city: string;
  skills: string[];
  isSample: boolean;
}

export interface ThreadItem {
  id: string;
  /** Used in URLs: /community/[slug]. */
  slug: string;
  title: string;
  /** Plain text; paragraphs separated by a blank line. */
  body: string;
  category: CategoryId;
  tags: string[];
  city?: string;
  hackathonSlug?: string;
  hackathonTitle?: string;
  pinned: boolean;
  author: Author;
  votes: number;
  /** Whether the signed-in student upvoted it. */
  voted: boolean;
  replyCount: number;
  /** Posted by the signed-in student. */
  mine: boolean;
  /** The author can still edit it (the first 24 hours). */
  canEdit: boolean;
  createdAt: string;
  lastActivityAt: string;
  editedAt?: string;
}

export interface ReplyItem {
  id: string;
  body: string;
  author: Author;
  votes: number;
  voted: boolean;
  mine: boolean;
  createdAt: string;
}

export interface ThreadList {
  items: ThreadItem[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  /** Threads per category for the same filters (ignoring the category). */
  counts: Record<string, number>;
  /** Server time, so "2 hours ago" reads the same on the server and in the browser. */
  now: string;
}

export interface ThreadDetailData {
  thread: ThreadItem;
  replies: ReplyItem[];
  now: string;
}

/** Who is looking: enough to show their own and admin controls. */
export interface Viewer {
  id: string;
  handle: string;
  role: 'student' | 'organizer' | 'admin';
}

export type SortKey = 'hot' | 'new' | 'top';

export const SORTS: { value: SortKey; label: string }[] = [
  { value: 'hot', label: 'Hot' },
  { value: 'new', label: 'New' },
  { value: 'top', label: 'Top' },
];

export const TITLE_MIN = 8;
export const TITLE_MAX = 140;
export const BODY_MIN = 20;
export const BODY_MAX = 5000;
export const REPLY_MIN = 2;
export const REPLY_MAX = 3000;
export const MAX_TAGS = 5;
export const EDIT_WINDOW_HOURS = 24;

/** "#Team Up" → "team-up". Theme slugs pass through unchanged. */
export function normalizeTag(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/^#+/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24)
    .replace(/-+$/, '');
}

/** Where an author's name links: their public profile, your own, or nowhere for a deleted account. */
export function authorHref(author: Author, mine: boolean): string | undefined {
  if (!author.id) return undefined;
  return mine ? '/profile' : `/u/${author.handle}`;
}

export function hoursBetween(fromIso: string, toIso: string): number {
  return Math.max(0, (Date.parse(toIso) - Date.parse(fromIso)) / 3_600_000);
}

export function agoLabel(hours: number): string {
  if (hours < 1) {
    const mins = Math.round(hours * 60);
    return mins < 1 ? 'just now' : `${mins} min ago`;
  }
  if (hours < 24) {
    const h = Math.round(hours);
    return `${h} ${h === 1 ? 'hour' : 'hours'} ago`;
  }
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  const months = Math.round(days / 30);
  return `${months} ${months === 1 ? 'month' : 'months'} ago`;
}

/** "3 hours ago", measured against the server's clock. */
export const ago = (iso: string, now: string) => agoLabel(hoursBetween(iso, now));
