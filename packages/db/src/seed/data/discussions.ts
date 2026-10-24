import { THEMES } from '@hackathonfinder/shared';

// Sample community discussions for the preview, by the four sample students in people.ts.
// None is about a particular listing, so they stay valid whatever hackathons are open.
// Times are relative so the board always looks current.

export type CategoryId = 'general' | 'hackathon-qa' | 'team-up' | 'feedback' | 'resources' | 'city-talk';

export interface DiscussionCategory {
  id: CategoryId;
  label: string;
  description: string;
}

export const CATEGORIES: DiscussionCategory[] = [
  { id: 'general', label: 'General', description: 'Anything about hackathons, building and college tech life.' },
  { id: 'hackathon-qa', label: 'Hackathon Q&A', description: 'Ask about a specific event: rules, level, travel and prizes.' },
  { id: 'team-up', label: 'Team up', description: 'Find teammates, or a team that needs your skills.' },
  { id: 'feedback', label: 'Project feedback', description: 'Share what you built and get honest feedback.' },
  { id: 'resources', label: 'Resources', description: 'Free APIs, credits, templates and ways to find events.' },
  { id: 'city-talk', label: 'City talk', description: 'Meetups, travel and hackathons in your city.' },
];

export interface Reply {
  id: string;
  /** A handle from PEOPLE. */
  authorHandle: string;
  body: string;
  hoursAgo: number;
  votes: number;
}

export interface Thread {
  id: string;
  title: string;
  /** Plain text; paragraphs are separated by a blank line. */
  body: string;
  category: CategoryId;
  /** Theme slugs from THEMES and/or free tags. */
  tags: string[];
  /** A handle from PEOPLE. */
  authorHandle: string;
  /** City slug from CITIES. */
  city?: string;
  /** Slug of the listing this is about. */
  hackathonSlug?: string;
  hoursAgo: number;
  votes: number;
  pinned?: boolean;
  replies: Reply[];
}

const text = (...paragraphs: string[]) => paragraphs.join('\n\n');

