import type { Currency, Eligibility, EventType, Mode, OrganizerType, ThemeSlug } from '@hackathonfinder/shared';

/** A listing being assembled by the pipeline. Fields stay undefined until something states them. */
export interface Draft {
  title: string;
  tagline: string;
  type: EventType;
  organizer: string;
  organizerType: OrganizerType;
  mode?: Mode;
  /** City slug (one of ours, or a slug of the stated city). */
  city?: string;
  /** Display name for a city outside our catalog ("Bhopal"); empty for catalog cities. */
  cityName?: string;
  /** State (or region abroad). */
  region?: string;
  venue?: string;
  /** See CandidateData.remoteOk. */
  remoteOk?: boolean;
  /** For a hybrid event abroad listed online: where its venue is, for the summary. */
  basedIn?: string;
  hybridOnline?: boolean;
  country: string;
  /** Venue point; `exact` false when it is only the city centre. */
  point?: { lat: number; lng: number; exact: boolean };
  startDate?: Date;
  endDate?: Date;
  registrationDeadline?: Date;
  teamMin: number;
  teamMax: number;
  /** False when nothing stated a team size (teamMin/teamMax are then the 1–4 default). */
  teamSizeKnown: boolean;
  eligibility: Eligibility[];
  fee: number;
  prizePool: number;
  prizeCurrency: Currency;
  prizes: string[];
  perks: string[];
  themes: ThemeSlug[];
  beginnerFriendly: boolean;
  registrationUrl?: string;
  /** "qr" when registration is by scanning the poster's QR code (registrationUrl is what it points to, or the post). */
  registrationVia: 'link' | 'qr';
  /** Our own words (AI or template). Never the organizer's text. */
  summary: string;
  imageUrl?: string;
  /** The banner's original URL when imageUrl is our stored copy. */
  sourceImageUrl?: string;
  logoUrl?: string;
  /** SOURCES slug shown on the listing. */
  listingSource: string;
  confidence: number;
  /** Problems for the review queue. Any flag keeps a new listing out of "live". */
  flags: string[];
  /** What the pipeline did and assumed, stored on the RawItem. */
  notes: string[];
  usedAi: boolean;
}

export const KEY_FIELDS = ['title', 'mode', 'startDate', 'endDate', 'registrationDeadline', 'registrationUrl'] as const;

export function missingKeyFields(d: Draft): string[] {
  return KEY_FIELDS.filter((k) => !d[k]);
}
