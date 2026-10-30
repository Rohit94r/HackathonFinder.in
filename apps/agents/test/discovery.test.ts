import { describe, expect, it } from 'vitest';
import { CITIES } from '@hackathonfinder/shared';
import { eventLinks, shouldCrawl } from '../src/discovery/crawl';
import { discoveryQueries } from '../src/discovery/queries';
import { isEventUrl, parseSitemap, sitemapsInRobots } from '../src/discovery/sitemap';
import { sitemapSeedsForRun } from '../src/discovery/seeds';
import { snippetCandidate, web } from '../src/connectors/web';
import { braveSearch, duckDuckGo, googleCse } from '../src/search';
import type { ConnectorContext } from '../src/types';
import { fakeHttp, json } from './helpers';

const NOW = new Date('2026-10-24T12:00:00+05:30');

describe('discovery query matrix', () => {
  it('covers cities, college domains, platforms and states', () => {
    const queries = discoveryQueries(NOW, { max: 200, cities: [CITIES[0]] });
    const text = queries.map((q) => q.query).join('\n');
    expect(text).toMatch(/hackathon Pune 2026 registration/i);
    expect(text).toMatch(/site:ac\.in hackathon 2026/i);
    expect(text).toMatch(/site:hack2skill\.com hackathon India 2026/i);
    const states = [...new Set(CITIES.map((c) => c.state))];
    expect(states.some((state) => text.includes(`hackathon ${state} 2026`))).toBe(true);
    expect(queries.some((q) => q.city?.slug === 'pune')).toBe(true);
  });

  it('dedupes and caps the list', () => {
    const queries = discoveryQueries(NOW, { max: 12 });
    expect(queries).toHaveLength(12);
    expect(new Set(queries.map((q) => q.query.toLowerCase())).size).toBe(queries.length);
  });

  it('keeps every category represented at the default cap', () => {
    const queries = discoveryQueries(NOW, { max: 48 });
    expect(new Set(queries.map((q) => q.kind))).toEqual(new Set(['city', 'india', 'month', 'college', 'platform', 'state']));
  });

  it('can run a smaller non-deep matrix', () => {
    const deep = discoveryQueries(NOW, { max: 200, deep: true });
    const shallow = discoveryQueries(NOW, { max: 200, deep: false });
    expect(deep.length).toBeGreaterThan(shallow.length);
  });
});

describe('sitemaps', () => {
  it('reads URL sets and sitemap indexes', () => {
    const xml = `<?xml version="1.0"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>https://example.com/hackathon/one</loc><lastmod>2026-10-01</lastmod></url>
        <url><loc>https://example.com/blog/post</loc></url>
      </urlset>`;
    const parsed = parseSitemap(xml);
    expect(parsed.urls).toEqual([{ loc: 'https://example.com/hackathon/one', lastmod: '2026-10-01' }, { loc: 'https://example.com/blog/post', lastmod: undefined }]);

    const index = `<sitemapindex><sitemap><loc>https://example.com/sitemap-events.xml</loc></sitemap></sitemapindex>`;
    expect(parseSitemap(index).sitemaps).toEqual(['https://example.com/sitemap-events.xml']);

    const rss = `<rss><channel><item><title>Hackathon</title><link>https://example.com/hackathon/rss-one</link><pubDate>Mon, 20 Oct 2026</pubDate></item></channel></rss>`;
    expect(parseSitemap(rss).urls).toEqual([{ loc: 'https://example.com/hackathon/rss-one', lastmod: 'Mon, 20 Oct 2026' }]);

    const atom = `<feed><entry><title>Ideathon</title><link href="https://example.com/ideathon/atom-one"/><updated>2026-10-20T00:00:00Z</updated></entry></feed>`;
    expect(parseSitemap(atom).urls).toEqual([{ loc: 'https://example.com/ideathon/atom-one', lastmod: '2026-10-20T00:00:00Z' }]);
  });

  it('finds Sitemap: lines in robots.txt and filters event URLs', () => {
    expect(sitemapsInRobots('User-agent: *\nSitemap: /sitemap.xml\n', 'https://example.com')).toEqual(['https://example.com/sitemap.xml']);
    expect(isEventUrl('https://college.ac.in/hackathon/2026')).toBe(true);
    expect(isEventUrl('https://college.ac.in/hackathon2026')).toBe(true);
    expect(isEventUrl('https://college.ac.in/blog/2026')).toBe(false);
    expect(isEventUrl('https://lu.ma/abc123')).toBe(false);
  });

  it('rotates sitemap seeds and uses platform-specific shapes', () => {
    const seeds = sitemapSeedsForRun(NOW, 4);
    expect(seeds).toHaveLength(4);
    const luma = sitemapSeedsForRun(NOW, 10).find((s) => s.source === 'luma');
    expect(luma?.filter?.('https://lu.ma/abc123')).toBe(true);
    expect(luma?.filter?.('https://lu.ma/discover')).toBe(false);
  });
});

