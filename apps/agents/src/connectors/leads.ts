import { cityFromText } from '@hackathonfinder/ai';
import { CITIES, type City } from '@hackathonfinder/shared';
import { MONTH_PATTERN, parseDate } from '../dates';
import { HACKATHON_WORDS, absoluteUrl, cleanLine, hostOf } from '../text';

// Helpers for leads found through web search: event dates in free text, a clean
// event name from a result title, which cities to search this run, and which
// sites not to visit (platforms with their own connector, social networks).

/** Hosts covered by a platform connector, or that we never crawl (logins, robots.txt). */
const SKIP_HOSTS = [
  'unstop.com',
  'devfolio.co',
  'devpost.com',
  'mlh.io',
  'mlh.com',
  'hackerearth.com',
  'lablab.ai',
  'instagram.com',
  'facebook.com',
  'fb.com',
  'linkedin.com',
  'twitter.com',
  'x.com',
  'youtube.com',
  'youtu.be',
  'reddit.com',
  'quora.com',
  'wikipedia.org',
  'github.com',
  't.me',
  'whatsapp.com',
  'play.google.com',
  'apps.apple.com',
  'google.com',
  'duckduckgo.com',
  // News sites write about events after they happen.
  'timesofindia.indiatimes.com',
  'indiatimes.com',
  'hindustantimes.com',
  'ndtv.com',
  'indianexpress.com',
  'thehindu.com',
  'economictimes.com',
  'livemint.com',
  'business-standard.com',
  'news18.com',
  'indiatoday.in',
  'deccanherald.com',
];

