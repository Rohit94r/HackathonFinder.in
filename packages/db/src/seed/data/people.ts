// The four sample students shown in the preview (profiles, Team Finder, discussions and
// winning stories all link to them). They are made up and marked "Sample" everywhere, and
// they can't sign in, get invites or chat. Real profiles come with student accounts.

export type ResultKind = 'winner' | 'runner-up' | 'finalist' | 'participant';

export const RESULT_LABELS: Record<ResultKind, string> = {
  winner: 'Winner',
  'runner-up': 'Runner-up',
  finalist: 'Finalist',
  participant: 'Participant',
};

export interface HackathonRecord {
  event: string;
  /** Set when the event is one of our listings. */
  hackathonSlug?: string;
  result: ResultKind;
  project: string;
  /** How long ago it happened, so the sample stays current. */
  monthsAgo: number;
}

export interface Person {
  /** URL name, used at /u/[handle]. */
  handle: string;
  name: string;
  /** Photo in apps/web/public (credits in public/photos/people/CREDITS.txt). */
  image?: string;
  /** e.g. "3rd year, Computer Engineering" or "Working, 2 years" */
  about: string;
  college: string;
  /** City slug from CITIES. */
  city: string;
  skills: string[];
  bio: string;
  github?: string;
  linkedin?: string;
  /** Months since they joined HackathonFinder. */
  joinedMonthsAgo: number;
  lookingForTeam: boolean;
  record: HackathonRecord[];
}

export const PEOPLE: Person[] = [
  {
    handle: 'aarav-patil',
    name: 'Aarav Patil',
    image: '/photos/people/aarav-patil.jpg',
    about: '3rd year, Computer Engineering',
    college: 'Deccan Institute of Technology, Pune',
    city: 'pune',
    skills: ['Backend', 'ML / AI'],
    bio: 'I build backends and small ML models. Looking for designers who care about details.',
    github: 'https://github.com',
    linkedin: 'https://www.linkedin.com',
    joinedMonthsAgo: 14,
    lookingForTeam: true,
    record: [
      { event: 'Monsoon Hack 2026', result: 'finalist', project: 'FloodWatch', monthsAgo: 2 },
      { event: 'Deccan Hack 2025', result: 'winner', project: 'NoteQuiz AI', monthsAgo: 6 },
      { event: 'Pune Open Build Night', result: 'participant', project: 'BusBuddy', monthsAgo: 10 },
    ],
  },
  {
    handle: 'sneha-kulkarni',
    name: 'Sneha Kulkarni',
    image: '/photos/people/sneha-kulkarni.jpg',
    about: '2nd year, Information Technology',
    college: 'Sahyadri College of Engineering, Pune',
    city: 'pune',
    skills: ['UI/UX design', 'Pitching', 'Frontend'],
    bio: 'Designer who pitches. I like apps that make cities safer for women.',
    linkedin: 'https://www.linkedin.com',
    joinedMonthsAgo: 8,
    lookingForTeam: true,
    record: [
      { event: 'Design Sprint Pune', result: 'runner-up', project: 'SafeRoute', monthsAgo: 3 },
      { event: 'Ideathon West 2025', result: 'participant', project: 'Canteen Queue', monthsAgo: 7 },
    ],
  },
  {
    handle: 'dev-shah',
    name: 'Dev Shah',
    image: '/photos/people/dev-shah.jpg',
    about: '3rd year, Information Technology',
    college: 'Sabarmati Institute of Technology, Ahmedabad',
    city: 'ahmedabad',
    skills: ['Mobile', 'Backend'],
    bio: 'Flutter and Firebase. Building money tools for small shops.',
    github: 'https://github.com',
    joinedMonthsAgo: 7,
    lookingForTeam: true,
    record: [
      { event: 'Gujarat Fintech Day', result: 'runner-up', project: 'DukaanPay', monthsAgo: 2 },
      { event: 'Mobile Dev Jam 2025', result: 'participant', project: 'ChaiCount', monthsAgo: 6 },
    ],
  },
  {
    handle: 'riya-sen',
    name: 'Riya Sen',
    image: '/photos/people/riya-sen.jpg',
    about: '2nd year, Computer Science',
    college: 'Hooghly Institute of Technology, Kolkata',
    city: 'kolkata',
    skills: ['Frontend', 'UI/UX design'],
    bio: 'Pixel-pusher and Tailwind fan. I make demos look finished.',
    linkedin: 'https://www.linkedin.com',
    joinedMonthsAgo: 4,
    lookingForTeam: true,
    record: [{ event: 'Bengal Build Weekend', result: 'participant', project: 'BookSwap', monthsAgo: 3 }],
  },
];

export function personByHandle(handle: string): Person | undefined {
  return PEOPLE.find((p) => p.handle === handle);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const AVATAR_COLORS = ['bg-brand-600', 'bg-cyan-600', 'bg-pink-500', 'bg-amber-500', 'bg-indigo-600', 'bg-fuchsia-600', 'bg-emerald-600'];

/** A stable avatar colour per name (full class strings so Tailwind keeps them). */
export function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function countResults(record: HackathonRecord[]) {
  return {
    hackathons: record.length,
    wins: record.filter((r) => r.result === 'winner').length,
    podiums: record.filter((r) => r.result === 'winner' || r.result === 'runner-up').length,
    finals: record.filter((r) => r.result !== 'participant').length,
  };
}
