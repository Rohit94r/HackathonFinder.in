export type EventType =
  | 'hackathon'
  | 'ideathon'
  | 'coding-contest'
  | 'case-competition'
  | 'build-challenge'
  | 'open-source';

export type Mode = 'online' | 'offline' | 'hybrid';

export type Status =
  | 'open'
  | 'closing-soon'
  | 'registration-closed'
  | 'in-progress'
  | 'completed';

export type Eligibility = 'students' | 'college-only' | 'professionals' | 'women-only' | 'open-to-all';

export type OrganizerType = 'college' | 'company' | 'community' | 'government';

export type ThemeSlug =
  | 'ai-ml'
  | 'web-dev'
  | 'web3'
  | 'fintech'
  | 'healthtech'
  | 'edtech'
  | 'climate'
  | 'social-impact'
  | 'iot'
  | 'smart-cities'
  | 'cybersecurity'
  | 'gaming'
  | 'open-innovation';

export type SourceKind = 'platform' | 'search' | 'social' | 'events' | 'college' | 'community' | 'people';

export type Currency = 'INR' | 'USD';

export interface Hackathon {
  slug: string;
  title: string;
  tagline: string;
  type: EventType;
  organizer: string;
  organizerType: OrganizerType;
  mode: Mode;
  /** City slug; undefined for online events. */
  city?: string;
  venue?: string;
  country: string;
  /** ISO timestamps. */
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  addedAt: string;
  lastChecked: string;
  teamMin: number;
  teamMax: number;
  eligibility: Eligibility[];
  /** Entry fee in INR; 0 means free. */
  fee: number;
  prizePool: number;
  prizeCurrency: Currency;
  prizes: string[];
  perks: string[];
  themes: ThemeSlug[];
  beginnerFriendly: boolean;
  featured: boolean;
  verified: boolean;
  registrationUrl: string;
  sources: string[];
  summary: string;
}

export interface Theme {
  slug: ThemeSlug;
  name: string;
  description: string;
}

export interface City {
  slug: string;
  name: string;
  state: string;
  launch: boolean;
}

export interface Source {
  slug: string;
  name: string;
  kind: SourceKind;
  url: string;
}

export interface Agent {
  id: string;
  name: string;
  job: string;
}
