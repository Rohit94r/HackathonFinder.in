import { cityName, eventTypeLabel, themeName, type EventType, type Mode, type ThemeSlug } from '@hackathonfinder/shared';
import { DEFAULT_FILTERS, DISTANCE_OPTIONS, type Filters } from './filters';

interface Rule {
  pattern: RegExp;
  apply: (f: Filters, match: RegExpMatchArray) => void;
  label: (f: Filters) => string;
}

const addMode = (mode: Mode): Rule['apply'] => (f) => {
  if (!f.modes.includes(mode)) f.modes.push(mode);
};
const addTheme = (theme: ThemeSlug): Rule['apply'] => (f) => {
  if (!f.themes.includes(theme)) f.themes.push(theme);
};
const addType = (type: EventType): Rule['apply'] => (f) => {
  if (!f.types.includes(type)) f.types.push(type);
};
const setCity = (slug: string): Rule['apply'] => (f) => {
  f.city = slug;
};

const city = (slug: string, words: string): Rule => ({
  pattern: new RegExp(`\\b(${words})\\b`),
  apply: setCity(slug),
  label: () => cityName(slug),
});
const theme = (slug: ThemeSlug, words: string): Rule => ({
  pattern: new RegExp(`\\b(${words})\\b`),
  apply: addTheme(slug),
  label: () => themeName(slug),
});
const type = (value: EventType, words: string): Rule => ({
  pattern: new RegExp(`\\b(${words})\\b`),
  apply: addType(value),
  label: () => eventTypeLabel(value),
});

