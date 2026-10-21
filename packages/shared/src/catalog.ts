import type { Agent, City, Eligibility, EventType, Mode, Source, SourceKind, Status, Theme } from './types';

export const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'ideathon', label: 'Ideathon' },
  { value: 'coding-contest', label: 'Coding contest' },
  { value: 'case-competition', label: 'Case competition' },
  { value: 'build-challenge', label: 'Build challenge' },
  { value: 'open-source', label: 'Open source' },
];

export const MODES: { value: Mode; label: string }[] = [
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
  { value: 'hybrid', label: 'Hybrid' },
];

export const ELIGIBILITY: { value: Eligibility; label: string }[] = [
  { value: 'students', label: 'Students' },
  { value: 'college-only', label: 'College-only' },
  { value: 'professionals', label: 'Professionals' },
  { value: 'women-only', label: 'Women-only' },
  { value: 'open-to-all', label: 'Open to all' },
];

export const STATUS_LABELS: Record<Status, string> = {
  open: 'Open',
  'closing-soon': 'Closing soon',
  'registration-closed': 'Registration closed',
  'in-progress': 'Happening now',
  completed: 'Completed',
};

export const THEMES: Theme[] = [
  { slug: 'ai-ml', name: 'AI / ML', description: 'Models, agents, computer vision and everything data.' },
  { slug: 'web-dev', name: 'Web & App', description: 'Websites, mobile apps and developer tools.' },
  { slug: 'web3', name: 'Web3', description: 'Blockchain, smart contracts and decentralised apps.' },
  { slug: 'fintech', name: 'FinTech', description: 'Payments, banking, investing and money tools.' },
  { slug: 'healthtech', name: 'HealthTech', description: 'Care, diagnostics, fitness and wellbeing.' },
  { slug: 'edtech', name: 'EdTech', description: 'Learning tools for students and teachers.' },
  { slug: 'climate', name: 'Climate', description: 'Energy, sustainability and climate action.' },
  { slug: 'social-impact', name: 'Social Impact', description: 'Ideas that help communities and NGOs.' },
  { slug: 'iot', name: 'IoT & Hardware', description: 'Sensors, robotics and connected devices.' },
  { slug: 'smart-cities', name: 'Smart Cities', description: 'Mobility, civic tech and urban problems.' },
  { slug: 'cybersecurity', name: 'Cybersecurity', description: 'CTFs, security tools and privacy.' },
  { slug: 'gaming', name: 'Gaming', description: 'Game jams, game engines and interactive media.' },
  { slug: 'open-innovation', name: 'Open Innovation', description: 'Build anything. No fixed theme.' },
];

export const CITIES: City[] = [
  { slug: 'pune', name: 'Pune', state: 'Maharashtra', launch: true },
  { slug: 'mumbai', name: 'Mumbai', state: 'Maharashtra', launch: false },
  { slug: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', launch: false },
  { slug: 'hyderabad', name: 'Hyderabad', state: 'Telangana', launch: false },
  { slug: 'delhi-ncr', name: 'Delhi NCR', state: 'Delhi', launch: false },
  { slug: 'chennai', name: 'Chennai', state: 'Tamil Nadu', launch: false },
];

export const SOURCE_KIND_LABELS: Record<SourceKind, string> = {
  platform: 'Hackathon platforms',
  search: 'Web search',
  social: 'Social media',
  events: 'Event sites',
  college: 'College & government sites',
  community: 'Communities',
  people: 'People',
};

export const SOURCES: Source[] = [
  { slug: 'unstop', name: 'Unstop', kind: 'platform', url: 'https://unstop.com' },
  { slug: 'devfolio', name: 'Devfolio', kind: 'platform', url: 'https://devfolio.co' },
  { slug: 'devpost', name: 'Devpost', kind: 'platform', url: 'https://devpost.com' },
  { slug: 'mlh', name: 'MLH', kind: 'platform', url: 'https://mlh.io' },
  { slug: 'hackerearth', name: 'HackerEarth', kind: 'platform', url: 'https://www.hackerearth.com' },
  { slug: 'hack2skill', name: 'Hack2skill', kind: 'platform', url: 'https://hack2skill.com' },
  { slug: 'dorahacks', name: 'DoraHacks', kind: 'platform', url: 'https://dorahacks.io' },
  { slug: 'lablab', name: 'lablab.ai', kind: 'platform', url: 'https://lablab.ai' },
  { slug: 'kaggle', name: 'Kaggle', kind: 'platform', url: 'https://www.kaggle.com' },
  { slug: 'google', name: 'Google Search', kind: 'search', url: 'https://www.google.com' },
  { slug: 'instagram', name: 'Instagram', kind: 'social', url: 'https://www.instagram.com' },
  { slug: 'linkedin', name: 'LinkedIn', kind: 'social', url: 'https://www.linkedin.com' },
  { slug: 'luma', name: 'Luma', kind: 'events', url: 'https://lu.ma' },
  { slug: 'eventbrite', name: 'Eventbrite', kind: 'events', url: 'https://www.eventbrite.com' },
  { slug: 'meetup', name: 'Meetup', kind: 'events', url: 'https://www.meetup.com' },
  { slug: 'college-sites', name: 'College websites', kind: 'college', url: '/how-it-works' },
  { slug: 'communities', name: 'Discord, Telegram & WhatsApp', kind: 'community', url: '/how-it-works' },
  { slug: 'submissions', name: 'Organizer submissions', kind: 'people', url: '/submit' },
];

export const AGENTS: Agent[] = [
  { id: 'scout', name: 'Scout', job: 'Checks every source on a schedule and collects new event links, posts and pages.' },
  { id: 'extractor', name: 'Extractor', job: 'Reads the page, text or poster and fills in dates, deadline, team size, prizes and more.' },
  { id: 'deduper', name: 'Deduper', job: 'Spots the same event on Unstop, Instagram and a college site, and merges it into one listing.' },
  { id: 'verifier', name: 'Verifier', job: 'Checks the link works, the dates make sense and the deadline is real. Flags spam.' },
  { id: 'tagger', name: 'Tagger', job: 'Adds themes, eligibility, beginner-friendly and free or paid labels.' },
  { id: 'writer', name: 'Writer', job: 'Writes a short, clear summary in our own words.' },
  { id: 'publisher', name: 'Publisher', job: 'Puts the listing live, updates city and theme pages, and shares new events.' },
  { id: 'alerts', name: 'Alerts', job: 'Matches new events to what you saved and reminds you before deadlines.' },
];

export function themeName(slug: string): string {
  return THEMES.find((t) => t.slug === slug)?.name ?? slug;
}

export function cityName(slug?: string): string {
  if (!slug) return 'Online';
  return CITIES.find((c) => c.slug === slug)?.name ?? slug;
}

export function eventTypeLabel(type: EventType): string {
  return EVENT_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function modeLabel(mode: Mode): string {
  return MODES.find((m) => m.value === mode)?.label ?? mode;
}

export function eligibilityLabel(value: Eligibility): string {
  return ELIGIBILITY.find((e) => e.value === value)?.label ?? value;
}

export function sourceBySlug(slug: string): Source | undefined {
  return SOURCES.find((s) => s.slug === slug);
}
