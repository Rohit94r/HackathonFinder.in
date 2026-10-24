export type TeamMode = 'in-person' | 'online' | 'either';

export interface TeamPost {
  id: string;
  /** A PEOPLE handle, or the student's own profile handle for their posts. */
  authorHandle: string;
  /** Saved on the student's own posts, in case their profile changes later. */
  authorName?: string;
  /** City slug from CITIES, or 'online' for teams with no home city. */
  city: string;
  mode: TeamMode;
  /** A listing slug, or '' for a team open to any hackathon (the sample posts are). */
  hackathonSlug: string;
  /** Current team size, including the author. */
  members: number;
  teamMax: number;
  has: string[];
  needs: string[];
  idea: string;
  postedDaysAgo: number;
  /** ISO timestamp, set on the student's own posts. */
  postedAt?: string;
}

/** Someone asking to join a team post. */
export interface TeamRequest {
  postId: string;
  message: string;
  /** ISO timestamp. */
  at: string;
}

export { SKILLS } from './skills';

export const TEAM_MODES: { value: TeamMode; label: string }[] = [
  { value: 'in-person', label: 'In person' },
  { value: 'online', label: 'Online' },
  { value: 'either', label: 'In person or online' },
];

export function teamModeLabel(mode: TeamMode): string {
  return TEAM_MODES.find((m) => m.value === mode)?.label ?? mode;
}

// The four sample students' team posts. They aren't tied to a listing, so they stay up
// whatever hackathons are open; real posts come from signed-in students.
export const sampleTeamPosts: TeamPost[] = [
  {
    id: 's1',
    authorHandle: 'aarav-patil',
    city: 'pune',
    mode: 'in-person',
    hackathonSlug: '',
    members: 2,
    teamMax: 4,
    has: ['Backend', 'ML / AI'],
    needs: ['Frontend', 'UI/UX design'],
    idea: 'An AI study buddy that turns lecture notes into quizzes. The model works, we need someone to make it look good.',
    postedDaysAgo: 0,
  },
  {
    id: 's2',
    authorHandle: 'sneha-kulkarni',
    city: 'pune',
    mode: 'either',
    hackathonSlug: '',
    members: 1,
    teamMax: 4,
    has: ['UI/UX design', 'Pitching'],
    needs: ['Full stack', 'Mobile'],
    idea: 'A women’s safety app for late-night commutes with shared live routes. Looking for two builders.',
    postedDaysAgo: 1,
  },
  {
    id: 's3',
    authorHandle: 'riya-sen',
    city: 'kolkata',
    mode: 'either',
    hackathonSlug: '',
    members: 2,
    teamMax: 4,
    has: ['Frontend', 'UI/UX design'],
    needs: ['Backend', 'Data'],
    idea: 'A book exchange for college libraries across Kolkata. Two designers here, we need someone for the API and search.',
    postedDaysAgo: 0,
  },
  {
    id: 's4',
    authorHandle: 'dev-shah',
    city: 'ahmedabad',
    mode: 'in-person',
    hackathonSlug: '',
    members: 1,
    teamMax: 4,
    has: ['Mobile', 'Backend'],
    needs: ['UI/UX design', 'Pitching', 'ML / AI'],
    idea: 'UPI credit scores for small shops from their daily sales. I have the Flutter app started, need a designer and a pitcher.',
    postedDaysAgo: 1,
  },
];
