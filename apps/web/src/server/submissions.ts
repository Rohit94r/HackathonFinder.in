import 'server-only';
import type { NextRequest } from 'next/server';
import { z, type ZodType } from 'zod';
import { CITIES, ELIGIBILITY, EVENT_TYPES, THEMES, type Eligibility, type EventType, type ThemeSlug } from '@hackathonfinder/shared';
import { Hackathon, Submission, type ISubmission } from '@hackathonfinder/db';
import {
  cityFromText,
  extractEvent,
  inferBeginnerFriendly,
  inferEligibility,
  inferEventType,
  inferMode,
  inferThemes,
  isAiEnabled,
  parseMoney,
  parseTeamSize,
  templateSummary,
  type ExtractImage,
} from '@hackathonfinder/ai';
import { isHttpUrl, type Draft } from '@/components/admin/listingFields';
import { badRequest, type Ctx } from './api';
import { readUpload, storeImage } from './storage';

export const SEEN_ON = ['instagram', 'whatsapp', 'facebook', 'linkedin', 'website', 'other'] as const;

const DAY = 24 * 60 * 60 * 1000;
const AI_TIMEOUT_MS = 25_000;

// ---------- Validation ----------

const blank = (v: unknown) => (v === null || (typeof v === 'string' && v.trim() === '') ? undefined : v);
const optional = <T extends z.ZodType>(schema: T) => z.preprocess(blank, schema.optional());

const HttpUrl = z.string().trim().max(2000).refine(isHttpUrl, 'Paste the full link, starting with https://');
const Email = z
  .string()
  .trim()
  .toLowerCase()
  .max(200)
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Check the email address.');
const DateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date.');

const QuickBody = z.object({
  kind: z.literal('quick'),
  seenOn: optional(z.enum(SEEN_ON)),
  url: optional(HttpUrl),
  message: optional(z.string().trim().max(5000)),
  /** For clients that host the poster themselves; the site form uploads a file instead. */
  posterUrl: optional(HttpUrl),
  email: optional(Email),
});

const OrganizerBody = z
  .object({
    kind: z.literal('organizer'),
    title: z.string().trim().min(2, 'Add the event name.').max(140),
    organizer: z.string().trim().min(2, 'Add who is running it.').max(140),
    email: Email,
    type: z.enum(EVENT_TYPES.map((t) => t.value) as [EventType, ...EventType[]]),
    mode: z.enum(['online', 'offline', 'hybrid']),
    city: z.string().trim().max(60).default(''),
    cityName: z.string().trim().max(60).default(''),
    venue: z.string().trim().max(200).default(''),
    start: DateOnly,
    end: DateOnly,
    deadline: DateOnly,
    teamMin: z.coerce.number().int().min(1).max(20),
    teamMax: z.coerce.number().int().min(1).max(50),
    fee: z.coerce.number().min(0, 'Use 0 for free.').max(1_000_000).default(0),
    prize: z.string().trim().max(200).default(''),
    eligibility: z.enum(ELIGIBILITY.map((e) => e.value) as [Eligibility, ...Eligibility[]]),
    themes: z
      .array(z.enum(THEMES.map((t) => t.slug) as [ThemeSlug, ...ThemeSlug[]]))
      .min(1, 'Pick at least one theme.')
      .max(5, 'Pick up to 5 themes.'),
    url: HttpUrl,
    description: z.string().trim().min(30, 'Tell students a little more (at least 30 characters).').max(2000),
    isOrganizer: z.boolean().default(false),
  })
  .superRefine((v, ctx) => {
    const issue = (path: string, message: string) => ctx.addIssue({ code: 'custom', path: [path], message });
    if (v.end < v.start) issue('end', 'End date must be on or after the start date.');
    if (v.deadline > v.end) issue('deadline', 'Deadline should be before the event ends.');
    if (v.teamMax < v.teamMin) issue('teamMax', 'Max team size must be at least the minimum.');
    if (v.mode !== 'online') {
      if (v.city === 'other') {
        if (!v.cityName) issue('cityName', 'Type the city name.');
      } else if (!CITIES.some((c) => c.slug === v.city)) issue('city', 'Pick the city.');
    }
  });

