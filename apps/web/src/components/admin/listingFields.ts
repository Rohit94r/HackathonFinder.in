import { z } from 'zod';
import {
  CITIES,
  ELIGIBILITY,
  EVENT_TYPES,
  THEMES,
  type Currency,
  type Eligibility,
  type EventType,
  type Mode,
  type OrganizerType,
  type ThemeSlug,
} from '@hackathonfinder/shared';

// Shared by the admin editor (browser) and the admin API (server), so both agree on
// what a valid listing is. No server imports here.

const IST_OFFSET_MS = 330 * 60 * 1000;

/** A Date (or ISO string) as "2026-11-14T09:00" in India time, for datetime-local inputs. */
export function toIstInput(value: Date | string | null | undefined): string {
  if (!value) return '';
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return '';
  return new Date(t + IST_OFFSET_MS).toISOString().slice(0, 16);
}

/** "2026-11-14T09:00" or "2026-11-14" read as India time, or any ISO string with an offset. Null when invalid. */
export function fromIstInput(value: string): Date | null {
  const s = value.trim();
  const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)
    ? `${s}:00+05:30`
    : /^\d{4}-\d{2}-\d{2}$/.test(s)
      ? `${s}T00:00:00+05:30`
      : s;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : new Date(t);
}

export function isHttpUrl(value: string): boolean {
  try {
    return /^https?:$/.test(new URL(value).protocol);
  } catch {
    return false;
  }
}

export const ORGANIZER_TYPES: { value: OrganizerType; label: string }[] = [
  { value: 'college', label: 'College or club' },
  { value: 'company', label: 'Company' },
  { value: 'community', label: 'Community' },
  { value: 'government', label: 'Government' },
];

const EVENT_TYPE_VALUES = EVENT_TYPES.map((t) => t.value) as [EventType, ...EventType[]];
const ELIGIBILITY_VALUES = ELIGIBILITY.map((e) => e.value) as [Eligibility, ...Eligibility[]];
const THEME_VALUES = THEMES.map((t) => t.slug) as [ThemeSlug, ...ThemeSlug[]];
const CITY_SLUGS = new Set(CITIES.map((c) => c.slug));

const istDate = z
  .string()
  .trim()
  .min(1, 'Add a date.')
  .transform((v, ctx) => {
    const d = fromIstInput(v);
    if (!d) {
      ctx.addIssue({ code: 'custom', message: 'That isn’t a valid date.' });
      return z.NEVER;
    }
    return d;
  });

const imageRef = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v === '' || v.startsWith('/uploads/') || isHttpUrl(v), 'Use a full image link, or leave it empty.');

const lines = z.array(z.string().trim().min(1).max(160)).max(10);

