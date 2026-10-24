import { describe, expect, it } from 'vitest';
import { devfolioCandidate } from '../src/connectors/devfolio';
import { devpostCandidate, devpostImage, devpostPrize, placeInIndia } from '../src/connectors/devpost';
import { hackerearthCandidate } from '../src/connectors/hackerearth';
import { knowafest, knowafestApplyPage, knowafestCandidate, knowafestFee } from '../src/connectors/knowafest';
import { lablab, lablabCandidate, lablabEventUrls } from '../src/connectors/lablab';
import { writeCopy } from '../src/pipeline/refresh';
import { placeRules } from '../src/run';
import { mlhCandidate, mlhEvents, mlhSeason } from '../src/connectors/mlh';
import { unstop, unstopApplyDetail, unstopCandidate, unstopEventDates, unstopPrizes } from '../src/connectors/unstop';
import { parsePage } from '../src/html';
import { normalize } from '../src/pipeline/normalize';
import { validate } from '../src/pipeline/validate';
import type { ConnectorContext } from '../src/types';
import { fakeHttp, fixture, fixtureJson, json } from './helpers';

const NOW = new Date('2026-10-24T12:00:00+05:30');

function ctx(http = fakeHttp({}), limit = Infinity): ConnectorContext {
  return { http, source: { slug: 'test', name: 'Test', config: {} }, limit, now: NOW, env: {}, log: () => {}, warn: () => {} };
}