const ExtensionBody = z.object({
  kind: z.literal('extension'),
  url: HttpUrl,
  title: z.string().trim().max(300).default(''),
  /** Caption, meta description and selected text from the page the student is looking at. */
  text: z.string().max(20_000).default(''),
  imageUrls: z.array(HttpUrl).max(10).default([]),
  seenOn: optional(z.enum(SEEN_ON)),
  note: z.string().trim().max(1000).default(''),
});

export const SubmissionBody = z.discriminatedUnion('kind', [QuickBody, OrganizerBody, ExtensionBody]);
export type SubmissionInput = z.output<typeof SubmissionBody>;

function parseOrThrow<T>(schema: ZodType<T>, raw: unknown): T {
  const parsed = schema.safeParse(raw);
  if (parsed.success) return parsed.data;
  const fields: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.join('.') || '_';
    if (!fields[key]) fields[key] = issue.message;
  }
  throw badRequest('Some details need fixing.', fields);
}

/** Reads JSON (organizer form, extension) or multipart (quick share with a poster file). */
export async function readSubmission(req: NextRequest): Promise<{ body: SubmissionInput; poster: Buffer | null }> {
  const type = req.headers.get('content-type') ?? '';
  if (type.includes('multipart/form-data')) {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      throw badRequest('We couldn’t read that form. Please try again.');
    }
    const raw: Record<string, unknown> = {};
    for (const key of ['kind', 'seenOn', 'url', 'message', 'posterUrl', 'email']) {
      const v = form.get(key);
      if (typeof v === 'string') raw[key] = v;
    }
    raw.kind ??= 'quick';
    if (raw.kind !== 'quick') throw badRequest('Only quick shares can be sent as a form. Send the rest as JSON.');
    const poster = await readUpload(form, 'poster');
    return { body: parseOrThrow(SubmissionBody, raw), poster };
  }
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw badRequest('Send the details as JSON.');
  }
  return { body: parseOrThrow(SubmissionBody, raw), poster: null };
}

// ---------- Links ----------

const TRACKING_PARAMS = /^(utm_\w+|igshid|igsh|fbclid|gclid|dclid|mc_cid|mc_eid|ref_src|si|trk|trackingid|lipi|rcm|_ga)$/i;

/** The link without tracking parameters or #fragment, so the same post matches itself. */
export function cleanUrl(raw: string): string {
  const u = new URL(raw.trim());
  u.hash = '';
  for (const key of [...u.searchParams.keys()]) if (TRACKING_PARAMS.test(key)) u.searchParams.delete(key);
  return u.toString();
}

/** Spellings of the same link (www, http/https, trailing slash) for duplicate checks. */
export function urlVariants(raw: string): string[] {
  const out = new Set<string>([raw.trim()]);
  let clean: URL;
  try {
    clean = new URL(cleanUrl(raw));
  } catch {
    return [...out];
  }
  const host = clean.hostname.toLowerCase();
  const hosts = host.startsWith('www.') ? [host, host.slice(4)] : [host, `www.${host}`];
  for (const h of hosts) {
    for (const protocol of ['https:', 'http:']) {
      const v = new URL(clean.toString());
      v.hostname = h;
      v.protocol = protocol;
      out.add(v.toString());
      const path = v.pathname;
      if (path === '/') {
        if (!v.search) out.add(`${v.origin}`);
      } else {
        v.pathname = path.endsWith('/') ? path.slice(0, -1) : `${path}/`;
        out.add(v.toString());
      }
    }
  }
  return [...out];
}

const HOST_SOURCES: [RegExp, string][] = [
  [/(^|\.)unstop\.com$/, 'unstop'],
  [/(^|\.)devfolio\.co$/, 'devfolio'],
  [/(^|\.)devpost\.com$/, 'devpost'],
  [/(^|\.)mlh\.(io|com)$/, 'mlh'],
  [/(^|\.)hackerearth\.com$/, 'hackerearth'],
  [/(^|\.)hack2skill\.com$/, 'hack2skill'],
  [/(^|\.)dorahacks\.io$/, 'dorahacks'],
  [/(^|\.)lablab\.ai$/, 'lablab'],
  [/(^|\.)kaggle\.com$/, 'kaggle'],
  [/(^|\.)instagram\.com$/, 'instagram'],
  [/(^|\.)linkedin\.com$/, 'linkedin'],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, 'facebook'],
  [/(^|\.)(lu\.ma|luma\.com)$/, 'luma'],
  [/(^|\.)eventbrite\.[a-z.]+$/, 'eventbrite'],
  [/(^|\.)meetup\.com$/, 'meetup'],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, 'whatsapp'],
  [/(^|\.)(discord\.gg|discord\.com|t\.me|telegram\.me)$/, 'communities'],
  [/\.(ac\.in|edu\.in|edu)$/, 'college-sites'],
];