/** One listing as the admin editor sends it. Dates are India time ("2026-11-14T09:00"). */
export const ListingInput = z
  .object({
    title: z.string().trim().min(2, 'Add the event name.').max(140),
    tagline: z.string().trim().max(200).default(''),
    type: z.enum(EVENT_TYPE_VALUES),
    organizer: z.string().trim().max(140).default(''),
    organizerType: z.enum(['college', 'company', 'community', 'government']),
    mode: z.enum(['online', 'offline', 'hybrid']),
    /** City slug from CITIES, "other" (with cityName), or empty for online events. */
    city: z.string().trim().max(60).default(''),
    cityName: z.string().trim().max(60).default(''),
    venue: z.string().trim().max(200).default(''),
    country: z.string().trim().min(2).max(60).default('India'),
    lat: z.number().min(-90).max(90).nullable().default(null),
    lng: z.number().min(-180).max(180).nullable().default(null),
    startDate: istDate,
    endDate: istDate,
    registrationDeadline: istDate,
    teamMin: z.number().int().min(1).max(20),
    teamMax: z.number().int().min(1).max(50),
    eligibility: z.array(z.enum(ELIGIBILITY_VALUES)).min(1, 'Pick who can join.').max(5),
    fee: z.number().min(0).max(1_000_000),
    prizePool: z.number().min(0).max(1_000_000_000),
    prizeCurrency: z.enum(['INR', 'USD']),
    prizes: lines.default([]),
    perks: lines.default([]),
    themes: z.array(z.enum(THEME_VALUES)).min(1, 'Pick at least one theme.').max(5),
    beginnerFriendly: z.boolean().default(false),
    featured: z.boolean().default(false),
    verified: z.boolean().default(false),
    registrationUrl: z.string().trim().max(2000).refine(isHttpUrl, 'Use the full registration link, starting with https://'),
    summary: z.string().trim().max(1200).default(''),
    imageUrl: imageRef.default(''),
    logoUrl: imageRef.default(''),
  })
  .superRefine((v, ctx) => {
    const issue = (path: string, message: string) => ctx.addIssue({ code: 'custom', path: [path], message });
    if (v.endDate < v.startDate) issue('endDate', 'The end must be after the start.');
    if (v.registrationDeadline > v.endDate) issue('registrationDeadline', 'The deadline must be before the event ends.');
    if (v.teamMax < v.teamMin) issue('teamMax', 'Max team size must be at least the minimum.');
    if (v.mode !== 'online') {
      if (!v.city) issue('city', 'Pick the city for an in-person event.');
      else if (v.city === 'other' && !v.cityName) issue('cityName', 'Type the city name.');
      else if (v.city !== 'other' && !CITY_SLUGS.has(v.city)) issue('city', 'Pick a city from the list, or “Other city”.');
    }
    if ((v.lat === null) !== (v.lng === null)) issue('lat', 'Add both latitude and longitude, or neither.');
  });

export type ListingInputValues = z.output<typeof ListingInput>;

/** The editor's state: plain strings for inputs, converted with formToPayload before sending. */
export interface ListingFormValues {
  title: string;
  tagline: string;
  type: EventType;
  organizer: string;
  organizerType: OrganizerType;
  mode: Mode;
  city: string;
  cityName: string;
  venue: string;
  country: string;
  lat: string;
  lng: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  teamMin: string;
  teamMax: string;
  eligibility: Eligibility[];
  fee: string;
  prizePool: string;
  prizeCurrency: Currency;
  /** One per line. */
  prizes: string;
  perks: string;
  themes: ThemeSlug[];
  beginnerFriendly: boolean;
  featured: boolean;
  verified: boolean;
  registrationUrl: string;
  summary: string;
  imageUrl: string;
  logoUrl: string;
}

export const EMPTY_LISTING_FORM: ListingFormValues = {
  title: '',
  tagline: '',
  type: 'hackathon',
  organizer: '',
  organizerType: 'community',
  mode: 'offline',
  city: '',
  cityName: '',
  venue: '',
  country: 'India',
  lat: '',
  lng: '',
  startDate: '',
  endDate: '',
  registrationDeadline: '',
  teamMin: '1',
  teamMax: '4',
  eligibility: ['students'],
  fee: '0',
  prizePool: '0',
  prizeCurrency: 'INR',
  prizes: '',
  perks: '',
  themes: [],
  beginnerFriendly: false,
  featured: false,
  verified: false,
  registrationUrl: '',
  summary: '',
  imageUrl: '',
  logoUrl: '',
};

const num = (s: string, fallback = 0) => {
  const n = Number(String(s).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : fallback;
};

/** Editor state → the JSON the admin API validates with ListingInput. */
export function formToPayload(v: ListingFormValues) {
  const lat = v.lat.trim() === '' ? null : num(v.lat, NaN);
  const lng = v.lng.trim() === '' ? null : num(v.lng, NaN);
  const split = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean);
  return {
    ...v,
    city: v.mode === 'online' ? '' : v.city,
    cityName: v.city === 'other' ? v.cityName : '',
    lat: Number.isNaN(lat as number) ? null : lat,
    lng: Number.isNaN(lng as number) ? null : lng,
    teamMin: Math.round(num(v.teamMin, 1)),
    teamMax: Math.round(num(v.teamMax, 4)),
    fee: num(v.fee),
    prizePool: num(v.prizePool),
    prizes: split(v.prizes),
    perks: split(v.perks),
  };
}

