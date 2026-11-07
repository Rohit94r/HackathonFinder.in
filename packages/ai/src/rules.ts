import {
  CITIES,
  CITY_GAZETTEER,
  cityName,
  eventTypeLabel,
  gazetteerCity,
  themeName,
  type Currency,
  type Eligibility,
  type EventType,
  type Mode,
  type ThemeSlug,
} from '@hackathonfinder/shared';

// Rule-based readers that need no API key. Connectors with structured data use
// them directly, and they are the fallback when AI isn't configured.

// Localities and alternate names → city slug. Longer names first so "navi mumbai" wins over "mumbai".
const BASE_CITY_ALIASES: [string, string][] = [
  ['navi mumbai', 'mumbai'], ['thane', 'mumbai'], ['andheri', 'mumbai'], ['powai', 'mumbai'], ['bandra', 'mumbai'], ['bombay', 'mumbai'], ['mumbai', 'mumbai'],
  ['pimpri', 'pune'], ['chinchwad', 'pune'], ['hinjewadi', 'pune'], ['hinjawadi', 'pune'], ['baner', 'pune'], ['wakad', 'pune'], ['kharadi', 'pune'], ['hadapsar', 'pune'], ['shivajinagar', 'pune'], ['kothrud', 'pune'], ['pune', 'pune'], ['poona', 'pune'],
  ['bangalore', 'bengaluru'], ['bengaluru', 'bengaluru'], ['whitefield', 'bengaluru'], ['koramangala', 'bengaluru'], ['electronic city', 'bengaluru'], ['indiranagar', 'bengaluru'],
  ['secunderabad', 'hyderabad'], ['hitec city', 'hyderabad'], ['gachibowli', 'hyderabad'], ['hyderabad', 'hyderabad'],
  ['new delhi', 'delhi-ncr'], ['delhi', 'delhi-ncr'], ['gurugram', 'delhi-ncr'], ['gurgaon', 'delhi-ncr'], ['noida', 'delhi-ncr'], ['greater noida', 'delhi-ncr'], ['ghaziabad', 'delhi-ncr'], ['faridabad', 'delhi-ncr'],
  ['chennai', 'chennai'], ['madras', 'chennai'], ['guindy', 'chennai'],
  ['gandhinagar', 'ahmedabad'], ['ahmedabad', 'ahmedabad'], ['amdavad', 'ahmedabad'],
  ['kolkata', 'kolkata'], ['calcutta', 'kolkata'], ['salt lake', 'kolkata'],
  ['jaipur', 'jaipur'],
  ['chandigarh', 'chandigarh'], ['mohali', 'chandigarh'], ['panchkula', 'chandigarh'],
  ['kochi', 'kochi'], ['cochin', 'kochi'], ['ernakulam', 'kochi'], ['kakkanad', 'kochi'],
  ['indore', 'indore'], ['nagpur', 'nagpur'], ['bhubaneswar', 'bhubaneswar'], ['bhubaneshwar', 'bhubaneswar'],
];

// Every gazetteer city is matched by its own name and slug, so "Bhopal" or "bhopal" resolves
// even though it has no hand-written alias. Catalog cities keep their curated aliases.
const CITY_ALIASES: [string, string][] = [
  ...BASE_CITY_ALIASES,
  ...CITY_GAZETTEER.flatMap((c): [string, string][] => [
    [c.name.toLowerCase(), c.slug],
    [c.slug.replace(/-/g, ' '), c.slug],
  ]),
].sort((a, b) => b[0].length - a[0].length) as [string, string][];

/** City slug for a place name or address, if it's one of our cities. */
export function cityFromText(text: string | null | undefined): string | undefined {
  if (!text) return undefined;
  const t = ` ${text.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ')} `;
  for (const [alias, slug] of CITY_ALIASES) {
    if (t.includes(` ${alias} `)) return slug;
  }
  return undefined;
}