const SOCIAL_SOURCES = new Set(['instagram', 'linkedin', 'facebook', 'whatsapp', 'communities']);

function hostSource(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return HOST_SOURCES.find(([re]) => re.test(host))?.[1];
  } catch {
    return undefined;
  }
}

/** The SOURCES slug for where a submission came from: the link's site, else where the student saw it. */
export function sourceFor(url: string | undefined, seenOn: string | undefined): string {
  const byHost = hostSource(url);
  if (byHost) return byHost;
  if (seenOn && ['instagram', 'whatsapp', 'facebook', 'linkedin'].includes(seenOn)) return seenOn;
  return 'submissions';
}

/** Social posts point at the announcement, not the registration page. */
export function isSocialLink(url: string | undefined | null): boolean {
  const s = hostSource(url ?? undefined);
  return Boolean(s && SOCIAL_SOURCES.has(s));
}

export interface Duplicate {
  hackathon?: { id: string; slug: string; title: string; state: string };
  recentSubmission?: boolean;
}

/** Already a listing (by any source link or the registration link), or shared in the last 24 hours. */
export async function findDuplicate(url: string): Promise<Duplicate | null> {
  const variants = urlVariants(url);
  const listing = await Hackathon.findOne({
    state: { $in: ['live', 'pending'] },
    $or: [{ 'sourceRefs.url': { $in: variants } }, { registrationUrl: { $in: variants } }],
  })
    .select('slug title state')
    .lean();
  if (listing) return { hackathon: { id: String(listing._id), slug: listing.slug, title: listing.title, state: listing.state } };
  const recent = await Submission.exists({
    url: { $in: variants },
    createdAt: { $gte: new Date(Date.now() - DAY) },
    status: { $ne: 'rejected' },
  });
  return recent ? { recentSubmission: true } : null;
}

// ---------- Reading the details ----------

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH_RE = '(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?';

interface FoundDate {
  index: number;
  y: number | null;
  m: number;
  d: number;
  /** Second day of a "14–15 Nov" range. */
  endDay?: number;
}

function findDates(text: string): FoundDate[] {
  const found: FoundDate[] = [];
  const t = text.toLowerCase();
  const push = (index: number, d: number, m: number, y: string | undefined, endDay?: number) => {
    if (m < 0 || m > 11 || d < 1 || d > 31) return;
    const year = y ? (y.length === 2 ? 2000 + Number(y) : Number(y)) : null;
    if (year !== null && (year < 2020 || year > 2100)) return;
    if (found.some((f) => Math.abs(f.index - index) < 3)) return;
    found.push({ index, d, m, y: year, endDay });
  };
  // "14-15 Nov 2026", "14 to 15 November"
  for (const x of t.matchAll(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s*(?:-|–|to)\\s*(\\d{1,2})(?:st|nd|rd|th)?\\s+${MONTH_RE},?\\s*(\\d{4})?`, 'g'))) {
    push(x.index!, Number(x[1]), MONTHS.indexOf(x[3].slice(0, 3)), x[4], Number(x[2]));
  }
  // "14 Nov 2026", "14th of November"
  for (const x of t.matchAll(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s*(?:of\\s+)?${MONTH_RE},?\\s*(\\d{4})?`, 'g'))) {
    push(x.index!, Number(x[1]), MONTHS.indexOf(x[2].slice(0, 3)), x[3]);
  }
  // "Nov 14, 2026"
  for (const x of t.matchAll(new RegExp(`\\b${MONTH_RE}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b,?\\s*(\\d{4})?`, 'g'))) {
    push(x.index!, Number(x[2]), MONTHS.indexOf(x[1].slice(0, 3)), x[3]);
  }
  // "2026-11-14"
  for (const x of t.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) push(x.index!, Number(x[3]), Number(x[2]) - 1, x[1]);
  // "14/11/2026" (day first, as written in India)
  for (const x of t.matchAll(/\b(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})\b/g)) push(x.index!, Number(x[1]), Number(x[2]) - 1, x[3]);
  return found.sort((a, b) => a.index - b.index);
}

