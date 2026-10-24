import { describe, expect, it } from 'vitest';
import { datesFromText, eventTitle, linkInText, rotatingCities, splitPostSnippet } from '../src/connectors/leads';
import { NETWORKS, postPermalink, socialLead } from '../src/connectors/social';
import { pageCandidates, registerLink } from '../src/connectors/web';
import { BlockedError } from '../src/errors';
import { parsePage } from '../src/html';
import { CITIES } from '@hackathonfinder/shared';
import { duckDuckGo, parseBrave, parseCse, parseDdg } from '../src/search';
import { fakeHttp } from './helpers';

const NOW = new Date('2026-10-24T12:00:00+05:30');
const pune = CITIES.find((c) => c.slug === 'pune')!;

const ddgPage = `<html><body>
<div class="result results_links result--ad"><a class="result__a" href="//duckduckgo.com/y.js?ad=1">Ad</a></div>
<div class="result results_links"><a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.instagram.com%2Freel%2FDeJO7a9os7P%2F%3Figsh%3Dabc&rut=x">Fusion | Fusion 2k26 — 24-hour International Hackathon 14-15 ... - Instagram</a>
<a class="result__snippet">47 likes, 2 comments - fusion__2k26 on October 6, 2026: "FUSION 2K26 — 24-HOUR INTERNATIONAL HACKATHON 14-15 November SKNCOE, Vadgaon, Pune Prize Pool: ₹3,70,000. Scan the QR to register"</a></div>
<div class="result results_links"><a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.instagram.com%2Fpopular%2Fpune-hackathon-2026%2F">Pune Hackathon 2026 - Instagram</a><a class="result__snippet">Watch short videos</a></div>
<div class="result results_links"><a class="result__a" href="https://college.example.edu/hackfest">HackFest 2026 | Example College</a><a class="result__snippet">Register now</a></div>
</body></html>`;

describe('search results', () => {
  it('reads DuckDuckGo results without ads and decodes redirect links', () => {
    const results = parseDdg(ddgPage);
    expect(results.map((r) => r.url)).toEqual(['https://www.instagram.com/reel/DeJO7a9os7P/?igsh=abc', 'https://www.instagram.com/popular/pune-hackathon-2026/', 'https://college.example.edu/hackfest']);
  });

  it('stops at the challenge page and sends no more queries in that run', async () => {
    const page = '<html><title>DuckDuckGo</title><div class="anomaly-modal">Unfortunately, bots use DuckDuckGo too.</div></html>';
    expect(() => parseDdg(page)).toThrow(BlockedError);
    const http = fakeHttp({ 'https://html.duckduckgo.com/html/': () => new Response(page, { status: 202, headers: { 'content-type': 'text/html' } }) });
    const ddg = duckDuckGo(http);
    await expect(ddg.search('hackathon pune')).rejects.toBeInstanceOf(BlockedError);
    await expect(ddg.search('hackathon mumbai')).rejects.toBeInstanceOf(BlockedError);
    expect(http.calls.filter((c) => c.includes('/html/?q=')).length).toBe(1);
  });

  it('reads Google Custom Search and Brave API results', () => {
    expect(parseCse({ items: [{ link: 'https://a.example/x', title: 'A', snippet: 'S', pagemap: { metatags: [{ 'og:image': 'https://a.example/i.png' }] } }] })).toEqual([{ url: 'https://a.example/x', title: 'A', snippet: 'S', image: 'https://a.example/i.png' }]);
    expect(parseBrave({ web: { results: [{ url: 'https://b.example/y', title: 'B', description: 'D' }] } })[0]).toMatchObject({ url: 'https://b.example/y', snippet: 'D' });
  });
});