export function skipHost(url: string): boolean {
  const host = hostOf(url);
  return !host || SKIP_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

/** Titles of round-ups ("Top 10 hackathons in Pune"), which list many events. */
export function looksLikeListPage(title: string): boolean {
  return /\b(top \d+|best|list of|upcoming hackathons|hackathons (in|near|for|to)|all hackathons|hackathons 20\d\d|calendar|directory|winners|results?)\b/i.test(title);
}

const DAY = '(\\d{1,2})(?:st|nd|rd|th)?';
const SEP = '\\s*(?:-|–|—|to|&|and|,)\\s*';
const DAY_RANGE = new RegExp(`\\b${DAY}${SEP}${DAY}(?:\\s+of)?[\\s,]+${MONTH_PATTERN}(?:[\\s,']+(\\d{4}))?`, 'i');
const MONTH_RANGE = new RegExp(`\\b${MONTH_PATTERN}\\s+${DAY}${SEP}${DAY}\\b(?:[\\s,]+(\\d{4}))?`, 'i');
const SINGLE = new RegExp(`\\b(?:${DAY}(?:\\s+of)?[\\s\\-/.,]*${MONTH_PATTERN}(?:[\\s\\-/.,']+\\d{4})?|${MONTH_PATTERN}[\\s.]+${DAY}\\b(?:[\\s,]+\\d{4})?|\\d{1,2}[/.-]\\d{1,2}[/.-]20\\d{2})`, 'i');
const DEADLINE = new RegExp(
  `(last date|deadline|register (?:by|before)|registrations? (?:close|closes|ends?|open till|open until)|apply (?:by|before)|submit by)[^.\\n]{0,40}?(${SINGLE.source.slice(2)})`,
  'i'
);

export interface TextDates {
  start?: Date;
  end?: Date;
  deadline?: Date;
}

/**
 * Event dates from a caption, snippet or page: a deadline phrase ("last date to register
 * 5 Nov"), then the first date or date range left ("9-10 October 2026", "Nov 28").
 * Dates without a year are the next ones after `now` (the post's date when known).
 */
export function datesFromText(input: string, now: Date): TextDates {
  let text = ` ${input.replace(/\s+/g, ' ')} `;
  const out: TextDates = {};
  const dl = text.match(DEADLINE);
  if (dl) {
    out.deadline = parseDate(dl[2], { kind: 'deadline', now });
    text = text.replace(dl[0], ' ');
  }
  const range = text.match(DAY_RANGE);
  const mrange = text.match(MONTH_RANGE);
  // Take whichever range comes first in the text.
  const pick = [range, mrange].filter(Boolean).sort((a, b) => a!.index! - b!.index!)[0];
  if (pick === range && range) {
    const [, d1, d2, month, year] = range;
    out.start = parseDate(`${d1} ${month} ${year ?? ''}`, { kind: 'start', now });
    out.end = parseDate(`${d2} ${month} ${year ?? ''}`, { kind: 'end', now });
  } else if (mrange) {
    const [, month, d1, d2, year] = mrange;
    out.start = parseDate(`${d1} ${month} ${year ?? ''}`, { kind: 'start', now });
    out.end = parseDate(`${d2} ${month} ${year ?? ''}`, { kind: 'end', now });
  } else {
    const single = text.match(SINGLE);
    if (single) {
      out.start = parseDate(single[0], { kind: 'start', now });
      out.end = parseDate(single[0], { kind: 'end', now });
    }
  }
  if (out.start && out.end && out.end < out.start) out.end = parseDate(out.start.toISOString(), { kind: 'end' });
  return out;
}

/** "856 likes, 43 comments - iqooind on September 3, 2026: "…"" → the caption and when it was posted. */
export function splitPostSnippet(snippet: string): { text: string; postedAt?: Date } {
  const m = snippet.match(/^(?:[\d,.]+[KkMm]? (?:likes?|comments?),?\s*)*(?:[\d,.]+[KkMm]? comments?\s*)?-?\s*([\w.]+ )?on ((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{1,2}, \d{4})\s*:\s*/i);
  if (!m) return { text: snippet };
  return { text: snippet.slice(m[0].length).replace(/^["“]|["”]$/g, ''), postedAt: parseDate(m[2], { kind: 'start' }) };
}

/** A readable event name from a search result title ("Fusion | Fusion 2k26 — 24-hour Hackathon 9-10 … - Instagram"). */
export function eventTitle(raw: string): string {
  let t = cleanLine(raw, 300)
    .replace(/\s*[-|–]\s*(Instagram|LinkedIn|Facebook)\s*$/i, '')
    .replace(/\s*\|\s*\d+ comments?\s*$/i, '')
    .replace(/^.{1,60}? on (LinkedIn|Instagram|Facebook):\s*/i, '')
    .replace(/(\.{3}|…)\s*$/, '')
    .trim();
  const parts = t.split(/\s+\|\s+/);
  if (parts.length > 1) t = parts.find((p) => HACKATHON_WORDS.test(p)) ?? parts[parts.length - 1];
  const sentences = t.split(/(?<=[.!?])\s+/);
  if (sentences.length > 1) t = sentences.find((s) => HACKATHON_WORDS.test(s)) ?? sentences[0];
  t = t
    .replace(/\s+(?:is happening|happening|is back|coming soon|registrations? (?:are )?(?:now )?open)\b.*$/i, '')
    .replace(/\s+(?:on|from|starts?|starting)\s+\d.*$/i, '')
    .replace(/\s+\d{1,2}(\s*[-–&]\s*\d{1,2})?\s*$/, '')
    .replace(/[\s,:;–—-]+$/, '')
    .replace(/#/g, '')
    .trim();
  return cleanLine(t, 140);
}

/** The first link in free text that isn't the social network itself ("Register: forms.gle/abc"). */
export function linkInText(text: string, exclude: RegExp): string | undefined {
  for (const m of text.matchAll(/\b((?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s"'<>)]*)?)/gi)) {
    const raw = m[1].replace(/[.,;:!?]+$/, '');
    if (!/\//.test(raw) && !/^https?:/i.test(raw)) continue; // bare domains like "iqoo.com" are usually mentions
    const u = absoluteUrl(/^https?:/i.test(raw) ? raw : `https://${raw}`);
    if (u && !exclude.test(hostOf(u))) return u;
  }
  return undefined;
}

export const QR_WORDS = /\b(qr|scan (the|this|to|and)|scan code|scanner)\b/i;

/** Which catalog cities this run searches: a different few every half day, so all are covered within a few days. */
export function rotatingCities(now: Date, perRun: number): City[] {
  const halfDay = Math.floor(now.getTime() / (12 * 3600_000));
  const groups = Math.ceil(CITIES.length / perRun);
  const g = halfDay % groups;
  return CITIES.slice(g * perRun, g * perRun + perRun);
}

/** City slug for a lead: the searched city when the text names it, else any catalog city it names. */
export function leadCity(text: string, searched?: City): string | undefined {
  const named = cityFromText(text);
  if (named) return named;
  return searched && new RegExp(`\\b${searched.name.split(' ')[0]}\\b`, 'i').test(text) ? searched.slug : undefined;
}

/** The year to search for: this year, and next year from October on (announcements start early). */
export function searchYears(now: Date): number[] {
  const y = now.getUTCFullYear();
  return now.getUTCMonth() >= 9 ? [y, y + 1] : [y];
}
