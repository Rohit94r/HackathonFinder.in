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

// Kept in this browser until accounts launch. v1 posts had a different shape, so they're ignored.
export const TEAM_POSTS_KEY = 'hf_team_posts_v2';
export const TEAM_REQUESTS_KEY = 'hf_team_requests_v2';
/** Handles of students I invited. The profile pages use the same key. */
export const INVITES_KEY = 'hf_invites_v1';

// Sample posts shown in the preview; real posts come from signed-in students.
export const sampleTeamPosts: TeamPost[] = [
  {
    id: 's1',
    authorHandle: 'aarav-patil',
    city: 'pune',
    mode: 'in-person',
    hackathonSlug: 'codestorm-2026',
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
    hackathonSlug: 'hackher-pune',
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
    hackathonSlug: 'kolkata-code-carnival',
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
    hackathonSlug: 'gift-city-fintech-hack',
    members: 1,
    teamMax: 4,
    has: ['Mobile', 'Backend'],
    needs: ['UI/UX design', 'Pitching', 'ML / AI'],
    idea: 'UPI credit scores for small shops from their daily sales. I have the Flutter app started, need a designer and a pitcher.',
    postedDaysAgo: 1,
  },
  {
    id: 's5',
    authorHandle: 'rohan-deshmukh',
    city: 'pune',
    mode: 'in-person',
    hackathonSlug: 'smart-city-hack-pune',
    members: 2,
    teamMax: 5,
    has: ['Hardware / IoT', 'Data'],
    needs: ['Backend', 'Frontend', 'Pitching'],
    idea: 'Smart water meters for housing societies that flag leaks early. The sensor prototype works, we need the dashboard and the pitch.',
    postedDaysAgo: 2,
  },
  {
    id: 's6',
    authorHandle: 'priya-wankhede',
    city: 'nagpur',
    mode: 'online',
    hackathonSlug: 'buildfest-online',
    members: 1,
    teamMax: 3,
    has: ['Frontend'],
    needs: ['Backend'],
    idea: 'First hackathon! I want to build a simple expense splitter for hostel friends. Beginners welcome.',
    postedDaysAgo: 2,
  },
  {
    id: 's7',
    authorHandle: 'vikram-singh',
    city: 'jaipur',
    mode: 'in-person',
    hackathonSlug: 'pink-city-ideathon',
    members: 1,
    teamMax: 3,
    has: ['Product', 'Pitching'],
    needs: ['Full stack', 'UI/UX design'],
    idea: 'Help Jaipur’s block-print artisans sell direct to buyers. I know the artisans and can pitch, need two builders.',
    postedDaysAgo: 2,
  },
  {
    id: 's8',
    authorHandle: 'kabir-rao',
    city: 'bengaluru',
    mode: 'in-person',
    hackathonSlug: 'web3-builders-weekend',
    members: 2,
    teamMax: 4,
    has: ['Blockchain', 'Backend'],
    needs: ['Frontend', 'Product'],
    idea: 'Transparent donation tracking for small NGOs on-chain. Need a frontend dev and someone who can talk to users.',
    postedDaysAgo: 3,
  },
  {
    id: 's9',
    authorHandle: 'meera-nair',
    city: 'kochi',
    mode: 'in-person',
    hackathonSlug: 'kochi-blue-hack',
    members: 2,
    teamMax: 5,
    has: ['Data', 'Product'],
    needs: ['Hardware / IoT', 'Mobile'],
    idea: 'Low-cost tide sensors for fishing villages, with SMS alerts before a surge. We have the flood data, need the device and the app.',
    postedDaysAgo: 3,
  },
  {
    id: 's10',
    authorHandle: 'ishita-reddy',
    city: 'online',
    mode: 'online',
    hackathonSlug: 'greencode-climate-hack',
    members: 2,
    teamMax: 4,
    has: ['ML / AI', 'Data'],
    needs: ['Full stack', 'UI/UX design'],
    idea: 'Predict heat-wave hotspots in Indian cities from open satellite data, and show them on a simple map. Fully remote team.',
    postedDaysAgo: 4,
  },
  {
    id: 's11',
    authorHandle: 'harsh-jain',
    city: 'indore',
    mode: 'either',
    hackathonSlug: 'indore-smart-city-challenge',
    members: 1,
    teamMax: 4,
    has: ['Backend', 'Data'],
    needs: ['Frontend', 'UI/UX design', 'Pitching'],
    idea: 'Route garbage trucks around Indore’s busiest markets using live bin levels. I can do the backend, need a front-end and a pitcher.',
    postedDaysAgo: 4,
  },
  {
    id: 's12',
    authorHandle: 'arjun-iyer',
    city: 'chennai',
    mode: 'online',
    hackathonSlug: 'ai-for-bharat-ideathon',
    members: 1,
    teamMax: 3,
    has: ['Hardware / IoT', 'Backend'],
    needs: ['ML / AI', 'Pitching'],
    idea: 'A voice assistant for farmers that works over a basic phone call, in Tamil first. Need an ML person and a strong pitcher.',
    postedDaysAgo: 5,
  },
  {
    id: 's13',
    authorHandle: 'ananya-sharma',
    city: 'delhi-ncr',
    mode: 'in-person',
    hackathonSlug: 'tricity-ai-sprint',
    members: 2,
    teamMax: 3,
    has: ['Full stack', 'Product', 'Pitching'],
    needs: ['ML / AI'],
    idea: 'An AI tutor that checks handwritten maths homework from a photo. Driving up from Delhi, one seat left for an ML builder.',
    postedDaysAgo: 6,
  },
];
