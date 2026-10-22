import crypto from 'node:crypto';

const STOP_WORDS = new Set(['the', 'a', 'an', 'of', 'and', 'by', 'at', 'in', 'for', 'edition']);

/** "CodeStorm 2026: AI Edition!" and "Codestorm '26 – AI" both become "codestorm ai". */
export function normalizeTitle(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’`]\d{2}\b/g, ' ')
    .replace(/\b(19|20)\d{2}\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((w) => w && !STOP_WORDS.has(w))
    .join(' ');
}

function bigrams(s: string): Map<string, number> {
  const out = new Map<string, number>();
  const t = s.replace(/\s+/g, '');
  for (let i = 0; i < t.length - 1; i++) {
    const g = t.slice(i, i + 2);
    out.set(g, (out.get(g) ?? 0) + 1);
  }
  return out;
}

/** Sørensen–Dice similarity over character bigrams of two normalized strings (0–1). */
export function dice(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const A = bigrams(a);
  const B = bigrams(b);
  let sizeA = 0;
  let sizeB = 0;
  let common = 0;
  for (const n of A.values()) sizeA += n;
  for (const [g, n] of B) {
    sizeB += n;
    common += Math.min(n, A.get(g) ?? 0);
  }
  return sizeA + sizeB === 0 ? 0 : (2 * common) / (sizeA + sizeB);
}

/** How alike two event titles are, ignoring case, years and punctuation. */
export function titleSimilarity(a: string, b: string): number {
  return dice(normalizeTitle(a), normalizeTitle(b));
}

const TRACKING_PARAMS = /^(utm_\w+|ref|ref_src|referrer|source|fbclid|gclid|igshid|igsh|si|mc_cid|mc_eid|lid|trk|trackingId)$/i;

/** A comparable form of a URL: no scheme, no www, no tracking params, no trailing slash or hash. */
export function normalizeUrl(input: string | undefined | null): string {
  if (!input) return '';
  try {
    const u = new URL(input.trim().startsWith('//') ? `https:${input.trim()}` : input.trim());
    if (!/^https?:$/.test(u.protocol)) return '';
    const params = [...u.searchParams.entries()].filter(([k]) => !TRACKING_PARAMS.test(k)).sort(([a], [b]) => a.localeCompare(b));
    const query = params.length ? `?${new URLSearchParams(params).toString()}` : '';
    const path = u.pathname.replace(/\/+$/, '');
    return `${u.hostname.toLowerCase().replace(/^www\./, '')}${path}${query}`;
  } catch {
    return '';
  }
}

/** True for a site's home page ("https://unstop.com"), which can't identify one event. */
export function isBareDomain(input: string | undefined | null): boolean {
  const n = normalizeUrl(input);
  return !n || !n.includes('/');
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** An absolute http(s) URL, fixing protocol-relative ("//cdn…") links; undefined otherwise. */
export function absoluteUrl(input: unknown, base?: string): string | undefined {
  if (typeof input !== 'string' || !input.trim()) return undefined;
  const raw = input.trim();
  try {
    const u = new URL(raw.startsWith('//') ? `https:${raw}` : raw, base);
    return /^https?:$/.test(u.protocol) ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

/** JSON with sorted keys, so equal content always hashes the same. */
export function stableStringify(value: unknown): string {
  if (value === undefined) return 'null';
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
}

export function contentHash(value: unknown): string {
  return crypto.createHash('sha256').update(stableStringify(value)).digest('hex');
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };

/** Decodes the common HTML entities in titles from feeds. */
export function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+|#39);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);
}

/** Single-line, trimmed, entity-decoded text, cut to `max` characters. */
export function cleanLine(s: unknown, max = 200): string {
  if (typeof s !== 'string') return '';
  return decodeEntities(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim().slice(0, max);
}

/** Matches event names that are hackathon-style (for general event feeds like Luma or Eventbrite). */
export const HACKATHON_WORDS =
  /\b(hackathons?|hack ?days?|hack ?nights?|hackfest|hack ?weekend|hacks|hack|ideathons?|buildathons?|makeathons?|designathons?|design-a-thon|datathons?|codeathons?|codathons?|promptathons?|prompt-a-thon|game ?jams?|innovation challenge|build challenge|coding (contest|challenge|competition)|case competition|pitch (competition|contest))\b/i;