describe('social leads from search snippets', () => {
  it('turns one Instagram post into a review-queue lead with QR registration', () => {
    const [reel, popular] = parseDdg(ddgPage);
    expect(socialLead(popular, NETWORKS.instagram, { now: NOW, city: pune })).toBeNull();
    const lead = socialLead(reel, NETWORKS.instagram, { now: NOW, city: pune })!;
    expect(lead.url).toBe('https://www.instagram.com/reel/DeJO7a9os7P/');
    expect(lead.title).toBe('Fusion 2k26 — 24-hour International Hackathon');
    expect(lead.data.city).toBe('pune');
    expect(lead.data.mode).toBe('offline');
    // "14-15 November" read with the post's date (6 Oct 2026) for the year.
    expect(lead.data.startDate).toBe(new Date('2026-11-14T09:00:00+05:30').toISOString());
    expect(lead.data.endDate).toBe(new Date('2026-11-15T18:00:00+05:30').toISOString());
    expect(lead.data.registrationVia).toBe('qr');
    expect(lead.data.registrationUrl).toBe('https://www.instagram.com/reel/DeJO7a9os7P/');
    expect(lead.data.flags?.join(' ')).toMatch(/Found on Instagram via web search/);
    expect(lead.data.flags?.join(' ')).toMatch(/QR code/);
  });

  it('only accepts real post links', () => {
    expect(postPermalink('https://www.instagram.com/p/Cxyz12345/?igsh=1', NETWORKS.instagram)).toBe('https://www.instagram.com/p/Cxyz12345/');
    expect(postPermalink('https://www.instagram.com/agrihackathon/', NETWORKS.instagram)).toBeUndefined();
    expect(postPermalink('https://www.linkedin.com/posts/gdg-pune_hackathon-activity-123', NETWORKS.linkedin)).toBe('https://www.linkedin.com/posts/gdg-pune_hackathon-activity-123/');
    expect(postPermalink('https://www.facebook.com/events/123456789/', NETWORKS.facebook)).toBe('https://www.facebook.com/events/123456789/');
  });

  it('reads post dates, event dates and links from captions', () => {
    expect(splitPostSnippet('856 likes, 43 comments - iqooind on September 3, 2026: "Pune, are you ready?"')).toMatchObject({ text: 'Pune, are you ready?' });
    const d = datesFromText('Event Date: 29–30 October 2026 Registration Deadline: 27 October 2026', NOW);
    expect(d.start?.toISOString()).toBe(new Date('2026-10-29T09:00:00+05:30').toISOString());
    expect(d.deadline?.toISOString()).toBe(new Date('2026-10-27T23:59:00+05:30').toISOString());
    expect(datesFromText('Join us on Nov 28, 2026 at the campus', NOW).start?.toISOString()).toBe(new Date('2026-11-28T09:00:00+05:30').toISOString());
    expect(eventTitle('InsideNMIET | Innovators Hackathon 2026 happening on 22 ... - Instagram')).toBe('Innovators Hackathon 2026');
    expect(eventTitle('iQOO India | Pune, are you ready? iQOO Hackathon 2026 ... - Instagram')).toBe('iQOO Hackathon 2026');
    expect(linkInText('Register: forms.gle/abc123 and follow @club', /instagram/)).toBe('https://forms.gle/abc123');
    expect(linkInText('see instagram.com/p/xyz', /(^|\.)instagram\.com$/)).toBeUndefined();
  });

  it('rotates through every catalog city', () => {
    const seen = new Set<string>();
    for (let h = 0; h < 10; h++) for (const c of rotatingCities(new Date(NOW.getTime() + h * 12 * 3600_000), 3)) seen.add(c.slug);
    expect(seen.size).toBe(CITIES.length);
  });
});

describe('web pages', () => {
  it('reads a schema.org Event from a college page as a lead', () => {
    const html = `<html><head><title>HackFest 2026</title><meta property="og:image" content="https://college.example.edu/poster.jpg"></head><body>
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"Event","name":"HackFest 2026","startDate":"2026-11-20T09:00:00+05:30","endDate":"2026-11-21T18:00:00+05:30","eventAttendanceMode":"https://schema.org/OfflineEventAttendanceMode","location":{"@type":"Place","name":"Example College","address":{"@type":"PostalAddress","addressLocality":"Pune","addressRegion":"Maharashtra","addressCountry":"IN"}}}</script>
      <a href="https://forms.gle/xyz">Register here</a></body></html>`;
    const page = { ...parsePage(html, 'https://college.example.edu/hackfest'), status: 200 };
    const [c] = pageCandidates(page, { now: NOW, city: pune, listingSource: 'web' });
    expect(c.title).toBe('HackFest 2026');
    expect(c.data.city).toBe('Pune');
    expect(c.data.country).toBe('India');
    expect(c.data.imageUrl).toBe('https://college.example.edu/poster.jpg');
    expect(c.data.flags?.[0]).toMatch(/web search/);
    expect(registerLink(page)).toBe('https://forms.gle/xyz');
  });

  it('skips round-up pages', () => {
    const page = { ...parsePage('<html><head><title>Top 10 hackathons in Pune 2026</title></head><body>Nov 28, 2026</body></html>', 'https://blog.example/top'), status: 200 };
    expect(pageCandidates(page, { now: NOW, listingSource: 'web' })).toEqual([]);
  });
});
