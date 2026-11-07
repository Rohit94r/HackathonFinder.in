import type { Hackathon } from '@hackathonfinder/shared';
import type { IHackathon } from '../models/Hackathon';
import type { IUser } from '../models/User';

type Lean<T> = Omit<T, never> & { _id: unknown };

const iso = (d: Date | string | undefined | null) => (d ? new Date(d).toISOString() : '');

/** A stored listing in the shape the website and agents share. */
export function toHackathon(doc: Lean<IHackathon>): Hackathon {
  const [lng, lat] = doc.location?.coordinates ?? [];
  return {
    slug: doc.slug,
    title: doc.title,
    tagline: doc.tagline ?? '',
    type: doc.type,
    organizer: doc.organizer ?? '',
    organizerType: doc.organizerType,
    mode: doc.mode,
    city: doc.city || undefined,
    cityName: doc.cityName || undefined,
    venue: doc.venue || undefined,
    lat: typeof lat === 'number' ? lat : undefined,
    lng: typeof lng === 'number' ? lng : undefined,
    country: doc.country ?? 'India',
    startDate: iso(doc.startDate),
    endDate: iso(doc.endDate),
    registrationDeadline: iso(doc.registrationDeadline),
    addedAt: iso(doc.createdAt),
    lastChecked: iso(doc.lastChecked ?? doc.updatedAt),
    teamMin: doc.teamMin,
    teamMax: doc.teamMax,
    // Only false is meaningful: older and hand-made listings state their team size.
    teamSizeKnown: (doc as { teamSizeKnown?: boolean }).teamSizeKnown === false ? false : undefined,
    eligibility: doc.eligibility ?? [],
    fee: doc.fee ?? 0,
    prizePool: doc.prizePool ?? 0,
    prizeCurrency: doc.prizeCurrency ?? 'INR',
    prizes: doc.prizes ?? [],
    prizeRaw: doc.prizeRaw || undefined,
    prizeOutlier: doc.prizeOutlier || undefined,
    perks: doc.perks ?? [],
    themes: doc.themes ?? [],
    beginnerFriendly: Boolean(doc.beginnerFriendly),
    featured: Boolean(doc.featured),
    verified: Boolean(doc.verified),
    views: doc.stats?.views ?? 0,
    registrationUrl: doc.registrationUrl,
    registrationVia: doc.registrationVia === 'qr' ? 'qr' : undefined,
    sources: doc.sources ?? [],
    summary: doc.summary ?? '',
    imageUrl: doc.imageUrl || undefined,
    logoUrl: doc.logoUrl || undefined,
    sample: doc.flags?.includes('sample') || undefined,
  };
}

/** What anyone may see about a student. Never includes email, password or providers. */
export interface PublicUser {
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
  role: IUser['role'];
  isSample: boolean;
  joinedAt: string;
}

export function toPublicUser(doc: Lean<IUser>): PublicUser {
  return {
    id: String(doc._id),
    handle: doc.handle,
    name: doc.name,
    image: doc.image || undefined,
    about: doc.about ?? '',
    college: doc.college ?? '',
    city: doc.city ?? '',
    skills: doc.skills ?? [],
    bio: doc.bio ?? '',
    github: doc.github ?? '',
    linkedin: doc.linkedin ?? '',
    lookingForTeam: Boolean(doc.lookingForTeam),
    role: doc.role ?? 'student',
    isSample: Boolean(doc.isSample),
    joinedAt: iso(doc.joinedAt ?? doc.createdAt),
  };
}

/** Author line shown on posts: small and safe to send with every thread, story or team post. */
export interface AuthorSummary {
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

export function toAuthor(doc: Lean<IUser> | null | undefined): AuthorSummary {
  if (!doc) return { id: '', handle: 'deleted', name: 'Former student', about: '', college: '', city: '', skills: [], isSample: false };
  return {
    id: String(doc._id),
    handle: doc.handle,
    name: doc.name,
    image: doc.image || undefined,
    about: doc.about ?? '',
    college: doc.college ?? '',
    city: doc.city ?? '',
    skills: doc.skills ?? [],
    isSample: Boolean(doc.isSample),
  };
}

export const AUTHOR_FIELDS = 'handle name image about college city skills isSample';
