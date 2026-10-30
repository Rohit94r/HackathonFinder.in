// Sites with public event catalogues that do not have a dedicated connector. The
// deep web source reads their sitemaps and event pages. Hosts covered by a platform
// connector (Unstop, Devfolio, Devpost, MLH, HackerEarth, lablab, KnowAFest) are
// deliberately absent: their own connectors read them more accurately.

export interface SitemapSeed {
  origin: string;
  /** SOURCES slug used for listings found through this seed. */
  source: string;
  name: string;
  /** Platform-specific URL shape. Defaults to the generic event-URL filter. */
  filter?: (url: string) => boolean;
}

const lumaEvent = (url: string) => /^https:\/\/lu\.ma\/(?!discover|explore|home|login|signin|about|pricing)[a-z0-9-]+\/?$/i.test(url);
const eventbriteEvent = (url: string) => /\/e\/[a-z0-9-]+/i.test(url);
const townscriptEvent = (url: string) => /\/(?:e|event)\/[a-z0-9-]+/i.test(url);
const meetupEvent = (url: string) => /\/events\/\d+/i.test(url);
const commudleEvent = (url: string) => /\/events?\//i.test(url);
const techgigEvent = (url: string) => /\/(?:hackathon|challenge|competition|contest)/i.test(url);
const alleventsEvent = (url: string) => /\/(?:events?|hackathon|hackfest|fest|competition|challenge)\//i.test(url);

export const SITEMAP_SEEDS: SitemapSeed[] = [
  { origin: 'https://hack2skill.com', source: 'hack2skill', name: 'Hack2skill' },
  { origin: 'https://dorahacks.io', source: 'dorahacks', name: 'DoraHacks' },
  { origin: 'https://konfhub.com', source: 'konfhub', name: 'Konfhub' },
  { origin: 'https://www.townscript.com', source: 'townscript', name: 'Townscript', filter: townscriptEvent },
  { origin: 'https://allevents.in', source: 'allevents', name: 'AllEvents', filter: alleventsEvent },
  { origin: 'https://lu.ma', source: 'luma', name: 'Luma', filter: lumaEvent },
  { origin: 'https://www.eventbrite.co.in', source: 'eventbrite', name: 'Eventbrite India', filter: eventbriteEvent },
  { origin: 'https://www.commudle.com', source: 'commudle', name: 'Commudle', filter: commudleEvent },
  { origin: 'https://www.techgig.com', source: 'techgig', name: 'TechGig', filter: techgigEvent },
  { origin: 'https://www.meetup.com', source: 'meetup', name: 'Meetup', filter: meetupEvent },
];

/** A rotating slice, so one run does not hammer every platform. */
export function sitemapSeedsForRun(now: Date, count = 6): SitemapSeed[] {
  const n = Math.max(1, Math.min(SITEMAP_SEEDS.length, count));
  const halfDay = Math.floor(now.getTime() / (12 * 3600_000));
  const start = halfDay % SITEMAP_SEEDS.length;
  return Array.from({ length: n }, (_, i) => SITEMAP_SEEDS[(start + i) % SITEMAP_SEEDS.length]);
}
