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
  { slug: 'pune', name: 'Pune', state: 'Maharashtra', launch: true, lat: 18.5204, lng: 73.8567 },
  { slug: 'mumbai', name: 'Mumbai', state: 'Maharashtra', launch: false, lat: 19.076, lng: 72.8777 },
  { slug: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', launch: false, lat: 12.9716, lng: 77.5946 },
  { slug: 'hyderabad', name: 'Hyderabad', state: 'Telangana', launch: false, lat: 17.385, lng: 78.4867 },
  { slug: 'delhi-ncr', name: 'Delhi NCR', state: 'Delhi', launch: false, lat: 28.6139, lng: 77.209 },
  { slug: 'chennai', name: 'Chennai', state: 'Tamil Nadu', launch: false, lat: 13.0827, lng: 80.2707 },
  { slug: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', launch: false, lat: 23.0225, lng: 72.5714 },
  { slug: 'kolkata', name: 'Kolkata', state: 'West Bengal', launch: false, lat: 22.5726, lng: 88.3639 },
  { slug: 'jaipur', name: 'Jaipur', state: 'Rajasthan', launch: false, lat: 26.9124, lng: 75.7873 },
  { slug: 'chandigarh', name: 'Chandigarh', state: 'Chandigarh', launch: false, lat: 30.7333, lng: 76.7794 },
  { slug: 'kochi', name: 'Kochi', state: 'Kerala', launch: false, lat: 9.9312, lng: 76.2673 },
  { slug: 'indore', name: 'Indore', state: 'Madhya Pradesh', launch: false, lat: 22.7196, lng: 75.8577 },
  { slug: 'nagpur', name: 'Nagpur', state: 'Maharashtra', launch: false, lat: 21.1458, lng: 79.0882 },
  { slug: 'bhubaneswar', name: 'Bhubaneswar', state: 'Odisha', launch: false, lat: 20.2961, lng: 85.8245 },
];

/**
 * Cities students search for that are not (yet) full landing pages. They get a slug
 * and a centre point, so "near me", maps and city filters work for them without a
 * geocoding request per listing. Catalog cities above are the ones with pages.
 */
export interface GazetteerCity {
  slug: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
}

export const CITY_GAZETTEER: GazetteerCity[] = [
  { slug: 'bhopal', name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
  { slug: 'lucknow', name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  { slug: 'kanpur', name: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lng: 80.3319 },
  { slug: 'varanasi', name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739 },
  { slug: 'prayagraj', name: 'Prayagraj', state: 'Uttar Pradesh', lat: 25.4358, lng: 81.8463 },
  { slug: 'agra', name: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lng: 78.0081 },
  { slug: 'meerut', name: 'Meerut', state: 'Uttar Pradesh', lat: 28.9845, lng: 77.7064 },
  { slug: 'patna', name: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376 },
  { slug: 'ranchi', name: 'Ranchi', state: 'Jharkhand', lat: 23.3441, lng: 85.3096 },
  { slug: 'guwahati', name: 'Guwahati', state: 'Assam', lat: 26.1445, lng: 91.7362 },
  { slug: 'raipur', name: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lng: 81.6296 },
  { slug: 'coimbatore', name: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lng: 76.9558 },
  { slug: 'madurai', name: 'Madurai', state: 'Tamil Nadu', lat: 9.9252, lng: 78.1198 },
  { slug: 'tiruchirappalli', name: 'Tiruchirappalli', state: 'Tamil Nadu', lat: 10.7905, lng: 78.7047 },
  { slug: 'tirunelveli', name: 'Tirunelveli', state: 'Tamil Nadu', lat: 8.7139, lng: 77.7567 },
  { slug: 'vijayawada', name: 'Vijayawada', state: 'Andhra Pradesh', lat: 16.5062, lng: 80.6480 },
  { slug: 'visakhapatnam', name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185 },
  { slug: 'tirupati', name: 'Tirupati', state: 'Andhra Pradesh', lat: 13.6288, lng: 79.4192 },
  { slug: 'mysuru', name: 'Mysuru', state: 'Karnataka', lat: 12.2958, lng: 76.6394 },
  { slug: 'mangaluru', name: 'Mangaluru', state: 'Karnataka', lat: 12.9141, lng: 74.8560 },
  { slug: 'hubballi', name: 'Hubballi', state: 'Karnataka', lat: 15.3647, lng: 75.1240 },
  { slug: 'thiruvananthapuram', name: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lng: 76.9366 },
  { slug: 'kozhikode', name: 'Kozhikode', state: 'Kerala', lat: 11.2588, lng: 75.7804 },
  { slug: 'thrissur', name: 'Thrissur', state: 'Kerala', lat: 10.5276, lng: 76.2144 },
  { slug: 'surat', name: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311 },
  { slug: 'vadodara', name: 'Vadodara', state: 'Gujarat', lat: 22.3072, lng: 73.1812 },
  { slug: 'rajkot', name: 'Rajkot', state: 'Gujarat', lat: 22.3039, lng: 70.8022 },
  { slug: 'jodhpur', name: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lng: 73.0243 },
  { slug: 'udaipur', name: 'Udaipur', state: 'Rajasthan', lat: 24.5854, lng: 73.7125 },
  { slug: 'kota', name: 'Kota', state: 'Rajasthan', lat: 25.2138, lng: 75.8648 },
  { slug: 'amritsar', name: 'Amritsar', state: 'Punjab', lat: 31.6340, lng: 74.8723 },
  { slug: 'ludhiana', name: 'Ludhiana', state: 'Punjab', lat: 30.9010, lng: 75.8573 },
  { slug: 'jalandhar', name: 'Jalandhar', state: 'Punjab', lat: 31.3260, lng: 75.5762 },
  { slug: 'dehradun', name: 'Dehradun', state: 'Uttarakhand', lat: 30.3165, lng: 78.0322 },
  { slug: 'roorkee', name: 'Roorkee', state: 'Uttarakhand', lat: 29.8543, lng: 77.8880 },
  { slug: 'shimla', name: 'Shimla', state: 'Himachal Pradesh', lat: 31.1048, lng: 77.1734 },
  { slug: 'jammu', name: 'Jammu', state: 'Jammu & Kashmir', lat: 32.7266, lng: 74.8570 },
  { slug: 'srinagar', name: 'Srinagar', state: 'Jammu & Kashmir', lat: 34.0837, lng: 74.7973 },
  { slug: 'goa', name: 'Goa', state: 'Goa', lat: 15.2993, lng: 74.1240 },
  { slug: 'puducherry', name: 'Puducherry', state: 'Puducherry', lat: 11.9416, lng: 79.8083 },
  { slug: 'nashik', name: 'Nashik', state: 'Maharashtra', lat: 19.9975, lng: 73.7898 },
  { slug: 'aurangabad', name: 'Aurangabad', state: 'Maharashtra', lat: 19.8762, lng: 75.3433 },
  { slug: 'kolhapur', name: 'Kolhapur', state: 'Maharashtra', lat: 16.7050, lng: 74.2433 },
  { slug: 'solapur', name: 'Solapur', state: 'Maharashtra', lat: 17.6599, lng: 75.9064 },
  { slug: 'amravati', name: 'Amravati', state: 'Maharashtra', lat: 20.9374, lng: 77.7796 },
];

/** A gazetteer city by slug. */
export function gazetteerCity(slug?: string): GazetteerCity | undefined {
  return slug ? CITY_GAZETTEER.find((c) => c.slug === slug) : undefined;
}

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
  { slug: 'web', name: 'Web search', kind: 'search', url: 'https://duckduckgo.com' },
  { slug: 'instagram', name: 'Instagram', kind: 'social', url: 'https://www.instagram.com' },
  { slug: 'linkedin', name: 'LinkedIn', kind: 'social', url: 'https://www.linkedin.com' },
  { slug: 'facebook', name: 'Facebook', kind: 'social', url: 'https://www.facebook.com' },
  { slug: 'luma', name: 'Luma', kind: 'events', url: 'https://lu.ma' },
  { slug: 'eventbrite', name: 'Eventbrite', kind: 'events', url: 'https://www.eventbrite.com' },
  { slug: 'knowafest', name: 'KnowAFest', kind: 'events', url: 'https://www.knowafest.com' },
  { slug: 'meetup', name: 'Meetup', kind: 'events', url: 'https://www.meetup.com' },
  { slug: 'college-sites', name: 'College websites', kind: 'college', url: '/how-it-works' },
  { slug: 'whatsapp', name: 'WhatsApp', kind: 'community', url: '/how-it-works' },
  { slug: 'communities', name: 'Discord & Telegram', kind: 'community', url: '/how-it-works' },
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

/** "navi-mumbai" → "Navi Mumbai", for city slugs outside the catalog. */
function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

/** A city's name: the catalog name, else the stored label, else the slug in title case. */
export function cityName(slug?: string, label?: string): string {
  if (!slug) return label || 'Online';
  return CITIES.find((c) => c.slug === slug)?.name ?? (label || titleFromSlug(slug));
}

/** Where an event is, for cards: "Online", or its city. */
export function placeName(h: { mode: string; city?: string; cityName?: string }): string {
  if (h.mode === 'online') return 'Online';
  return h.city || h.cityName ? cityName(h.city, h.cityName) : 'In person';
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
