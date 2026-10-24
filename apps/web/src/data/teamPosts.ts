// Team Finder shapes shared by the API (server/teams.ts) and the Team Finder UI.
// Client-safe: no database imports here.

export type TeamMode = 'in-person' | 'online' | 'either';
export type TeamStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn';

export { SKILLS } from './skills';

export const TEAM_MODES: { value: TeamMode; label: string }[] = [
  { value: 'in-person', label: 'In person' },
  { value: 'online', label: 'Online' },
  { value: 'either', label: 'In person or online' },
];

export function teamModeLabel(mode: TeamMode): string {
  return TEAM_MODES.find((m) => m.value === mode)?.label ?? mode;
}

/** A student as shown on team cards, requests and invites. */
export interface TeamStudent {
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

export interface TeamPost {
  id: string;
  author: TeamStudent;
  /** City slug from CITIES, or 'online' for teams with no home city. */
  city: string;
  mode: TeamMode;
  /** Empty when the team is open to any hackathon. */
  hackathonSlug: string;
  /** The listing's title, or "Any hackathon". */
  hackathonTitle: string;
  /** ISO; empty when the listing is gone. */
  hackathonDeadline: string;
  /** Current team size, including the author. */
  members: number;
  teamMax: number;
  has: string[];
  needs: string[];
  idea: string;
  /** False once the team is full or the author closed it. */
  open: boolean;
  createdAt: string;
  updatedAt: string;
  /** Km from the `near` point, for teams with a home city. */
  km?: number;
}

export interface TeamPostsPage {
  items: TeamPost[];
  total: number;
  page: number;
  pages: number;
  /** Open team posts per city slug (and 'online'), with `counts=1`. */
  counts?: Record<string, number>;
}

export interface ResultCounts {
  hackathons: number;
  wins: number;
  podiums: number;
  finals: number;
}

/** A student looking for a team (GET /api/people). */
export interface Student extends TeamStudent {
  bio: string;
  github: string;
  linkedin: string;
  lookingForTeam: boolean;
  joinedAt: string;
  results: ResultCounts;
  km?: number;
}

export interface PeoplePage {
  items: Student[];
  total: number;
  page: number;
  pages: number;
}

/** The team post a request or invite is about. */
export interface PostSummary {
  id: string;
  /** Empty when the team is open to any hackathon. */
  hackathonSlug: string;
  hackathonTitle: string;
  city: string;
  members: number;
  teamMax: number;
  open: boolean;
  /** The author removed the post. */
  removed: boolean;
}

/** A student asking to join a team post. */
export interface JoinRequest {
  id: string;
  status: TeamStatus;
  message: string;
  createdAt: string;
  updatedAt: string;
  post: PostSummary | null;
  from: TeamStudent;
  /** The post's author. */
  to: TeamStudent;
  /** Once accepted: the chat between the two students. */
  conversationId?: string;
}

/** A student inviting another student, optionally to one of their team posts. */
export interface TeamInvite {
  id: string;
  status: TeamStatus;
  message: string;
  createdAt: string;
  updatedAt: string;
  post: PostSummary | null;
  from: TeamStudent;
  to: TeamStudent;
  /** Once accepted: the chat between the two students. */
  conversationId?: string;
}

export interface Inbox<T> {
  sent: T[];
  received: T[];
}

/** Students and open teams in one city, for the city page. */
export interface CitySnapshot {
  /** A few students from the city, those looking for a team first. */
  students: { handle: string; name: string }[];
  studentTotal: number;
  lookingTotal: number;
  teamTotal: number;
}
