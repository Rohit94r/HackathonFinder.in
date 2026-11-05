import type { ThemeSlug } from '@hackathonfinder/shared';
import type { MyBadgeInput } from './badgeData';

// Shapes of GET /api/users/[handle] (built in server/profiles.ts), shared with the pages
// and client components so neither side has to import the other.

export type ResultKind = 'winner' | 'runner-up' | 'finalist' | 'participant';

/** What anyone may see about a student (same fields as PublicUser in @hackathonfinder/db). */
export interface ProfileUser {
  id: string;
  handle: string;
  name: string;
  image?: string;
  about: string;
  college: string;
  city: string;
  skills: string[];
  bio: string;
  github: string;
  linkedin: string;
  lookingForTeam: boolean;
  role: 'student' | 'organizer' | 'admin';
  isSample: boolean;
  joinedAt: string;
}

/** One hackathon in a student's record. */
export interface ProfileRecord {
  id: string;
  event: string;
  hackathonSlug?: string;
  result: ResultKind;
  project: string;
  /** ISO date. */
  date: string;
}

/** A winning story, as small as the profile needs. */
export interface ProfileStory {
  slug: string;
  projectName: string;
  hackathon: string;
  hackathonSlug?: string;
  city?: string;
  result: Exclude<ResultKind, 'participant'>;
  prize: string;
  tagline: string;
  themes: ThemeSlug[];
  cheers: number;
  /** The story's uploaded cover photo, if it has one. */
  coverUrl?: string;
  createdAt: string;
}

export interface ProfileStats {
  hackathons: number;
  wins: number;
  podiums: number;
  finals: number;
}

export interface ProfileCounts {
  threads: number;
  replies: number;
  wins: number;
  teamPosts: number;
}

export interface PublicProfile {
  user: ProfileUser;
  record: ProfileRecord[];
  stats: ProfileStats;
  counts: ProfileCounts;
  /** Actions per India-time day ("YYYY-MM-DD") for the past ~371 days. */
  heatmap: Record<string, number>;
  /** The day the heatmap ends on (India time). */
  todayKey: string;
  badgeInput: MyBadgeInput;
  stories: ProfileStory[];
}

export function recordStats(record: Pick<ProfileRecord, 'result'>[]): ProfileStats {
  return {
    hackathons: record.length,
    wins: record.filter((r) => r.result === 'winner').length,
    podiums: record.filter((r) => r.result === 'winner' || r.result === 'runner-up').length,
    finals: record.filter((r) => r.result !== 'participant').length,
  };
}

export function resultCounts(record: Pick<ProfileRecord, 'result'>[]): Record<ResultKind, number> {
  const counts: Record<ResultKind, number> = { winner: 0, 'runner-up': 0, finalist: 0, participant: 0 };
  for (const r of record) counts[r.result]++;
  return counts;
}

/** "Read the story" links: a record entry matches a story by listing or by hackathon name. */
export function storyLinks(record: ProfileRecord[], stories: ProfileStory[]): Record<string, string> {
  const links: Record<string, string> = {};
  const norm = (s: string) => s.trim().toLowerCase();
  for (const r of record) {
    const story = stories.find(
      (s) => (r.hackathonSlug && s.hackathonSlug === r.hackathonSlug) || norm(s.hackathon) === norm(r.event)
    );
    if (story) links[r.id] = story.slug;
  }
  return links;
}

/** "Joined Mar 2025", in India time so server and browser agree. */
export function joinedLabel(iso: string): string {
  if (!iso) return '';
  return `Joined ${monthYear(iso)}`;
}

export function monthYear(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
}