/** India-time ISO string; a missing year means the next time that date comes round. */
function istIso(f: { y: number | null; m: number }, day: number, time: string, now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  let year = f.y ?? now.getFullYear();
  const at = (y: number) => new Date(`${y}-${pad(f.m + 1)}-${pad(day)}T${time}:00+05:30`);
  if (f.y === null && at(year).getTime() < now.getTime() - DAY) year += 1;
  return at(year).toISOString();
}

const DEADLINE_WORDS = /(deadline|register by|registrations? (close|closes|ends?)|last date|apply by|submit by|till|until)/;

function readDates(text: string, now: Date) {
  const dates = findDates(text);
  const lower = text.toLowerCase();
  const deadline = dates.find((f) => DEADLINE_WORDS.test(lower.slice(Math.max(0, f.index - 50), f.index)));
  const others = dates.filter((f) => f !== deadline);
  const first = others[0];
  const startDate = first ? istIso(first, first.d, '09:00', now) : null;
  const last = first?.endDay ? { ...first, d: first.endDay } : others[1] ?? first;
  let endDate = last ? istIso(last, last.d, '18:00', now) : null;
  if (startDate && endDate && endDate < startDate) endDate = istIso(first!, first!.d, '18:00', now);
  return {
    startDate,
    endDate,
    registrationDeadline: deadline ? istIso(deadline, deadline.d, '23:59', now) : null,
  };
}

const MONEY_RE = /(?:₹|rs\.?|inr|\$|usd)\s*[\d,]+(?:\.\d+)?\s*(?:lakhs?|lacs?|crores?|cr|k|l)?\b|[\d,]+(?:\.\d+)?\s*(?:lakhs?|lacs?|crores?|cr|k)\b/gi;

function readPrize(text: string): { prizePool: number; prizeCurrency: 'INR' | 'USD'; line?: string } | null {
  const lower = text.toLowerCase();
  const at = lower.search(/prize|worth|pool|rewards?|cash|winnings/);
  const scope = at >= 0 ? text.slice(at, at + 160) : text;
  const amounts = [...scope.matchAll(MONEY_RE)].map((m) => ({ text: m[0], money: parseMoney(m[0]) })).filter((m) => m.money);
  if (!amounts.length) return null;
  // The total pool is usually the biggest number near "prize".
  const best = amounts.reduce((a, b) => (b.money!.amount > a.money!.amount ? b : a));
  if (best.money!.currency === 'INR' && best.money!.amount < 500) return null;
  const line = at >= 0 ? text.slice(at, at + 120).split('\n')[0].trim() : undefined;
  return { prizePool: best.money!.amount, prizeCurrency: best.money!.currency, line };
}

function readFee(text: string): number | null {
  const lower = text.toLowerCase();
  if (/\b(free (of cost|entry|registration|to (join|participate|register|attend))|no (registration |entry |participation )?fee|registration is free|zero fee)\b/.test(lower)) return 0;
  const m = lower.match(/(?:registration|entry|participation)?\s*fees?\s*[:\-–]?\s*((?:₹|rs\.?|inr)\s*[\d,]+)/);
  if (m) return parseMoney(m[1])?.amount ?? null;
  return null;
}

function readTeam(text: string) {
  const near = text.match(/team[^\n]{0,50}/i)?.[0] ?? '';
  return parseTeamSize(near) ?? parseTeamSize(text.match(/\d{1,2}\s*(?:-|–|to)\s*\d{1,2}\s*(?:members?|people|participants)/i)?.[0]);
}

function readOrganizer(text: string, pageTitle: string): string {
  const by = text.match(/(?:organi[sz]ed|hosted|presented|conducted)\s+by\s+([^\n.,!|]{3,60})/i)?.[1];
  if (by) return by.trim();
  // Instagram titles look like "GDG Pune on Instagram: “…”".
  const social = pageTitle.match(/^(.{2,60}?)\s+(?:on|\|)\s+(?:Instagram|LinkedIn|Facebook)\b/i)?.[1];
  return social?.trim() ?? '';
}