/** City centre coordinates for a city slug, for listings without an exact venue point. */
export function cityPoint(slug: string | undefined): { lat: number; lng: number } | undefined {
  const city = CITIES.find((c) => c.slug === slug);
  if (city) return { lat: city.lat, lng: city.lng };
  const extra = gazetteerCity(slug);
  return extra ? { lat: extra.lat, lng: extra.lng } : undefined;
}

/** "₹1,50,000", "1.5 lakh", "INR 2 crore", "$5K", "USD 10,000" → amount and currency. */
export function parseMoney(text: string | null | undefined): { amount: number; currency: Currency } | null {
  if (!text) return null;
  const t = text.toLowerCase().replace(/,/g, '');
  const currency: Currency = /\$|usd|dollar/.test(t) ? 'USD' : 'INR';
  const m = t.match(/(\d+(?:\.\d+)?)\s*(crore|cr|lakhs?|lacs?|l\b|k\b|thousand|m\b|million)?/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const unit = m[2] ?? '';
  const mult = /crore|cr/.test(unit)
    ? 1e7
    : /lakh|lac|^l$/.test(unit)
      ? 1e5
      : /^k$|thousand/.test(unit)
        ? 1e3
        : /^m$|million/.test(unit)
          ? 1e6
          : 1;
  const amount = Math.round(n * mult);
  return amount > 0 ? { amount, currency } : null;
}

const THEME_KEYWORDS: [ThemeSlug, RegExp][] = [
  ['ai-ml', /\b(ai|a\.i\.|ml|machine learning|deep learning|genai|gen ai|generative|llm|nlp|computer vision|artificial intelligence|data science)\b/],
  ['web3', /\b(web3|web 3|blockchain|crypto|defi|nft|ethereum|solana|polygon|smart contract)s?\b/],
  ['fintech', /\b(fintech|finance|banking|payments?|upi|insurance|insurtech|trading)\b/],
  ['healthtech', /\b(health|healthcare|medtech|medical|hospital|wellness|mental health)\b/],
  // "Machine learning" and "deep learning" are AI, not EdTech.
  ['edtech', /\b(edtech|education|(?<!(machine|deep|reinforcement|federated|transfer) )learning|students? tools?|teaching)\b/],
  ['climate', /\b(climate|sustainab\w*|green|clean energy|renewable|carbon|environment\w*|ev\b|electric vehicle)\b/],
  ['social-impact', /\b(social impact|social good|ngo|community|accessibility|inclusion|sdg)\b/],
  ['iot', /\b(iot|internet of things|hardware|embedded|robotics|arduino|raspberry pi|esp32|drone)s?\b/],
  ['smart-cities', /\b(smart cit(y|ies)|civic|urban|mobility|traffic|transport|governance|gov ?tech)\b/],
  ['cybersecurity', /\b(cyber ?security|security|ctf|capture the flag|infosec|privacy|ethical hacking)\b/],
  ['gaming', /\b(game jam|gaming|game dev|games?|unity|unreal)\b/],
  ['web-dev', /\b(web dev\w*|web app|mobile app|app development|frontend|backend|full ?stack|android|ios|flutter|react)\b/],
];

const OPEN_THEME = /\b(open innovation|any theme|open theme|no theme|open track|open[- ]ended|build anything)\b/;

/** Up to three themes the text names, open-innovation when it says there's no fixed theme; empty when it names none. */
export function matchThemes(text: string): ThemeSlug[] {
  const t = text.toLowerCase();
  const found = THEME_KEYWORDS.filter(([, re]) => re.test(t)).map(([slug]) => slug);
  if (OPEN_THEME.test(t)) found.push('open-innovation');
  return [...new Set(found)].slice(0, 3);
}

/** Up to three themes from free text; open-innovation when nothing matches. */
export function inferThemes(text: string): ThemeSlug[] {
  const found = matchThemes(text);
  return found.length ? found : ['open-innovation'];
}

export function inferEligibility(text: string): Eligibility[] {
  const t = text.toLowerCase();
  const out: Eligibility[] = [];
  if (/\b(women|woman|girls|female|she)\b/.test(t) && /\b(only|exclusive|for women|for girls)\b/.test(t)) out.push('women-only');
  if (/\b(students?|college|undergrad\w*|ug|pg|university)\b/.test(t)) out.push('students');
  if (/\b(professionals?|working|developers?|startups?|anyone|open to all|everyone)\b/.test(t)) out.push(/anyone|open to all|everyone/.test(t) ? 'open-to-all' : 'professionals');
  return out.length ? [...new Set(out)] : ['students'];
}

export function inferBeginnerFriendly(text: string): boolean {
  return /\b(beginners?|first[- ]timers?|first hackathon|newbies?|no experience|all levels|freshers?)\b/i.test(text);
}

export function inferEventType(text: string): EventType {
  const t = text.toLowerCase();
  if (/\bideathon\b|pitch (competition|contest)|idea (submission|competition)/.test(t)) return 'ideathon';
  if (/\b(coding (contest|challenge|competition)|codathon|competitive programming|dsa contest)\b/.test(t)) return 'coding-contest';
  if (/\bcase (study|competition)\b/.test(t)) return 'case-competition';
  if (/\b(open[- ]source|contribut(e|ion) program|hacktoberfest|gsoc)\b/.test(t)) return 'open-source';
  if (/\b(build(ing)? challenge|buildathon|makeathon|designathon)\b/.test(t)) return 'build-challenge';
  return 'hackathon';
}

export function inferMode(text: string): Mode {
  const t = text.toLowerCase();
  const online = /\b(online|virtual|remote)\b/.test(t);
  const offline = /\b(offline|in[- ]person|on[- ]campus|venue|on[- ]site)\b/.test(t);
  if (online && offline) return 'hybrid';
  if (/\bhybrid\b/.test(t)) return 'hybrid';
  return offline ? 'offline' : online ? 'online' : 'offline';
}

const TEAM_RANGE = '(\\d{1,2})\\s*(?:-|–|—|to)\\s*(\\d{1,2})';

/**
 * Team size like "Team size: 2-4", "teams of 3–5 members", "up to 4 members", "solo".
 * In longer text a range only counts next to the word team or members, so dates
 * ("29–30 October") aren't read as team sizes; a short field ("2-4") is read as is.
 */
export function parseTeamSize(text: string | null | undefined): { min: number; max: number } | null {
  if (!text) return null;
  const t = text.toLowerCase().replace(/\s+/g, ' ');
  const range =
    t.match(new RegExp(`teams?(?: size)?(?: of)?(?: between)?\\s*[:\\-–]?\\s*${TEAM_RANGE}`)) ??
    t.match(new RegExp(`${TEAM_RANGE}\\s*(?:members?|people|participants?|persons?|per team|students)\\b`)) ??
    (t.length <= 40 ? t.match(new RegExp(`^\\D*${TEAM_RANGE}`)) : null);
  if (range) {
    const [min, max] = [+range[1], +range[2]];
    if (min >= 1 && max >= min && max <= 20) return { min, max };
  }
  const upTo = t.match(/(?:up ?to|max(?:imum)?(?: of)?)\s*(\d{1,2})\s*(?:members?|people|participants?|per team)/) ?? t.match(/teams? of (?:up ?to )?(\d{1,2})\b(?! ?(?:-|–|to))/);
  if (upTo && +upTo[1] >= 1 && +upTo[1] <= 20) return { min: 1, max: +upTo[1] };
  if (/\b(solo|individual)\b/.test(t) && !/team/.test(t)) return { min: 1, max: 1 };
  return null;
}

/** A plain summary built from fields, for listings without AI-written copy. */
export function templateSummary(e: {
  type: EventType;
  mode: Mode;
  organizer?: string;
  city?: string;
  /** Label for a city outside the catalog ("Bhopal"). */
  cityName?: string;
  /** Empty when the source names no theme: then the summary says nothing about themes. */
  themes: ThemeSlug[];
  teamMin: number;
  teamMax: number;
  /** False when the source doesn't state a team size: then the summary says nothing about teams. */
  teamSizeKnown?: boolean;
  fee: number;
  beginnerFriendly: boolean;
  /** A hybrid event abroad listed for its online part: where its venue is ("Brooklyn, New York"). */
  basedIn?: string;
  /** Listed online, but it is a hybrid event (its venue is abroad). */
  hybridOnline?: boolean;
}): string {
  const kind = eventTypeLabel(e.type).toLowerCase();
  const place = e.city || e.cityName ? cityName(e.city, e.cityName) : '';
  const by = e.organizer ? ` by ${e.organizer}` : '';
  const opening =
    e.mode === 'online' && (e.hybridOnline || e.basedIn)
      ? `A hybrid ${kind}${by}${e.basedIn ? ` based in ${e.basedIn}` : ''}; you can take part online.`
      : e.mode === 'online'
        ? `An online ${kind}${by}.`
        : e.mode === 'hybrid'
          ? `A hybrid ${kind}${by}: take part ${place ? `in ${place}` : 'in person'} or online.`
          : `An in-person ${kind}${by}${place ? `, in ${place}` : ''}.`;
  const named = e.themes.filter((t) => t !== 'open-innovation').map(themeName);
  const themeLine = named.length ? `Tracks include ${named.join(', ')}.` : e.themes.includes('open-innovation') ? 'Build anything: there is no fixed theme.' : '';
  const team =
    e.teamSizeKnown === false ? '' : e.teamMax === 1 ? 'Solo entries only.' : e.teamMin === 1 ? `Go solo or bring a team of up to ${e.teamMax}.` : `Teams of ${e.teamMin}–${e.teamMax}.`;
  return [
    opening,
    themeLine,
    team,
    e.fee === 0 ? 'Free to enter.' : `Entry fee ₹${e.fee.toLocaleString('en-IN')}.`,
    e.beginnerFriendly ? 'First-timers are welcome.' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

/** Strips tags and collapses whitespace: HTML → readable text for the Extractor. */
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript|svg|nav|footer|iframe)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

/** A one-line tagline built from fields ("Offline hackathon in Pune on AI / ML and FinTech"), so we never copy the organizer's own line. */
export function templateTagline(e: { type: EventType; mode: Mode; city?: string; cityName?: string; themes: ThemeSlug[] }): string {
  const kind = eventTypeLabel(e.type).toLowerCase();
  const how = e.mode === 'online' ? 'Online' : e.mode === 'hybrid' ? 'Hybrid' : 'In-person';
  const where = e.mode === 'online' || (!e.city && !e.cityName) ? '' : ` in ${cityName(e.city, e.cityName)}`;
  const themes = e.themes.filter((t) => t !== 'open-innovation').slice(0, 2).map(themeName);
  const on = themes.length ? ` on ${themes.join(' and ')}` : e.themes.includes('open-innovation') ? ', open theme' : '';
  return `${how} ${kind}${where}${on}`.slice(0, 200);
}

/**
 * Total prize from free text: the first money amount on a line that talks about prizes
 * ("Prize pool: ₹1.5 lakh", "Prizes worth $10K"). Null when no such line has an amount.
 */
export function prizeFromText(text: string | null | undefined): { amount: number; currency: Currency } | null {
  if (!text) return null;
  for (const line of text.split(/\n|(?<=\.)\s/)) {
    if (!/\b(prizes?|prize pool|rewards?|worth|cash)\b/i.test(line)) continue;
    // Needs a currency sign, a currency word or a lakh/crore/k unit so "Top 3 teams" isn't read as ₹3.
    const m = line.match(/(₹|rs\.?|inr|\$|usd)\s*\d[\d,]*(?:\.\d+)?\s*(?:crore|cr|lakhs?|lacs?|k\b|thousand|m\b|million)?|\d[\d,]*(?:\.\d+)?\s*(?:crore|cr\b|lakhs?|lacs?|k\b)\s*(?:₹|rs|inr|\$|usd)?/i);
    const money = m ? parseMoney(m[0]) : null;
    if (money && money.amount >= 100) return money;
  }
  return null;
}