describe('list-page crawling', () => {
  const html = `<html><body>
    <a href="/hackathon/ai-sprint-2026">AI Sprint Hackathon 2026</a>
    <a href="/event/code-rush">Code Rush</a>
    <a href="/about">About us</a>
    <a href="https://instagram.com/p/abc">Hackathon post</a>
    <a href="/register">Register</a>
    <a href="/hackathon/ai-sprint-2026#top">AI Sprint again</a>
  </body></html>`;

  it('keeps event-looking links, same host, without login/social links', () => {
    const links = eventLinks({ html, url: 'https://college.ac.in/fest' });
    expect(links).toContain('https://college.ac.in/hackathon/ai-sprint-2026');
    expect(links).toContain('https://college.ac.in/event/code-rush');
    expect(links).not.toContain('https://college.ac.in/about');
    expect(links.some((u) => u.includes('instagram.com'))).toBe(false);
    expect(links.filter((u) => u.includes('ai-sprint-2026'))).toHaveLength(1);
  });

  it('recognises list pages from the title and several event links', () => {
    expect(shouldCrawl({ html, url: 'https://college.ac.in/fest', events: [], meta: { title: 'Upcoming hackathons in Pune' } })).toBe(true);
    expect(shouldCrawl({ html: '<a href="/hackathon/x">Hackathon X</a>', url: 'https://college.ac.in/x', events: [], meta: { title: 'Hackathon X' } })).toBe(false);
  });
});

describe('snippet leads', () => {
  it('turns a complete search snippet into a candidate', () => {
    const c = snippetCandidate(
      {
        url: 'https://college.ac.in/hackathon/ai-sprint',
        title: 'AI Sprint Hackathon 2026 — 20-21 November 2026',
        snippet: 'AI Sprint hackathon at Pune. Register by 15 November 2026. ₹50,000 prize pool.',
      },
      { now: NOW, listingSource: 'web' }
    );
    expect(c).not.toBeNull();
    expect(c?.title).toMatch(/AI Sprint/i);
    expect(c?.data.city).toBe('pune');
    expect(c?.data.startDate).toBeTruthy();
    expect(c?.data.registrationDeadline).toBeTruthy();
  });

  it('ignores a snippet with no event date', () => {
    const c = snippetCandidate(
      { url: 'https://college.ac.in/hackathon/ai-sprint', title: 'AI Sprint Hackathon', snippet: 'Registration is open.' },
      { now: NOW, listingSource: 'web' }
    );
    expect(c).toBeNull();
  });
});

