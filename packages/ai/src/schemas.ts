import { z } from 'zod';
import { THEMES } from '@hackathonfinder/shared';

const THEME_SLUGS = THEMES.map((t) => t.slug) as [string, ...string[]];

/**
 * What the Extractor reads from a page, post caption, forwarded message or poster.
 * Kept flat with nullable fields: structured outputs need every key present, and
 * null is how the model says "not stated".
 */
export const ExtractedEventSchema = z.object({
  isEvent: z.boolean().describe('True only if this describes one specific hackathon-style event students can register for.'),
  title: z.string().describe('Event name, without the year if the year is only decoration.'),
  type: z.enum(['hackathon', 'ideathon', 'coding-contest', 'case-competition', 'build-challenge', 'open-source']),
  tagline: z.string().describe('One short line in our own words, under 70 characters.'),
  organizer: z.string().describe('Who runs it: college, club, company or community. Empty if unknown.'),
  organizerType: z.enum(['college', 'company', 'community', 'government']),
  mode: z.enum(['online', 'offline', 'hybrid']),
  city: z.string().nullable().describe('City of the venue as written (e.g. "Pune", "Bengaluru"). Null for online events.'),
  venue: z.string().nullable().describe('Campus, area or address of the venue. Null if not stated.'),
  country: z.string().describe('Country of the venue, or "Global" for online events open worldwide.'),
  startDate: z.string().nullable().describe('ISO 8601 start, e.g. 2026-11-14T09:00:00+05:30. Null if not stated.'),
  endDate: z.string().nullable().describe('ISO 8601 end. Null if not stated.'),
  registrationDeadline: z.string().nullable().describe('ISO 8601 registration deadline. Null if not stated.'),
  teamMin: z.number().int().nullable(),
  teamMax: z.number().int().nullable(),
  eligibility: z.array(z.enum(['students', 'college-only', 'professionals', 'women-only', 'open-to-all'])),
  fee: z.number().nullable().describe('Entry fee per team in INR; 0 if free; null if not stated.'),
  prizePool: z.number().nullable().describe('Total prize money as a number (no commas). Null if not stated.'),
  prizeCurrency: z.enum(['INR', 'USD']),
  prizes: z.array(z.string()).describe('Prize lines, e.g. "Winner: ₹50,000". Max 6.'),
  perks: z.array(z.string()).describe('Non-cash perks, e.g. "Food and stay", "Cloud credits". Max 6.'),
  themes: z.array(z.enum(THEME_SLUGS)).describe('1 to 3 best-fitting themes.'),
  beginnerFriendly: z.boolean(),
  registrationUrl: z.string().nullable().describe('Official registration link if one is given. Null if not stated.'),
  summary: z.string().describe('2–3 plain sentences for students, written in our own words. Never copy the original text.'),
  confidence: z.number().describe('0 to 1: how complete and certain these details are.'),
  missing: z.array(z.string()).describe('Names of important fields that were not stated (e.g. "registrationDeadline").'),
});

export type ExtractedEvent = z.infer<typeof ExtractedEventSchema>;

/** Plain-English search turned into Explore filters. Mirrors the web app's Filters. */
export const SearchFiltersSchema = z.object({
  q: z.string().describe('Leftover keywords that are not covered by any filter. Empty string if none.'),
  city: z.string().describe('City slug, "online", or "" for anywhere.'),
  modes: z.array(z.enum(['online', 'offline', 'hybrid'])),
  types: z.array(z.enum(['hackathon', 'ideathon', 'coding-contest', 'case-competition', 'build-challenge', 'open-source'])),
  themes: z.array(z.enum(THEME_SLUGS)),
  status: z.enum(['open', 'closing-soon', 'in-progress', 'all']),
  fee: z.enum(['any', 'free', 'paid']),
  team: z.enum(['any', 'solo', 'team']),
  eligibility: z.enum(['', 'students', 'professionals', 'women-only']),
  beginner: z.boolean(),
  minPrize: z.number().describe('Minimum prize in INR: 0, 50000, 100000 or 200000.'),
  within: z.enum(['', 'week', 'month']).describe('Registration deadline within this period.'),
  km: z.number().describe('Max distance in km for in-person events: 0 (any), 10, 25, 50 or 150.'),
  sort: z.enum(['deadline', 'nearest', 'newest', 'prize', 'start']),
  understood: z.array(z.string()).describe('Short human labels for each filter applied, e.g. "Free", "AI / ML", "Pune".'),
});

export type SearchFilters = z.infer<typeof SearchFiltersSchema>;
