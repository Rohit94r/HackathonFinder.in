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
  /** Display name for a city outside our catalog (e.g. "Bhopal"). */
  cityName?: string;
  venue?: string;
  /** Venue coordinates for offline and hybrid events; the city centre is used when missing. */
  lat?: number;
  lng?: number;
  country: string;
  /** ISO timestamps. */
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  addedAt: string;
  lastChecked: string;
  teamMin: number;
  teamMax: number;
  /** False when the source never stated a team size (teamMin/teamMax are then only defaults). */
  teamSizeKnown?: boolean;
  eligibility: Eligibility[];
  /** Entry fee in INR; 0 means free. */
  fee: number;
  prizePool: number;
  prizeCurrency: Currency;
  prizes: string[];
  /** The prize text exactly as the source stated it, kept for admin checks. */
  prizeRaw?: string;
  /** True when the stated figure is too large to trust; it is hidden from visitors and totals. */
  prizeOutlier?: boolean;
  perks: string[];
  themes: ThemeSlug[];
  beginnerFriendly: boolean;
  featured: boolean;
  verified: boolean;
  registrationUrl: string;
  /** 'qr' when the organizer shares a QR code on the poster instead of a link. */
  registrationVia?: 'link' | 'qr';
  sources: string[];
  summary: string;
  /** Banner or poster from the source, when we have one; cards fall back to an event photo. */
  imageUrl?: string;
  logoUrl?: string;
  /** One of the built-in preview listings rather than a real event. */
  sample?: boolean;
  /** Page views recorded on HackathonFinder, used for "trending" ordering. */
  views?: number;
}

export interface Theme {
  slug: ThemeSlug;
  name: string;
  description: string;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface City extends LatLng {
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
