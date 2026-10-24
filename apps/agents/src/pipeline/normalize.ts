import {
  cityFromText,
  cityPoint,
  inferBeginnerFriendly,
  inferEligibility,
  inferEventType,
  inferMode,
  inferThemes,
  parseMoney,
  parseTeamSize,
  prizeFromText,
} from '@hackathonfinder/ai';
import { slugify } from '@hackathonfinder/db';
import { CITIES, type Mode, type OrganizerType } from '@hackathonfinder/shared';
import { parseDate } from '../dates';
import { countryName } from '../html';
import { absoluteUrl, cleanLine } from '../text';
import type { CandidateData, Connector, RawCandidate } from '../types';
import type { Draft } from './draft';

const CITY_SLUGS = new Set(CITIES.map((c) => c.slug));

export function isCatalogCity(slug: string | undefined): boolean {
  return Boolean(slug && CITY_SLUGS.has(slug));
}

/** Our city slug for the venue: a known city (localities map to their city), else a slug of the stated city. */
export function resolveCity(d: Pick<CandidateData, 'city' | 'venue' | 'address' | 'region'>, title = ''): string | undefined {
  for (const text of [d.city, d.venue, d.address]) {
    const slug = cityFromText(text);
    if (slug) return slug;
  }
  const stated = statedCity(d.city);
  if (stated) return slugify(stated, 40);
  // Delhi and Chandigarh are their own states, so the state alone names the city.
  if (/^(delhi|new delhi|nct of delhi|chandigarh)$/i.test(cleanLine(d.region, 60))) return cityFromText(d.region);
  return cityFromText(title);
}

/** The city as the source wrote it ("Bhopal"), without the state or placeholders like "Online". */
export function statedCity(city: string | undefined): string {
  const stated = cleanLine(city, 80)
    .split(',')[0]
    .replace(/[:;]+$/, '')
    .trim();
  return stated && !/^(online|virtual|remote|tbd|tba|india|null|undefined|n\/?a)$/i.test(stated) ? stated : '';
}

/** "bhopal" + "BHOPAL" → "Bhopal": the label shown for a city outside the catalog. */
export function cityLabel(slug: string | undefined, stated: string): string | undefined {
  if (!slug || isCatalogCity(slug)) return undefined;
  const words = (stated || slug.replace(/-/g, ' ')).split(/\s+/).filter(Boolean);
  return words.map((w) => (w.length <= 3 && w === w.toUpperCase() ? w : w[0].toUpperCase() + w.slice(1).toLowerCase())).join(' ').slice(0, 80);
}

/** Mode from free text, only when the text actually says something about it. */
export function modeFromText(text: string): Mode | undefined {
  if (!/\b(online|virtual|remote|offline|in[- ]person|on[- ]campus|venue|on[- ]site|hybrid)\b/i.test(text)) return undefined;
  return inferMode(text);
}

/** Entry fee in INR from text: 0 for "free registration", the amount for "registration fee ₹500". */
export function feeFromText(text: string): number | undefined {
  if (/\b(free (of cost|registration|entry|to (join|participate|register|enter|apply))|no (registration |entry |participation )?fees?|registration is (completely )?free|zero (registration )?fee)\b/i.test(text)) return 0;
  // No leading \b: descriptions stripped of HTML often run lines together ("…2026Registration Fee: ₹400").
  const m =
    text.match(/(?:registration|entry|participation|team)\s+fees?\b[^.\n]{0,60}?(?:₹|rs\.?|inr)\s*([\d,]+)/i) ??
    text.match(/(?:₹|rs\.?|inr)\s*([\d,]+)[^.\n]{0,30}\b(?:registration|entry|participation)\s+fees?/i);
  return m ? Number(m[1].replace(/,/g, '')) : undefined;
}

export function guessOrganizerType(organizer: string, title = ''): OrganizerType {
  const t = `${organizer} ${organizer ? '' : title}`.toLowerCase();
  if (/\b(government|govt|ministry|niti aayog|isro|drdo|aicte|meity|smart india hackathon|startup india|nabard|sebi|rbi|indian army|indian navy|police)\b/.test(t)) return 'government';
  if (/\b(college|university|institute|iit|nit|iiit|bits|school of|vidyapeeth|vidyalaya|polytechnic|engineering|campus)\b/.test(t)) return 'college';
  if (/\b(gdg|gdgoc|google developer|community|club|society|chapter|ieee|acm|mlh|foundation|collective|guild|meetup|dao)\b/.test(t)) return 'community';
  return organizer ? 'company' : 'community';
}

const validInt = (n: unknown, min: number, max: number): n is number => typeof n === 'number' && Number.isInteger(n) && n >= min && n <= max;

/**
 * Turns what a connector read into a draft listing: dates in IST, our city slug and
 * point, mode, team size, money, fee, eligibility, themes and type. Records every
 * assumption in `notes` and lowers confidence for it.
 */