describe('unstop', () => {
  const rows = fixtureJson('unstop-list.json').data.data;

  it('maps an online listing with a prize pool', () => {
    const c = unstopCandidate(rows.find((r: any) => r.id === 1773842))!;
    expect(c.externalId).toBe('1773842');
    expect(c.url).toBe('https://unstop.com/hackathons/next-horizon-2026-the-institution-of-engineers-and-scientists-1773842');
    expect(c.data.mode).toBe('online');
    expect(c.data.city).toBeUndefined();
    expect(c.data.prizePool).toBe(150000);
    expect(c.data.prizeCurrency).toBe('INR');
    expect(c.data.teamMin).toBe(2);
    expect(c.data.teamMax).toBe(4);
    expect(c.data.registrationDeadline).toBe(new Date('2026-11-06T00:00:00+05:30').toISOString());
    expect(c.data.fee).toBe(0);
    expect(c.data.logoUrl).toMatch(/^https:\/\/d8it4huxumps7\.cloudfront\.net\//);
    expect(c.data.eligibility).toContain('students');
  });

  it('maps an in-person paid listing with its venue and fee', () => {
    const c = unstopCandidate(rows.find((r: any) => r.id === 1773178))!;
    expect(c.data.mode).toBe('offline');
    expect(c.data.city).toBe('Pune');
    expect(c.data.region).toBe('Maharashtra');
    expect(c.data.venue).toMatch(/Marathwada Mitramandal College of Engineering/);
    expect(c.data.isPaid).toBe(true);
    expect(c.data.fee).toBe(590);
    const d = normalize(c, unstop, { now: NOW });
    expect(d.city).toBe('pune');
    expect(d.cityName).toBeUndefined();
    expect(d.point).toEqual({ lat: 18.5204, lng: 73.8567, exact: false });
  });

  it('labels a city outside the catalog', () => {
    const c = unstopCandidate(rows.find((r: any) => r.id === 1773705))!;
    const d = normalize(c, unstop, { now: NOW });
    expect(d.mode).toBe('hybrid');
    expect(d.city).toBe('raebareli');
    expect(d.cityName).toBe('Raebareli');
    expect(d.region).toBe('Uttar Pradesh');
  });

  it('reads the banner, event dates and fee from the competition page', () => {
    const row = fixtureJson('unstop-row-1773246.json');
    const comp = fixtureJson('unstop-detail.json').data.competition;
    const c = unstopApplyDetail(unstopCandidate(row)!, comp);
    expect(c.data.imageUrl).toBe('https://d8it4huxumps7.cloudfront.net/lambda-pdfs/opportunity-bannerImages/1792609396.png');
    // The first round after the deadline is the start; the finale's end is the end.
    expect(c.data.startDate).toBe(new Date('2027-01-09T00:01:50+05:30').toISOString());
    expect(c.data.endDate).toBe(new Date('2027-02-06T16:00:16+05:30').toISOString());
    expect(c.data.registrationDeadline).toBe(new Date('2027-01-08T23:59:32+05:30').toISOString());
    expect(c.data.fee).toBe(299);
    const d = normalize(c, unstop, { now: NOW });
    expect(validate(d, NOW, { isNew: true })).toEqual({ ok: true });
  });

  const t = (s: string) => new Date(`${s}+05:30`);
  const iso = (s: string) => t(s).toISOString();

  it('takes the event row of the timeline, with its end from the description (Next Horizon)', () => {
    const r = unstopEventDates({
      deadline: t('2026-11-06T00:00:00'),
      opens: t('2026-10-23T00:00:00'),
      closes: t('2026-11-06T00:00:00'),
      rows: [
        { title: 'Last Date of Idea Submission', start: t('2026-11-15T12:15:26') },
        { title: 'Shortlisting of Teams', start: t('2026-11-16T12:15:57') },
        { title: 'Hackathon & Final Presentations to Grand Jury', start: t('2026-11-28T09:00:53') },
        { title: 'Announcement of Winners, certificate and prize distribution', start: t('2026-12-04T12:17:28') },
      ],
      text: 'Timeline & Duration Hackathon Dates: November 28-29, 2026 (2 days) Registration Deadline: November 15, 2026',
    });
    expect(r.start?.toISOString()).toBe(iso('2026-11-28T09:00:53'));
    expect(r.end?.toISOString()).toBe(iso('2026-11-29T18:00:00'));
  });

  it('uses an offline round as the event (Competitive Programming)', () => {
    const r = unstopEventDates({
      deadline: t('2026-11-15T18:30:00'),
      opens: t('2026-10-18T00:00:00'),
      closes: t('2026-11-20T18:30:00'),
      rows: [{ title: 'Offline Round', start: t('2026-11-20T16:30:00'), end: t('2026-11-20T18:30:00') }],
    });
    expect([r.start?.toISOString(), r.end?.toISOString()]).toEqual([iso('2026-11-20T16:30:00'), iso('2026-11-20T18:30:00')]);
  });

  it('reads "Hackathon: 28–29 October" when the timeline only has paperwork (Yantravedh)', () => {
    const r = unstopEventDates({
      deadline: t('2026-10-28T00:59:00'),
      opens: t('2026-10-10T00:00:00'),
      closes: t('2026-10-28T00:59:00'),
      rows: [{ title: 'Submit Your Registration confirmation here', start: t('2026-10-10T22:11:00'), end: t('2026-10-27T23:59:00') }],
      text: 'Event Highlights: Hackathon: 28–29 October 2026 Duration: 24 Hours Project Exhibition: 29 October 2026',
    });
    expect([r.start?.toISOString(), r.end?.toISOString()]).toEqual([iso('2026-10-28T09:00:00'), iso('2026-10-29T18:00:00')]);
  });

  it('starts at the first real step after registration (Hack-to-Ween)', () => {
    const r = unstopEventDates({
      deadline: t('2026-10-29T23:59:00'),
      opens: t('2026-10-24T00:00:00'),
      closes: t('2026-11-29T23:59:00'),
      rows: [
        { title: 'Registration Deadline', start: t('2026-10-29T23:59:28') },
        { title: 'Problem Statement', start: t('2026-10-31T12:00:26') },
        { title: 'Registrations Start', start: t('2026-10-24T00:00:00'), end: t('2026-11-29T23:59:00') },
      ],
    });
    expect([r.start?.toISOString(), r.end?.toISOString()]).toEqual([iso('2026-10-31T12:00:26'), iso('2026-11-29T23:59:00')]);
  });

  it('falls back to Unstop’s own dates, never the deadline (CodeOdyssey)', () => {
    const r = unstopEventDates({ deadline: t('2026-11-20T01:40:38'), opens: t('2026-10-20T00:00:00'), closes: t('2026-11-20T01:40:38'), rows: [], text: 'Build your project within the announced timeline' });
    expect([r.start?.toISOString(), r.end?.toISOString()]).toEqual([iso('2026-10-20T00:00:00'), iso('2026-11-20T01:40:38')]);
    expect(unstopEventDates({ deadline: t('2026-11-20T01:40:38'), rows: [] })).toEqual({});
  });

  it('counts only cash prizes toward the pool', () => {
    const p = unstopPrizes([
      { rank: 'Winner', cash: 5000, prize_type: 'cash' },
      { rank: 'Runner up', cash: 3000, prize_type: 'cash' },
      { rank: 'In-Kind Prizes Worth', cash: 90000, prize_type: 'kind' },
      { rank: '1', cash: null, prize_type: 'kind', others: 'Goodies' },
    ]);
    expect(p.pool).toBe(8000);
    expect(p.lines).toEqual(['Winner: ₹5,000', 'Runner up: ₹3,000', 'In-Kind Prizes Worth: ₹90,000 (in kind)']);
    expect(unstopPrizes([{ rank: 'Prize Pool', cash: 1000, currency: 'fa-dollar', prize_type: 'cash' }])).toMatchObject({ pool: 1000, currency: 'USD' });
  });

  it('fetches the list API and the competition page through the client', async () => {
    const http = fakeHttp({
      'https://unstop.com/api/public/opportunity/search-result': fixture('unstop-list.json'),
      'https://unstop.com/api/public/competition/1773246': fixture('unstop-detail.json'),
    });
    const list = await unstop.fetch(ctx(http));
    expect(list.map((c) => c.externalId)).toEqual(['1773842', '1773178', '1773705']);
    const detailed = await unstop.detail!(unstopCandidate(fixtureJson('unstop-row-1773246.json'))!, ctx(http));
    expect(detailed.data.imageUrl).toMatch(/opportunity-bannerImages/);
    expect(http.calls.some((c) => c.includes('/robots.txt'))).toBe(true);
  });
});

describe('devfolio', () => {
  const hits = fixtureJson('devfolio.json').hits.hits.map((h: any) => h._source);

  it('maps an in-person event in India with its cover image', () => {
    const c = devfolioCandidate(hits.find((h: any) => h.slug === 'version-beta-9'))!;
    expect(c.url).toBe('https://version-beta-9.devfolio.co/');
    expect(c.data.mode).toBe('offline');
    expect(c.data.city).toBe('Bhopal');
    expect(c.data.country).toBe('India');
    expect(c.data.imageUrl).toBe('https://assets.devfolio.co/hackathons/235fc76a63434ffe9b5aa63dea440833/assets/cover/424.png');
    expect(c.data.registrationDeadline).toBe('2026-10-24T18:29:00+00:00');
    expect(c.data.teamMin).toBe(2);
    expect(c.data.teamMax).toBe(4);
  });

  it('rejects in-person events abroad and keeps online ones', () => {
    const abroad = normalize(devfolioCandidate(hits.find((h: any) => h.slug === 'agentverse'))!, { slug: 'devfolio', trust: 0.9 }, { now: NOW });
    expect(validate(abroad, NOW, { isNew: true })).toMatchObject({ ok: false, reason: expect.stringMatching(/outside India/) });
    const online = devfolioCandidate(hits.find((h: any) => h.slug === 'hackodisha-6a'))!;
    expect(online.data.mode).toBe('online');
    expect(online.data.city).toBeUndefined();
  });
});

describe('devpost', () => {
  const rows = fixtureJson('devpost.json').hackathons;

  it('maps an online hackathon: dates, prize, larger image', () => {
    const c = devpostCandidate(rows[0], NOW)!;
    expect(c.data.mode).toBe('online');
    expect(c.data.prizePool).toBe(50000);
    expect(c.data.prizeCurrency).toBe('USD');
    expect(c.data.imageUrl).toMatch(/^https:\/\/d112y698adiu2z\.cloudfront\.net\/.+\/large\.png$/);
    expect(c.data.registrationDeadline).toBe(c.data.endDate);
    expect(c.data.deadlineAssumed).toBe(true);
  });

  it('treats a venue that is not clearly in India as abroad, and skips invite-only', () => {
    const cal = devpostCandidate(rows.find((r: any) => r.id === 29871), NOW)!;
    expect(cal.data.mode).toBe('offline');
    expect(cal.data.country).toBe('Outside India');
    expect(devpostCandidate(rows.find((r: any) => r.invite_only), NOW)).toBeNull();
    expect(placeInIndia('IIT Bombay, Mumbai')).toBe(true);
    expect(placeInIndia('Palace of Fine Arts')).toBe(false);
  });

  it('reads only dollar and rupee prizes', () => {
    expect(devpostPrize('$<span data-currency-value>83,328</span>')).toEqual({ amount: 83328, currency: 'USD' });
    expect(devpostPrize('€<span>10,000</span>')).toBeUndefined();
    expect(devpostImage('//x.cloudfront.net/a/medium_square.jpg')).toBe('https://x.cloudfront.net/a/large.jpg');
  });
});

describe('mlh', () => {
  const page = `<html><body><script data-page="app" type="application/json">${JSON.stringify({
    props: {
      upcomingEvents: [
        { id: 'a', slug: 'hackcbs-9-o', name: 'hackCBS 9.O', startsAt: '2026-10-31T12:00:00Z', endsAt: '2026-11-01T23:00:00Z', location: 'New delhi, New delhi', formatType: 'physical', backgroundUrl: 'https://mlhusercontent.com/backgrounds/events/a/bg_medium.png', logoUrl: 'https://mlhusercontent.com/logos/events/a/logo_small.png', websiteUrl: 'https://hackcbs.tech/', venueAddress: { city: 'New delhi', state: 'New delhi', country: 'IN' } },
        { id: 'b', slug: 'sharkbyte', name: 'SharkByte', startsAt: '2026-11-06T21:00:00Z', endsAt: '2026-11-08T23:00:00Z', location: 'Miami, FL', formatType: 'physical', websiteUrl: 'https://shark-byte.io/', venueAddress: { city: 'Miami', state: 'FL', country: 'US' } },
        { id: 'c', slug: 'global-hack', name: 'Global Hack Week', startsAt: '2026-11-10T00:00:00Z', endsAt: '2026-11-17T00:00:00Z', formatType: 'digital', websiteUrl: 'https://ghw.mlh.io/' },
      ],
    },
  })}</script></body></html>`;

  it('reads the season page JSON and keeps India and online events', () => {
    const events = mlhEvents(page);
    expect(events).toHaveLength(3);
    const [delhi, miami, online] = events.map((e) => normalize(mlhCandidate(e)!, { slug: 'mlh', trust: 0.9 }, { now: NOW }));
    expect(delhi.city).toBe('delhi-ncr');
    expect(delhi.country).toBe('India');
    expect(delhi.registrationUrl).toBe('https://hackcbs.tech/');
    expect(validate(delhi, NOW, { isNew: true }).ok).toBe(true);
    expect(validate(miami, NOW, { isNew: true })).toMatchObject({ ok: false });
    expect(online.mode).toBe('online');
    expect(mlhSeason(new Date('2026-10-24T00:00:00Z'))).toBe(2027);
    expect(mlhSeason(new Date('2027-03-01T00:00:00Z'))).toBe(2027);
  });
});

describe('hybrid events abroad', () => {
  const ev = (formatType: string) => ({ id: 'n', slug: 'nasa-space-apps-nyc', name: "NASA's Space Apps Challenge NYC", startsAt: '2026-11-13T21:30:00Z', endsAt: '2026-11-15T21:30:00Z', location: ' Brooklyn, New York', formatType, websiteUrl: 'https://www.spaceappsnyc.org/', venueAddress: { city: 'Brooklyn', state: 'New York', country: 'US' } });

  it('rejects an in-person-first hybrid event abroad (MLH hybrid_physical)', () => {
    const d = normalize(mlhCandidate(ev('hybrid_physical'))!, { slug: 'mlh', trust: 0.9 }, { now: NOW });
    placeRules(d);
    expect(d.mode).toBe('hybrid');
    expect(validate(d, NOW, { isNew: true })).toMatchObject({ ok: false, reason: 'in-person event outside India (United States)' });
  });

  it('lists an online-first hybrid event abroad online, naming where it is based (MLH hybrid_digital)', () => {
    const d = normalize(mlhCandidate(ev('hybrid_digital'))!, { slug: 'mlh', trust: 0.9 }, { now: NOW });
    placeRules(d);
    expect(d.mode).toBe('online');
    expect(validate(d, NOW, { isNew: true }).ok).toBe(true);
    writeCopy(d);
    expect(d.summary).toMatch(/^A hybrid hackathon based in Brooklyn, New York; you can take part online\./);
  });
});

describe('hackerearth', () => {
  it('maps the events feed', () => {
    const rows = fixtureJson('hackerearth.json').response;
    const c = hackerearthCandidate(rows[0])!;
    expect(c.data.mode).toBe('online');
    expect(c.data.startDate).toBe('2026-10-05 20:00:00+05:30');
    expect(c.data.imageUrl).toMatch(/^https:\/\/media\.hackerearth\.com\/.+cover/);
    expect(c.externalId).toBe('agentic-banking-hackathon-2');
    expect(hackerearthCandidate({ ...rows[0], status: 'ENDED' })).toBeNull();
  });
});

describe('knowafest', () => {
  const rows = fixtureJson('knowafest-api.json').data;

  it('keeps hackathons and drops fests and webinars', () => {
    const kept = rows.map((r: any) => knowafestCandidate(r)).filter(Boolean);
    expect(kept.map((c: any) => c.title)).toEqual(['Fullstackathon 2026 - 20 Hour Workshop & Hackathon on Full Stack Development', 'Hacknovia 2026']);
    expect(knowafestFee('₹2,099')).toEqual({ fee: 2099, isPaid: true });
    expect(knowafestFee('Free entry')).toEqual({ fee: 0, isPaid: false });
    expect(knowafestFee('Paid')).toEqual({ isPaid: true });
  });

  it('reads the event page: schema.org dates and venue, deadline, the organizer’s form, the poster', () => {
    const c = knowafestCandidate(rows.find((r: any) => r.id === 66765))!;
    const page = { ...parsePage(fixture('knowafest-event.html'), 'https://www.knowafest.com/event/hacknovia'), status: 200 };
    const full = knowafestApplyPage(c, page, NOW);
    expect(full.data.registrationUrl).toBe('https://docs.google.com/forms/d/e/1FAIpQLSc2DvogDxSwR0J7meZQV4_uK4QlUieeD0YlDsS51PlTEX1uew/viewform');
    expect(full.data.imageUrl).toBe('https://www.knowafest.com/storage/141/60789.jpg');
    expect(full.data.city).toBe('Tiruchirappalli');
    expect(full.data.region).toBe('Tamil Nadu');
    const d = normalize(full, knowafest, { now: NOW });
    expect(d.startDate?.toISOString()).toBe(new Date('2026-10-29T09:00:00+05:30').toISOString());
    expect(d.registrationDeadline?.toISOString()).toBe(new Date('2026-10-27T23:59:00+05:30').toISOString());
    expect(d.fee).toBe(400);
    expect([d.teamMin, d.teamMax]).toEqual([3, 5]);
    expect(d.prizePool).toBe(35000);
    expect(validate(d, NOW, { isNew: true })).toEqual({ ok: true });
  });

  it('pages through the search API', async () => {
    const http = fakeHttp({ 'https://www.knowafest.com/api/events': fixture('knowafest-api.json') });
    expect((await knowafest.fetch(ctx(http))).length).toBe(2);
  });
});

describe('lablab', () => {
  it('reads the list and an event page', () => {
    const list = `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': [{ '@type': 'ItemList', itemListElement: [{ '@type': 'ListItem', url: 'https://lablab.ai/ai-hackathons/vultr-hackathon' }, { '@type': 'ListItem', url: 'https://lablab.ai/blog/x' }] }] })}</script>`;
    expect(lablabEventUrls(list)).toEqual(['https://lablab.ai/ai-hackathons/vultr-hackathon']);
    const ev = { '@type': 'Event', name: 'Vultr: Agent Rush Hackathon', startDate: '2026-11-03T15:00:00.000Z', endDate: '2026-11-08T22:00:00.000Z', eventAttendanceMode: 'https://schema.org/MixedEventAttendanceMode', location: { '@type': 'VirtualLocation', url: 'https://lablab.ai/ai-hackathons/vultr-hackathon' }, image: 'https://storage.googleapis.com/lablab-static-eu/events/banner.jpg', offers: { price: '0', priceCurrency: 'USD', url: 'https://lablab.ai/ai-hackathons/vultr-hackathon' } };
    const c = lablabCandidate('https://lablab.ai/ai-hackathons/vultr-hackathon', [ev])!;
    // Built online with an optional on-site day abroad: a remote-first hybrid, listed for its online part.
    expect(c.data).toMatchObject({ mode: 'hybrid', remoteOk: true, country: 'Outside India' });
    const d = normalize(c, lablab, { now: NOW });
    placeRules(d);
    expect(d.mode).toBe('online');
    writeCopy(d);
    expect(d.summary).toMatch(/^A hybrid hackathon; you can take part online\./);
    expect(c.data.imageUrl).toBe('https://storage.googleapis.com/lablab-static-eu/events/banner.jpg');
    expect(c.data.fee).toBe(0);
    expect(c.externalId).toBe('vultr-hackathon');
  });
});

describe('connector fetch errors', () => {
  it('surfaces HTTP failures so the runner can mark the source', async () => {
    const http = fakeHttp({ 'https://unstop.com/api/public/opportunity/search-result': () => json({ error: 'down' }, 500) });
    await expect(unstop.fetch(ctx(http))).rejects.toThrow(/HTTP 500/);
  });
});