export const THREADS: Thread[] = [
  {
    id: 'sleep-schedule-tips-for-a-36-hour-hackathon',
    title: 'Sleep schedule tips for a 36-hour hackathon',
    body: text(
      'My next hackathon is 36 hours. Last time I stayed awake the whole time and my pitch was a mess. I could barely talk.',
      'How do you plan sleep at long hackathons? Shifts? Power naps? Is coffee a trap?'
    ),
    category: 'general',
    tags: ['tips', 'offline'],
    authorHandle: 'sneha-kulkarni',
    city: 'pune',
    hoursAgo: 30,
    votes: 64,
    replies: [
      {
        id: 'sleep-schedule-tips-for-a-36-hour-hackathon-r1',
        authorHandle: 'riya-sen',
        body: 'What works for my team: everyone gets one 3-hour sleep block, staggered, so two people are always building. The person pitching sleeps last, so they’re fresh for judging.',
        hoursAgo: 28,
        votes: 33,
      },
      {
        id: 'sleep-schedule-tips-for-a-36-hour-hackathon-r2',
        authorHandle: 'dev-shah',
        body: '20-minute power naps work better than you’d think. Set two alarms. Anything between 30 and 90 minutes and you wake up feeling worse.',
        hoursAgo: 27,
        votes: 19,
      },
      {
        id: 'sleep-schedule-tips-for-a-36-hour-hackathon-r3',
        authorHandle: 'aarav-patil',
        body: 'Freeze features at hour 30. The last six hours are only for bug fixes, the demo video and sleep for whoever pitches.',
        hoursAgo: 20,
        votes: 22,
      },
    ],
  },
  {
    id: 'kolkata-folks-meetup-before-the-next-hackathon',
    title: 'Kolkata folks, anyone up for a meetup before the next hackathon?',
    body: text(
      'I’m going to my next hackathon in person and I’d love to meet people from Kolkata colleges before it. Maybe a chai meetup near College Street, and we form teams there.',
      'I do frontend and UI, and I’m looking for a backend dev.'
    ),
    category: 'city-talk',
    tags: ['meetup', 'teammates'],
    authorHandle: 'riya-sen',
    city: 'kolkata',
    hoursAgo: 18,
    votes: 24,
    replies: [
      {
        id: 'kolkata-folks-meetup-before-the-next-hackathon-r1',
        authorHandle: 'dev-shah',
        body: 'Joining online from Ahmedabad. If you’re okay with a remote teammate, I’m in for backend: Node and Firebase.',
        hoursAgo: 16,
        votes: 7,
      },
      {
        id: 'kolkata-folks-meetup-before-the-next-hackathon-r2',
        authorHandle: 'aarav-patil',
        body: 'We did this in Pune last month and it worked really well. Ask everyone to bring a one-line idea; it makes forming teams much faster.',
        hoursAgo: 14,
        votes: 5,
      },
      {
        id: 'kolkata-folks-meetup-before-the-next-hackathon-r3',
        authorHandle: 'riya-sen',
        body: 'Dev, sending you an invite on Team Finder! Still doing the chai meetup on Saturday for anyone local.',
        hoursAgo: 12,
        votes: 4,
      },
    ],
  },
  {
    id: 'how-do-you-split-work-in-the-first-two-hours',
    title: 'How do you split work in the first two hours?',
    body: text(
      'Every hackathon, my team loses the first two hours arguing about the idea and who does what. By the time we start building, the good mentors are busy.',
      'How do you split the work at the start? Do you fix roles before the event?'
    ),
    category: 'team-up',
    tags: ['teammates', 'tips'],
    authorHandle: 'aarav-patil',
    city: 'pune',
    hoursAgo: 54,
    votes: 41,
    replies: [
      {
        id: 'how-do-you-split-work-in-the-first-two-hours-r1',
        authorHandle: 'sneha-kulkarni',
        body: 'We fix roles before the event: one person owns the demo flow, one the backend, one the pitch. The idea can change; the roles don’t.',
        hoursAgo: 50,
        votes: 18,
      },
      {
        id: 'how-do-you-split-work-in-the-first-two-hours-r2',
        authorHandle: 'riya-sen',
        body: 'Draw the three screens of the demo on paper in the first 30 minutes. Whatever isn’t on paper doesn’t get built.',
        hoursAgo: 47,
        votes: 15,
      },
      {
        id: 'how-do-you-split-work-in-the-first-two-hours-r3',
        authorHandle: 'dev-shah',
        body: 'Set up the repo, deploy a hello-world and share the link in the first hour. It saves you a painful last hour.',
        hoursAgo: 44,
        votes: 12,
      },
    ],
  },
  {
    id: 'fintech-hackathon-travel-or-stay-local',
    title: 'Fintech hackathon as a 3rd year: travel or stay local?',
    body: text(
      'Two fintech hackathons have close dates. One is near home, the other is in Mumbai with more companies around.',
      'Neither is marked beginner-friendly. Which is better for a 3rd year who has built a couple of UPI-style apps?'
    ),
    category: 'hackathon-qa',
    tags: ['fintech', 'travel'],
    authorHandle: 'dev-shah',
    city: 'ahmedabad',
    hoursAgo: 130,
    votes: 22,
    replies: [
      {
        id: 'fintech-hackathon-travel-or-stay-local-r1',
        authorHandle: 'sneha-kulkarni',
        body: 'Go where your whole team can be there in person. Travel and stay eat into build time more than you think.',
        hoursAgo: 125,
        votes: 9,
      },
      {
        id: 'fintech-hackathon-travel-or-stay-local-r2',
        authorHandle: 'aarav-patil',
        body: 'Check who the judges are. If they’re mostly from banks, a working demo of one flow beats five half-built screens.',
        hoursAgo: 120,
        votes: 8,
      },
      {
        id: 'fintech-hackathon-travel-or-stay-local-r3',
        authorHandle: 'dev-shah',
        body: 'Makes sense. Going with the local one then. Will post an update after!',
        hoursAgo: 110,
        votes: 2,
      },
    ],
  },
];

export function threadById(id: string): Thread | undefined {
  return THREADS.find((t) => t.id === id);
}

export function categoryById(id: string): DiscussionCategory | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function isCategoryId(id: string): id is CategoryId {
  return CATEGORIES.some((c) => c.id === id);
}

export function isThemeTag(tag: string): boolean {
  return THEMES.some((t) => t.slug === tag);
}

/** Theme tags show the theme name; free tags show as #tag. */
export function tagLabel(tag: string): string {
  const theme = THEMES.find((t) => t.slug === tag);
  return theme ? theme.name : `#${tag}`;
}

/** First paragraph on one line, for previews and meta descriptions. */
export function excerpt(body: string, max = 160): string {
  const first = body.split(/\n\s*\n/)[0].replace(/\s+/g, ' ').trim();
  return first.length > max ? `${first.slice(0, max - 1).trimEnd()}…` : first;
}
