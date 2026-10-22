import type { ThemeSlug } from '@hackathonfinder/shared';
import type { Author } from '@/components/community/model';
import type { WinResult, WinSections } from '@/data/wins';

// Winning stories as the API sends them. No 'use client' here, so server code can import it too.

export interface WinItem {
  id: string;
  /** Used in URLs: /wins/[slug]. */
  slug: string;
  author: Author;
  hackathon: string;
  /** Only set when the hackathon is one of our listings. */
  hackathonSlug?: string;
  /** City slug from CITIES; empty for online events. */
  city?: string;
  result: WinResult;
  prize: string;
  projectName: string;
  tagline: string;
  themes: ThemeSlug[];
  techStack: string[];
  /** Team member names, author first. */
  team: string[];
  /** Paragraphs separated by blank lines. */
  sections: WinSections;
  links: { demo?: string; github?: string };
  coverUrl?: string;
  cheers: number;
  /** Whether the signed-in student cheered it. */
  cheered: boolean;
  /** Written by the signed-in student. */
  mine: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WinList {
  items: WinItem[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  /** Server time, so "3 days ago" reads the same on the server and in the browser. */
  now: string;
}

export type WinSort = 'newest' | 'cheers';

export const HACKATHON_MIN = 3;
export const HACKATHON_MAX = 120;
export const PROJECT_MIN = 2;
export const PROJECT_MAX = 80;
export const TAGLINE_MIN = 10;
export const TAGLINE_MAX = 160;
export const PRIZE_MAX = 120;
export const SECTION_MIN = 40;
export const SECTION_MAX = 4000;
export const MAX_THEMES = 3;
export const MAX_TECH = 12;
/** Teammates besides the author. */
export const MAX_TEAMMATES = 7;
export const MAX_COVER_MB = 8;

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.max(0, Math.floor((Date.parse(toIso) - Date.parse(fromIso)) / 86_400_000));
}
