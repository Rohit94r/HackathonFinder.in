import { htmlToText } from '@hackathonfinder/ai';
import type { Eligibility } from '@hackathonfinder/shared';
import { absoluteUrl, cleanLine } from '../text';

// Small readers for platform JSON. Sources change shape without notice, so every
// field is checked for its type and capped in length before it goes any further.

export type Obj = Record<string, unknown>;

export const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

export const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** A trimmed string, or undefined for anything else (numbers become strings). */
export function str(v: unknown, max = 500): string | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  return s ? s.slice(0, max) : undefined;
}

/** A finite number from a number or numeric string. */
export function num(v: unknown): number | undefined {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v.replace(/,/g, '')) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

/** A whole number in [min, max], else undefined. */
export function int(v: unknown, min: number, max: number): number | undefined {
  const n = num(v);
  return n !== undefined && Number.isInteger(n) && n >= min && n <= max ? n : undefined;
}

/** An absolute http(s) URL that isn't absurdly long. */
export function url(v: unknown, base?: string): string | undefined {
  const u = absoluteUrl(typeof v === 'string' ? v.trim() : undefined, base);
  return u && u.length <= 2000 ? u : undefined;
}

/** Readable text from organizer HTML: tags stripped, capped. It is only read, never shown. */
export function plainText(html: unknown, max = 20_000): string {
  return typeof html === 'string' ? htmlToText(html).slice(0, max) : '';
}

/** Distinct, cleaned short labels (themes, skills, tracks). */
export function labels(values: unknown[], max = 12): string[] {
  const out = new Set<string>();
  for (const v of values) {
    const s = cleanLine(typeof v === 'string' ? v : isObj(v) ? (v.name ?? v.skill ?? v.label) : undefined, 60);
    if (s) out.add(s);
    if (out.size >= max) break;
  }
  return [...out];
}

/** Eligibility from platform audience labels ("Engineering Students", "Working Professionals", "Everyone"). */
export function eligibilityFrom(labelsIn: string[]): Eligibility[] {
  const out = new Set<Eligibility>();
  for (const l of labelsIn.map((x) => x.toLowerCase())) {
    if (/\b(everyone|all|anyone|open to all)\b/.test(l)) out.add('open-to-all');
    else if (/student|undergraduate|postgraduate|graduate|school|college|ug\b|pg\b/.test(l)) out.add('students');
    else if (/professional|fresher|corporate|working|experienced/.test(l)) out.add('professionals');
    if (/\bwomen|female|girls\b/.test(l)) out.add('women-only');
  }
  return [...out];
}

/** "₹50,000" for prize lines. */
export function moneyLine(amount: number, currency: 'INR' | 'USD'): string {
  return currency === 'USD' ? `$${amount.toLocaleString('en-US')}` : `₹${amount.toLocaleString('en-IN')}`;
}

/** First usable image URL from a list of candidates (skips SVG icons and tracking pixels). */
export function firstImage(...candidates: unknown[]): string | undefined {
  for (const c of candidates) {
    const u = url(c);
    if (u && !/\.svg(\?|$)/i.test(u) && !/(pixel|spacer|blank)\.(gif|png)/i.test(u)) return u;
  }
  return undefined;
}