function readTitle(pageTitle: string, text: string): string {
  const fromPage = pageTitle
    .replace(/\s+on\s+(Instagram|LinkedIn|Facebook)\b.*$/i, '')
    .split(/\s+[|·–—]\s+|\s+-\s+(?=[A-Z][\w.]+$)/)[0]
    ?.trim();
  if (fromPage && !/^(instagram|linkedin|facebook|login|sign in)$/i.test(fromPage) && !/\bon (instagram|linkedin|facebook)\b/i.test(pageTitle)) {
    return fromPage.slice(0, 140);
  }
  const line = text
    .split('\n')
    .map((l) => l.replace(/[*_#>~`]+/g, '').replace(/[^\p{L}\p{N}\s&:'’!?.,()+-]/gu, '').trim())
    .find((l) => l.length >= 4);
  return (line ?? fromPage ?? '').slice(0, 100);
}

function firstLink(text: string): string | undefined {
  const links = [...text.matchAll(/https?:\/\/[^\s<>"')\]]+/g)].map((m) => m[0].replace(/[.,!?]+$/, ''));
  return links.find((l) => !isSocialLink(l)) ?? links[0];
}

/** A best guess from plain rules, for when AI isn't set up (or didn't answer in time). */
export function ruleDraft(input: { url?: string; title?: string; text?: string }, now = new Date()): Draft {
  const text = [input.title, input.text].filter(Boolean).join('\n\n');
  const city = cityFromText(text);
  const lower = text.toLowerCase();
  const saysMode = /\b(online|virtual|remote|offline|in[- ]person|on[- ]campus|venue|hybrid)\b/.test(lower);
  const mode = saysMode ? inferMode(text) : city ? 'offline' : 'online';
  const themes = inferThemes(text);
  const team = readTeam(text);
  const prize = readPrize(text);
  const fee = readFee(text);
  const dates = readDates(text, now);
  const linkInText = firstLink(text);
  const registrationUrl = input.url && !isSocialLink(input.url) ? input.url : linkInText && !isSocialLink(linkInText) ? linkInText : input.url ?? linkInText ?? null;
  const organizer = readOrganizer(text, input.title ?? '');
  const type = inferEventType(text);
  const beginnerFriendly = inferBeginnerFriendly(text);
  const teamMin = team?.min ?? 1;
  const teamMax = team?.max ?? 4;
  const title = readTitle(input.title ?? '', input.text ?? '');

  const missing = [
    !title && 'title',
    !dates.startDate && 'startDate',
    !dates.endDate && 'endDate',
    !dates.registrationDeadline && 'registrationDeadline',
    mode !== 'online' && !city && 'city',
    (!registrationUrl || isSocialLink(registrationUrl)) && 'registrationUrl',
    !prize && 'prizePool',
    fee === null && 'fee',
  ].filter(Boolean) as string[];

  return {
    method: 'rules',
    isEvent: null,
    title,
    tagline: '',
    type,
    organizer,
    organizerType: /\b(college|university|institute|iit|nit|iiit|club|student chapter)\b/i.test(text) ? 'college' : 'community',
    mode,
    city: mode === 'online' ? null : city ?? null,
    venue: '',
    country: 'India',
    ...dates,
    teamMin,
    teamMax,
    eligibility: inferEligibility(text),
    fee: fee ?? 0,
    prizePool: prize?.prizePool ?? 0,
    prizeCurrency: prize?.prizeCurrency ?? 'INR',
    prizes: prize?.line ? [prize.line.slice(0, 160)] : [],
    perks: [],
    themes,
    beginnerFriendly,
    registrationUrl,
    summary: templateSummary({ type, mode, organizer, city, themes, teamMin, teamMax, fee: fee ?? 0, beginnerFriendly }),
    confidence: Math.round(Math.max(0.1, 0.6 - missing.length * 0.06) * 100) / 100,
    missing,
  };
}

async function aiDraft(input: { url?: string; title?: string; text?: string; images: ExtractImage[]; sourceHint: string }): Promise<Draft | string> {
  const text = [input.title && `Page title: ${input.title}`, input.text].filter(Boolean).join('\n\n');
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      extractEvent({ url: input.url, text, images: input.images, sourceHint: input.sourceHint }),
      new Promise<'timeout'>((resolve) => (timer = setTimeout(() => resolve('timeout'), AI_TIMEOUT_MS))),
    ]);
    if (result === 'timeout') return 'The Extractor took too long, so this is a rule-based guess.';
    if (!result) return 'The Extractor had nothing to read, so this is a rule-based guess.';
    const e = result.event;
    const city = cityFromText(e.city);
    return {
      method: 'ai',
      model: result.model,
      isEvent: e.isEvent,
      title: e.title,
      tagline: e.tagline,
      type: e.type,
      organizer: e.organizer,
      organizerType: e.organizerType,
      mode: e.mode,
      city: city ?? null,
      cityName: city ? '' : e.city ?? '',
      venue: e.venue ?? '',
      country: e.country,
      startDate: e.startDate,
      endDate: e.endDate,
      registrationDeadline: e.registrationDeadline,
      teamMin: e.teamMin,
      teamMax: e.teamMax,
      eligibility: e.eligibility,
      fee: e.fee,
      prizePool: e.prizePool,
      prizeCurrency: e.prizeCurrency,
      prizes: e.prizes.slice(0, 10),
      perks: e.perks.slice(0, 10),
      themes: e.themes as ThemeSlug[],
      beginnerFriendly: e.beginnerFriendly,
      registrationUrl: e.registrationUrl ?? (input.url && !isSocialLink(input.url) ? input.url : null),
      summary: e.summary,
      confidence: e.confidence,
      missing: e.missing,
    };
  } catch (err) {
    console.error('[submissions] extractEvent failed:', err);
    return 'The Extractor ran into an error, so this is a rule-based guess.';
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Reads a quick share or extension submission: AI when it's set up (with a time limit), rules otherwise. */
export async function draftFor(input: { url?: string; title?: string; text?: string; images: ExtractImage[]; sourceHint: string }): Promise<Draft> {
  if (isAiEnabled() && (input.text?.trim() || input.title?.trim() || input.images.length)) {
    const ai = await aiDraft(input);
    if (typeof ai !== 'string') return ai;
    return { ...ruleDraft(input), note: ai };
  }
  return { ...ruleDraft(input), note: isAiEnabled() ? undefined : 'AI isn’t set up, so this is a rule-based guess.' };
}

const istDay = (day: string, time: string) => new Date(`${day}T${time}:00+05:30`).toISOString();

/** The organizer form already has every field: turn it into a listing draft. */
export function formDraft(b: z.output<typeof OrganizerBody>): Draft {
  const prize = parseMoney(b.prize);
  const city = b.mode === 'online' ? null : b.city === 'other' ? cityFromText(b.cityName) ?? null : b.city;
  return {
    method: 'form',
    isEvent: true,
    title: b.title,
    tagline: '',
    type: b.type,
    organizer: b.organizer,
    organizerType: /\b(college|university|institute|iit|nit|iiit|club)\b/i.test(b.organizer) ? 'college' : 'community',
    mode: b.mode,
    city,
    cityName: b.mode !== 'online' && !city ? b.cityName : '',
    venue: b.venue,
    country: 'India',
    startDate: istDay(b.start, '09:00'),
    endDate: istDay(b.end, '18:00'),
    registrationDeadline: istDay(b.deadline, '23:59'),
    teamMin: b.teamMin,
    teamMax: b.teamMax,
    eligibility: [b.eligibility],
    fee: b.fee,
    prizePool: prize?.amount ?? 0,
    prizeCurrency: prize?.currency ?? 'INR',
    prizes: b.prize ? [b.prize.slice(0, 160)] : [],
    perks: [],
    themes: b.themes,
    beginnerFriendly: inferBeginnerFriendly(b.description),
    registrationUrl: b.url,
    // Written by the organizer for us, so it can be used (and trimmed) as the summary.
    summary: b.description.slice(0, 1200),
    confidence: b.isOrganizer ? 0.85 : 0.7,
    missing: [],
  };
}

// ---------- Creating ----------

export type SubmitResult = { id?: string; status: 'pending' | 'duplicate'; hackathonSlug?: string };

/** Stores a submission (after the duplicate check) with its draft. */
export async function createSubmission(
  { body, poster }: { body: SubmissionInput; poster: Buffer | null },
  { user, ip }: Pick<Ctx, 'user' | 'ip'>
): Promise<SubmitResult> {
  const rawUrl = body.url;
  const url = rawUrl ? cleanUrl(rawUrl) : undefined;
  const dup = url ? await findDuplicate(url) : null;
  const liveSlug = dup?.hackathon?.state === 'live' ? dup.hackathon.slug : undefined;
  // Organizers often bring better details than we have, so their form is kept for merging.
  if (dup && (body.kind !== 'organizer' || dup.recentSubmission)) return { status: 'duplicate', hackathonSlug: liveSlug };

  let posterUrl: string | undefined;
  const images: ExtractImage[] = [];
  if (body.kind === 'quick') {
    if (poster) {
      const stored = await storeImage(poster, 'posters');
      posterUrl = stored.url;
      images.push({ base64: stored.base64, mediaType: stored.mediaType });
    } else if (body.posterUrl) {
      posterUrl = body.posterUrl;
      images.push({ url: body.posterUrl });
    }
    const message = body.message ?? '';
    if (!url && !posterUrl && message.length < 20) {
      throw badRequest('Add a link, a poster, or paste the post or message.', {
        message: 'Add a link, a poster, or paste the post or message (at least 20 characters).',
      });
    }
  }

  let doc: Partial<ISubmission>;
  if (body.kind === 'organizer') {
    const { kind: _kind, email, ...fields } = body;
    const draft = formDraft(body);
    if (dup?.hackathon) draft.duplicateOf = dup.hackathon;
    doc = { kind: 'organizer', email, url, title: body.title, fields, extracted: draft as Record<string, unknown> };
  } else if (body.kind === 'quick') {
    const draft = await draftFor({ url, text: body.message, images, sourceHint: `Quick share from a student, seen on ${body.seenOn ?? 'an unknown place'}` });
    doc = { kind: 'quick', email: body.email, seenOn: body.seenOn, url, message: body.message, posterUrl, fields: {}, extracted: draft as Record<string, unknown> };
  } else {
    const imageUrls = body.imageUrls.slice(0, 6);
    const text = [body.text.slice(0, 15_000), body.note && `Note from the student: ${body.note}`].filter(Boolean).join('\n\n');
    const draft = await draftFor({
      url,
      title: body.title,
      text,
      images: imageUrls.slice(0, 2).map((u) => ({ url: u })),
      sourceHint: `Browser extension, from a page on ${new URL(url!).hostname}`,
    });
    doc = {
      kind: 'extension',
      seenOn: body.seenOn,
      url,
      title: body.title || undefined,
      message: body.text.slice(0, 5000) || undefined,
      imageUrls,
      fields: body.note ? { note: body.note } : {},
      extracted: draft as Record<string, unknown>,
    };
  }

  const sub = await Submission.create({ ...doc, userId: user?.id, status: 'pending', ip });
  return dup ? { id: String(sub._id), status: 'duplicate', hackathonSlug: liveSlug } : { id: String(sub._id), status: 'pending' };
}

// ---------- Reading back ----------

/** A short name for a submission in lists: the form title, the draft's title, the page title or the link. */
export function submissionTitle(s: Pick<ISubmission, 'title' | 'fields' | 'extracted' | 'url' | 'message' | 'posterUrl'>): string {
  const fromDraft = (s.extracted as Draft | null)?.title;
  const fromForm = typeof s.fields?.title === 'string' ? s.fields.title : '';
  if (fromForm) return fromForm;
  if (fromDraft) return fromDraft;
  if (s.title) return s.title;
  if (s.url) {
    try {
      const u = new URL(s.url);
      return `${u.hostname.replace(/^www\./, '')}${u.pathname.length > 1 ? u.pathname.slice(0, 40) : ''}`;
    } catch {
      return s.url;
    }
  }
  if (s.message) return s.message.split('\n')[0].slice(0, 80);
  return s.posterUrl ? 'A poster' : 'A hackathon';
}
