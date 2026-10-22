import type { ThemeSlug } from '@hackathonfinder/shared';
import type { Person } from '@/data/people';
import type { MyProfile } from '@/lib/useProfile';
import { joinedLabel, type ProfileUser } from './profileTypes';

/** What the profile card shows, for sample students and the student's own profile alike. */
export interface ProfileInfo {
  name: string;
  handle: string;
  /** e.g. "3rd year, Computer Engineering" */
  about: string;
  college: string;
  /** City slug from CITIES. */
  city: string;
  bio: string;
  skills: string[];
  github?: string;
  linkedin?: string;
  lookingForTeam: boolean;
  /** e.g. "Joined Mar 2025" */
  joined?: string;
  /** Photo from Google or GitHub; initials otherwise. */
  image?: string;
}

export function monthsLabel(months: number): string {
  if (months <= 0) return 'This month';
  if (months === 1) return 'Last month';
  if (months < 12) return `${months} months ago`;
  const years = Math.floor(months / 12);
  return years === 1 ? 'A year ago' : `${years} years ago`;
}

export function fromPerson(p: Person): ProfileInfo {
  const joined = p.joinedMonthsAgo <= 0 ? 'Joined this month' : `Joined ${monthsLabel(p.joinedMonthsAgo).toLowerCase()}`;
  return {
    name: p.name,
    handle: p.handle,
    about: p.about,
    college: p.college,
    city: p.city,
    bio: p.bio,
    skills: p.skills,
    github: p.github,
    linkedin: p.linkedin,
    lookingForTeam: p.lookingForTeam,
    joined,
  };
}

export function fromMyProfile(p: MyProfile): ProfileInfo {
  return { ...p, github: p.github || undefined, linkedin: p.linkedin || undefined };
}

/** A student from the API (public profile, or the signed-in student's own account). */
export function fromUser(u: ProfileUser): ProfileInfo {
  return {
    name: u.name,
    handle: u.handle,
    about: u.about,
    college: u.college,
    city: u.city,
    bio: u.bio,
    skills: u.skills,
    github: u.github || undefined,
    linkedin: u.linkedin || undefined,
    lookingForTeam: u.lookingForTeam,
    joined: joinedLabel(u.joinedAt),
    image: u.image,
  };
}

// The banner picks its colours from the student's first skill.
const SKILL_THEMES: Record<string, ThemeSlug> = {
  Frontend: 'web-dev',
  Backend: 'web-dev',
  'Full stack': 'web-dev',
  Mobile: 'web-dev',
  'ML / AI': 'ai-ml',
  Data: 'smart-cities',
  'UI/UX design': 'social-impact',
  'Hardware / IoT': 'iot',
  Blockchain: 'web3',
  Pitching: 'open-innovation',
  Product: 'edtech',
  'Game dev': 'gaming',
};

export function skillTheme(skills: string[]): ThemeSlug {
  return SKILL_THEMES[skills[0]] ?? 'open-innovation';
}