// Order matters: longer phrases first so "smart city" wins over "city".
const RULES: Rule[] = [
  { pattern: /\b(near me|nearby|near by|around me|closest|nearest)\b/, apply: (f) => void (f.sort = 'nearest'), label: () => 'Nearest first' },
  {
    // "within 20 km" → the smallest distance option that covers it.
    pattern: /\b(?:within |under )?(\d+) ?(?:km|kms|kilomet(?:er|re)s?)\b/,
    apply: (f, m) => void (f.km = DISTANCE_OPTIONS.find((d) => d.value >= Number(m[1]))?.value ?? 0),
    label: (f) => (f.km ? `Within ${f.km} km` : 'Any distance'),
  },
  { pattern: /\b(closing soon|urgent|last chance)\b/, apply: (f) => void (f.status = 'closing-soon'), label: () => 'Closing soon' },
  { pattern: /\b(happening now|live now|ongoing)\b/, apply: (f) => void (f.status = 'in-progress'), label: () => 'Happening now' },
  { pattern: /\b(this week|next 7 days|7 days)\b/, apply: (f) => void (f.within = 'week'), label: () => 'Deadline this week' },
  { pattern: /\b(this month|next 30 days|30 days)\b/, apply: (f) => void (f.within = 'month'), label: () => 'Deadline this month' },
  { pattern: /\b(free|no fee|zero fee)\b/, apply: (f) => void (f.fee = 'free'), label: () => 'Free' },
  { pattern: /\bpaid\b/, apply: (f) => void (f.fee = 'paid'), label: () => 'Paid' },
  { pattern: /\b(online|remote|virtual)\b/, apply: addMode('online'), label: () => 'Online' },
  { pattern: /\b(offline|in[- ]person)\b/, apply: addMode('offline'), label: () => 'Offline' },
  { pattern: /\bhybrid\b/, apply: addMode('hybrid'), label: () => 'Hybrid' },
  city('pune', 'pune'),
  city('mumbai', 'mumbai|bombay'),
  city('bengaluru', 'bengaluru|bangalore'),
  city('hyderabad', 'hyderabad'),
  city('delhi-ncr', 'delhi|ncr|noida|gurgaon|gurugram'),
  city('chennai', 'chennai|madras'),
  city('ahmedabad', 'ahmedabad|amdavad|gandhinagar'),
  city('kolkata', 'kolkata|calcutta'),
  city('jaipur', 'jaipur'),
  city('chandigarh', 'chandigarh|mohali|panchkula|tricity'),
  city('kochi', 'kochi|cochin|ernakulam'),
  city('indore', 'indore'),
  city('nagpur', 'nagpur'),
  city('bhubaneswar', 'bhubaneswar'),
  theme('smart-cities', 'smart cit(?:y|ies)|civic'),
  theme('ai-ml', 'ai|ml|genai|machine learning|artificial intelligence|llm'),
  theme('web3', 'web3|blockchain|crypto'),
  theme('web-dev', 'web dev|web|app|apps|frontend|full ?stack'),
  theme('fintech', 'fintech|finance|payments?|upi'),
  theme('healthtech', 'health|healthtech|medical'),
  theme('edtech', 'edtech|education'),
  theme('climate', 'climate|sustainability|green'),
  theme('social-impact', 'social impact|social good|ngo'),
  theme('iot', 'iot|hardware|robotics'),
  theme('cybersecurity', 'cyber ?security|security|ctf'),
  theme('gaming', 'gaming|game jam|games?'),
  type('ideathon', 'ideathons?'),
  type('coding-contest', 'coding contests?|contests?|dsa'),
  type('case-competition', 'case competitions?|case study'),
  type('open-source', 'open[- ]source'),
  type('build-challenge', 'build challenges?'),
  { pattern: /\b(beginners?|first[- ]timers?|newbies?|first hackathon)\b/, apply: (f) => void (f.beginner = true), label: () => 'Beginner-friendly' },
  { pattern: /\b(women|girls|female)\b/, apply: (f) => void (f.eligibility = 'women-only'), label: () => 'Women-only' },
  { pattern: /\b(professionals?|working)\b/, apply: (f) => void (f.eligibility = 'professionals'), label: () => 'Professionals' },
  { pattern: /\b(students?|college)\b/, apply: (f) => void (f.eligibility ||= 'students'), label: () => 'Students' },
  { pattern: /\b(solo|alone|individual)\b/, apply: (f) => void (f.team = 'solo'), label: () => 'Solo' },
  { pattern: /\bteams? of \d+\b|\bteams?\b/, apply: (f) => void (f.team = 'team'), label: () => 'Teams' },
  { pattern: /\b(2 ?lakhs?|2l|200k)\b/, apply: (f) => void (f.minPrize = 200000), label: () => 'Prize ₹2L+' },
  { pattern: /\b(1 ?lakhs?|1l|100k|lakh)\b/, apply: (f) => void (f.minPrize = Math.max(f.minPrize, 100000)), label: () => 'Prize ₹1L+' },
  { pattern: /\b(50k|50 ?thousand)\b/, apply: (f) => void (f.minPrize = Math.max(f.minPrize, 50000)), label: () => 'Prize ₹50K+' },
  { pattern: /\b(big|high|highest|large) prizes?\b/, apply: (f) => void (f.sort = 'prize'), label: () => 'Biggest prizes first' },
];

const FILLER =
  /\b(show|find|me|i|want|need|looking|for|a|an|the|in|at|near|with|and|or|of|on|to|under|events?|hackathons?|hacks?|deadline|any|some|please|all|that|is|are|year|1st|2nd|3rd|4th|first|second|third|final)\b/g;

export interface SmartResult {
  filters: Filters;
  understood: string[];
}

/** Turns a plain-English request into filters. Unmatched words stay as keywords. */
export function parseSmartQuery(input: string): SmartResult {
  const filters: Filters = { ...DEFAULT_FILTERS, modes: [], types: [], themes: [] };
  const understood: string[] = [];
  let text = ` ${input.toLowerCase().replace(/[^\w₹\s-]/g, ' ')} `;

  for (const rule of RULES) {
    const match = text.match(rule.pattern);
    if (match) {
      rule.apply(filters, match);
      const label = rule.label(filters);
      if (!understood.includes(label)) understood.push(label);
      text = text.replace(new RegExp(rule.pattern.source, 'g'), ' ');
    }
  }

  filters.q = text.replace(FILLER, ' ').replace(/\s+/g, ' ').trim();
  return { filters, understood };
}