/** Splits a stored city slug into the editor's city select and "other city" text. */
export function cityForForm(slug: string | null | undefined): { city: string; cityName: string } {
  if (!slug) return { city: '', cityName: '' };
  if (CITY_SLUGS.has(slug)) return { city: slug, cityName: '' };
  return { city: 'other', cityName: slug.replace(/-/g, ' ') };
}

/** What the Extractor (or the organizer form) produced, stored on a submission as `extracted`. */
export interface Draft {
  method: 'ai' | 'rules' | 'form';
  model?: string;
  isEvent?: boolean | null;
  title?: string;
  tagline?: string;
  type?: EventType;
  organizer?: string;
  organizerType?: OrganizerType;
  mode?: Mode;
  /** City slug when it is one of ours. */
  city?: string | null;
  /** The city as written, when it isn't one of ours. */
  cityName?: string;
  venue?: string;
  country?: string;
  startDate?: string | null;
  endDate?: string | null;
  registrationDeadline?: string | null;
  teamMin?: number | null;
  teamMax?: number | null;
  eligibility?: Eligibility[];
  fee?: number | null;
  prizePool?: number | null;
  prizeCurrency?: Currency;
  prizes?: string[];
  perks?: string[];
  themes?: ThemeSlug[];
  beginnerFriendly?: boolean;
  registrationUrl?: string | null;
  summary?: string;
  confidence?: number;
  missing?: string[];
  /** Why AI wasn't used, or what went wrong. */
  note?: string;
  /** Set when the link is already a listing (organizer submissions are kept so details can be merged). */
  duplicateOf?: { id: string; slug: string; title: string; state: string } | null;
  // Stored as Mixed on the submission, so it reads back as a plain record.
  [key: string]: unknown;
}

/** A submission's draft → editor state, with the poster as the image when there is one. */
export function draftToForm(d: Partial<Draft> | null | undefined, extra: { imageUrl?: string; url?: string } = {}): ListingFormValues {
  const draft = d ?? {};
  const city = draft.city ? cityForForm(draft.city) : draft.cityName ? { city: 'other', cityName: draft.cityName } : { city: '', cityName: '' };
  const mode = draft.mode ?? (city.city ? 'offline' : 'online');
  return {
    ...EMPTY_LISTING_FORM,
    title: draft.title ?? '',
    tagline: draft.tagline ?? '',
    type: draft.type ?? 'hackathon',
    organizer: draft.organizer ?? '',
    organizerType: draft.organizerType ?? 'community',
    mode,
    ...(mode === 'online' ? { city: '', cityName: '' } : city),
    venue: draft.venue ?? '',
    country: draft.country && draft.country !== 'Global' ? draft.country : 'India',
    startDate: toIstInput(draft.startDate),
    endDate: toIstInput(draft.endDate),
    registrationDeadline: toIstInput(draft.registrationDeadline),
    teamMin: String(draft.teamMin ?? 1),
    teamMax: String(draft.teamMax ?? 4),
    eligibility: draft.eligibility?.length ? draft.eligibility : ['students'],
    fee: String(draft.fee ?? 0),
    prizePool: String(draft.prizePool ?? 0),
    prizeCurrency: draft.prizeCurrency ?? 'INR',
    prizes: (draft.prizes ?? []).join('\n'),
    perks: (draft.perks ?? []).join('\n'),
    themes: draft.themes ?? [],
    beginnerFriendly: Boolean(draft.beginnerFriendly),
    registrationUrl: draft.registrationUrl || extra.url || '',
    summary: draft.summary ?? '',
    imageUrl: extra.imageUrl ?? '',
  };
}
