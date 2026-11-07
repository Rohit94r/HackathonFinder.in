import { cityFromText } from '@hackathonfinder/ai';
import * as cheerio from 'cheerio';
import { eventToCandidate, readJsonLd } from '../html';
import { errorMessage } from '../errors';
import type { Connector, ConnectorContext, RawCandidate } from '../types';
import { arr, isObj, url } from './util';

// lablab.ai lists its AI hackathons (newest first) as a schema.org ItemList, and
// each event page carries a schema.org Event with dates and the banner. Past events
// stay in the list, so only the newest few pages are read; ended ones are rejected.

const LIST = 'https://lablab.ai/ai-hackathons';
const MAX_EVENTS = 12;

/** Event page URLs from the list page's JSON-LD ItemList, in order. */
export function lablabEventUrls(html: string): string[] {
  const $ = cheerio.load(html);
  const urls: string[] = [];
  const visit = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!isObj(node)) return;
    if (node['@type'] === 'ItemList') {
      for (const item of arr(node.itemListElement)) {
        const u = isObj(item) ? url(item.url ?? item.item, LIST) : undefined;
        if (u && /^https:\/\/lablab\.ai\/ai-hackathons\/[a-z0-9-]+\/?$/i.test(u) && !urls.includes(u)) urls.push(u);
      }
    }
    if (Array.isArray(node['@graph'])) visit(node['@graph']);
  };
  readJsonLd($).forEach(visit);
  return urls;
}

/**
 * The page's Event as a candidate. lablab hackathons are built online; "Mixed" attendance
 * adds an optional on-site day (abroad, venue not given), so those are remote-first hybrids.
 */
export function lablabCandidate(pageUrl: string, events: Record<string, unknown>[]): RawCandidate | null {
  const ev = events[0];
  if (!ev) return null;
  const c = eventToCandidate(ev, pageUrl);
  if (!c) return null;
  const inIndia = Boolean(cityFromText(`${c.data.city ?? ''} ${c.data.address ?? ''} ${c.data.venue ?? ''}`)) || /india/i.test(c.data.country ?? '');
  if (c.data.mode !== 'online' && !inIndia) {
    const hasVenue = Boolean(c.data.city || c.data.venue || c.data.address);
    // A stated venue abroad with in-person attendance only stays in-person (and is rejected).
    if (c.data.mode === 'hybrid' || !hasVenue) c.data = { ...c.data, mode: 'hybrid', remoteOk: true, country: c.data.country ?? 'Outside India' };
  }
  c.data = { ...c.data, country: c.data.mode === 'online' ? 'Global' : c.data.country, tags: ['AI'] };
  return { ...c, externalId: pageUrl.replace(/\/$/, '').split('/').pop(), url: pageUrl };
}

export const lablab: Connector = {
  slug: 'lablab',
  name: 'lablab.ai',
  kind: 'platform',
  defaultSchedule: '0 2,8,14,20 * * *',
  description: 'AI hackathons from lablab.ai (schema.org events on each page; online, worldwide).',
  trust: 0.85,
  extract: 'missing',
  complete: true,
  async fetch(ctx: ConnectorContext): Promise<RawCandidate[]> {
    const list = await ctx.http.fetchHtml(LIST);
    const urls = lablabEventUrls(list.html).slice(0, Math.min(MAX_EVENTS, ctx.limit));
    const out: RawCandidate[] = [];
    for (const pageUrl of urls) {
      try {
        const page = await ctx.http.fetchHtml(pageUrl);
        const c = lablabCandidate(page.url, page.events);
        if (c) out.push(c);
      } catch (err) {
        ctx.warn(`lablab: ${pageUrl}: ${errorMessage(err)}`);
      }
    }
    ctx.log(`lablab: ${out.length} of the ${urls.length} newest events read`);
    return out;
  },
};