export function normalize(c: RawCandidate, connector: Pick<Connector, 'slug' | 'trust'>, opts: { now: Date; listingSource?: string }): Draft {
  const d = c.data ?? {};
  const text = c.text ?? '';
  const notes: string[] = [];
  const flags: string[] = [];
  let confidence = connector.trust;

  const title = cleanLine(d.title ?? c.title, 140);
  const tags = (d.tags ?? []).map((t) => cleanLine(t, 60)).filter(Boolean);
  const head = [title, ...tags].join(' ');

  const mode = d.mode ?? modeFromText(`${title}\n${text.slice(0, 20_000)}`);
  if (!d.mode && mode) notes.push(`mode "${mode}" read from the text`);

  // Place: online events have none; in-person ones get a city slug and a point.
  let city: string | undefined;
  let cityName: string | undefined;
  let venue: string | undefined;
  let point: Draft['point'];
  const statedCountry = countryName(d.country) ?? '';
  const region = cleanLine(d.region, 80) || undefined;
  if (mode && mode !== 'online') {
    city = resolveCity(d, title);
    cityName = cityLabel(city, statedCity(d.city));
    venue = cleanLine(d.venue ?? d.address, 200) || undefined;
    const exact = typeof d.lat === 'number' && typeof d.lng === 'number' && Math.abs(d.lat) <= 90 && Math.abs(d.lng) <= 180 && !(d.lat === 0 && d.lng === 0);
    const centre = cityPoint(city);
    point = exact ? { lat: d.lat!, lng: d.lng!, exact: true } : centre ? { ...centre, exact: false } : undefined;
  }
  const country = statedCountry || (isCatalogCity(city) ? 'India' : '');

  // Dates: without an offset they are India time.
  const zone = { timeZone: d.timezone, now: opts.now };
  const startDate = parseDate(d.startDate, { ...zone, kind: 'start' });
  let endDate = parseDate(d.endDate, { ...zone, kind: 'end' });
  let registrationDeadline = parseDate(d.registrationDeadline, { ...zone, kind: 'deadline' });
  if (!endDate && startDate) {
    endDate = parseDate(d.startDate, { ...zone, kind: 'end' });
    notes.push('no end date stated; treated as a one-day event');
    confidence -= 0.05;
  }
  if (!registrationDeadline && startDate) {
    registrationDeadline = startDate;
    notes.push('no registration deadline stated; using the start date');
    confidence -= 0.1;
  } else if (d.deadlineAssumed) {
    notes.push('the source has no separate deadline; the connector used the event dates');
    confidence -= 0.05;
  }
  if (registrationDeadline && endDate && registrationDeadline > endDate) {
    registrationDeadline = endDate;
    notes.push('deadline was after the end; set to the end date');
  }

  let teamMin = 1;
  let teamMax = 4;
  if (validInt(d.teamMax, 1, 50)) {
    teamMax = d.teamMax;
    teamMin = validInt(d.teamMin, 1, teamMax) ? d.teamMin : 1;
  } else {
    const team = parseTeamSize(d.teamSizeText ?? text.slice(0, 20_000));
    if (team && team.max <= 50) [teamMin, teamMax] = [team.min, team.max];
    else notes.push('team size not stated; using 1–4');
  }

  let fee = typeof d.fee === 'number' && d.fee >= 0 ? Math.round(d.fee) : d.isPaid === false ? 0 : feeFromText(text);
  if (fee === undefined) {
    if (d.isPaid) flags.push('Paid entry, but the fee amount is not stated');
    fee = 0;
  }

  let prizePool = 0;
  let prizeCurrency = d.prizeCurrency ?? 'INR';
  if (typeof d.prizePool === 'number' && d.prizePool > 0) {
    prizePool = Math.round(d.prizePool);
  } else {
    // A prize line only counts with a currency or a lakh/crore/k unit, so "Top 3 teams win" isn't ₹3.
    const statedMoney = d.prizeText && /(₹|\brs\.?\s*\d|\binr\b|\$|\busd\b|\d\s*(lakhs?|lacs?|crores?|cr|k)\b)/i.test(d.prizeText) ? parseMoney(d.prizeText) : null;
    const money = (statedMoney && statedMoney.amount >= 100 ? statedMoney : null) ?? prizeFromText(text.slice(0, 30_000));
    if (money) {
      prizePool = money.amount;
      prizeCurrency = d.prizeCurrency ?? money.currency;
      if (!d.prizeText) notes.push('prize pool read from the description');
    }
  }

  let themes = inferThemes(head);
  if (themes.length === 1 && themes[0] === 'open-innovation' && text) themes = inferThemes(`${title}\n${text.slice(0, 6000)}`);

  for (const flag of d.flags ?? []) {
    const line = cleanLine(flag, 200);
    if (line && !flags.includes(line)) flags.push(line);
  }

  const organizer = cleanLine(d.organizer, 140);
  return {
    title,
    tagline: '',
    type: d.type ?? inferEventType(head),
    organizer,
    organizerType: d.organizerType ?? guessOrganizerType(organizer, title),
    mode,
    city,
    cityName,
    region,
    venue,
    country,
    point,
    startDate,
    endDate,
    registrationDeadline,
    teamMin,
    teamMax,
    eligibility: d.eligibility?.length ? d.eligibility : inferEligibility(`${title}\n${text.slice(0, 8000)}`),
    fee,
    prizePool,
    prizeCurrency,
    prizes: (d.prizes ?? []).map((p) => cleanLine(p, 120)).filter(Boolean).slice(0, 6),
    perks: (d.perks ?? []).map((p) => cleanLine(p, 120)).filter(Boolean).slice(0, 6),
    themes,
    beginnerFriendly: d.beginnerFriendly ?? inferBeginnerFriendly(`${title}\n${text.slice(0, 20_000)}`),
    registrationUrl: absoluteUrl(d.registrationUrl) ?? absoluteUrl(c.url),
    registrationVia: d.registrationVia === 'qr' ? 'qr' : 'link',
    summary: '',
    imageUrl: absoluteUrl(d.imageUrl),
    logoUrl: absoluteUrl(d.logoUrl),
    listingSource: d.listingSource ?? opts.listingSource ?? connector.slug,
    confidence: Math.max(0, Math.min(1, confidence)),
    flags,
    notes,
    usedAi: false,
  };
}