describe('deep web connector', () => {
  it('reads search results, follows list-page links and dedupes candidates', async () => {
    const eventPage = (title: string) => `<html><head><title>${title}</title></head><body>
      <script type="application/ld+json">${JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: title,
        startDate: '2026-11-20T09:00:00+05:30',
        endDate: '2026-11-21T18:00:00+05:30',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: { '@type': 'Place', name: 'Example College', address: { '@type': 'PostalAddress', addressLocality: 'Pune', addressRegion: 'Maharashtra', addressCountry: 'IN' } },
      })}</script></body></html>`;
    const listPage = `<html><head><title>Upcoming hackathons in Pune</title></head><body>
      <a href="/hackathon/one">Hack One 2026</a>
      <a href="/hackathon/two">Hack Two 2026</a>
      <a href="/about">About</a>
    </body></html>`;
    const http = fakeHttp({
      'https://www.googleapis.com/customsearch/v1': () =>
        json({
          items: [
            { link: 'https://college.example/hackathon/one', title: 'Hack One 2026', snippet: '20-21 November 2026 Pune' },
            { link: 'https://college.example/fest', title: 'Upcoming hackathons in Pune', snippet: 'A list of college hackathons' },
          ],
        }),
      'https://college.example/hackathon/one': () => new Response(eventPage('Hack One 2026'), { headers: { 'content-type': 'text/html' } }),
      'https://college.example/hackathon/two': () => new Response(eventPage('Hack Two 2026'), { headers: { 'content-type': 'text/html' } }),
      'https://college.example/fest': () => new Response(listPage, { headers: { 'content-type': 'text/html' } }),
    });
    const logs: string[] = [];
    const progress: string[] = [];
    const ctx: ConnectorContext = {
      http,
      source: {
        slug: 'web',
        name: 'Web search',
        config: { maxQueries: 2, citiesPerRun: 1, maxPages: 5, crawlDepth: 1, maxCrawlPages: 2, sitemaps: false, snippets: false },
      },
      limit: 10,
      now: NOW,
      env: { GOOGLE_CSE_KEY: 'key', GOOGLE_CSE_CX: 'cx' } as NodeJS.ProcessEnv,
      log: (line) => logs.push(line),
      progress: (line) => progress.push(line),
      warn: () => {},
    };
    const out = await web.fetch(ctx);
    expect(logs.some((line) => line.includes('search 1/'))).toBe(true);
    expect(progress.some((line) => line.startsWith('Web search:'))).toBe(true);
    expect(out.map((c) => c.title)).toContain('Hack One 2026');
    expect(out.map((c) => c.title)).toContain('Hack Two 2026');
    expect(new Set(out.map((c) => c.url)).size).toBe(out.length);
  });
});

describe('search paging', () => {
  it('pages Google Custom Search with start=11 on page 2', async () => {
    const http = fakeHttp({
      'https://www.googleapis.com/customsearch/v1': () => json({ items: [{ link: 'https://college.ac.in/hackathon/one', title: 'Hackathon One', snippet: '20 November 2026' }] }),
    });
    const provider = googleCse(http, { GOOGLE_CSE_KEY: 'key', GOOGLE_CSE_CX: 'cx' } as NodeJS.ProcessEnv);
    const results = await provider!.search('hackathon', { page: 1 });
    expect(results[0]?.url).toBe('https://college.ac.in/hackathon/one');
    expect(http.calls[0]).toContain('start=11');
  });

  it('pages Brave with offset=1 on page 2', async () => {
    const http = fakeHttp({
      'https://api.search.brave.com/res/v1/web/search': () => json({ web: { results: [{ url: 'https://college.ac.in/hackathon/one', title: 'Hackathon One', description: '20 November 2026' }] } }),
    });
    const provider = braveSearch(http, { BRAVE_SEARCH_API_KEY: 'key' } as NodeJS.ProcessEnv);
    const results = await provider!.search('hackathon', { page: 1 });
    expect(results[0]?.url).toBe('https://college.ac.in/hackathon/one');
    expect(http.calls.find((c) => c.includes('api.search.brave.com'))).toContain('offset=1');
  });

  it('pages DuckDuckGo with s=30 on page 2', async () => {
    const http = fakeHttp({
      'https://html.duckduckgo.com/html/': `<div class="result"><a class="result__a" href="https://college.ac.in/hackathon/one">Hackathon One</a><div class="result__snippet">20 November 2026</div></div>`,
    });
    const provider = duckDuckGo(http);
    const results = await provider.search('hackathon', { page: 1 });
    expect(results[0]?.url).toBe('https://college.ac.in/hackathon/one');
    expect(http.calls.find((c) => c.includes('html.duckduckgo.com/html/'))).toContain('s=30');
  });
});
