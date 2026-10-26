// Result labels, the Person shape and avatar helpers shared by profiles, teams and wins.

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

export function isPhotoUrl(image?: string | null): image is string {
  return Boolean(image && (/^https:\/\//i.test(image) || /^\/(photos|uploads)\/[\w./-]+$/.test(image) || image.startsWith('blob:')));
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

// Brand reds and charcoals only, all dark enough for white initials.
const AVATAR_COLORS = ['bg-brand-600', 'bg-brand-800', 'bg-[#3d3a44]', 'bg-brand-700', 'bg-[#2f2e35]', 'bg-brand-900', 'bg-[#4b4954]'];

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
