import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AgentRun, GeoCache, Hackathon, RawItem, Source } from '@hackathonfinder/db';
import { bannerPublicId, deliveryUrl, signParams } from '../src/enrich/images';
import { acquireRun } from '../src/lock';
import { runScrape } from '../src/run';
import type { CandidateData, Connector, RawCandidate } from '../src/types';
import { clearDb, startDb, stopDb } from './db';
import { fakeHttp, json } from './helpers';

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

const NOW = new Date('2026-10-24T12:00:00+05:30');
const ENV = { CLOUDINARY_CLOUD_NAME: 'demo', CLOUDINARY_API_KEY: 'key123', CLOUDINARY_API_SECRET: 'shh-secret' } as NodeJS.ProcessEnv;

const cand = (id: string, data: CandidateData, extra: Partial<RawCandidate> = {}): RawCandidate => ({
  externalId: id,
  url: `https://platform.example/e/${id}`,
  title: data.title,
  text: data.title,
  data: { registrationUrl: `https://platform.example/e/${id}`, ...data },
  imageUrls: [],
  ...extra,
});

const future = (days: number, hour = 9) => new Date(NOW.getTime() + days * 86400_000 + (hour - 12) * 3600_000).toISOString();

function platform(slug: string, list: () => RawCandidate[], detail?: (c: RawCandidate) => RawCandidate): Connector & { detailCalls: number } {
  const c = {
    slug,
    name: slug,
    kind: 'platform' as const,
    defaultSchedule: '0 2,14 * * *',
    description: 'test',
    trust: 0.9,
    extract: 'missing' as const,
    detailCalls: 0,
    async fetch() {
      return list();
    },
  } as Connector & { detailCalls: number };
  if (detail)
    c.detail = async (x) => {
      c.detailCalls++;
      return detail(x);
    };
  return c;
}

function http() {
  const uploads: URLSearchParams[] = [];
  const h = fakeHttp({
    'https://nominatim.openstreetmap.org/search': () => json([{ lat: '18.4900', lon: '73.8200', display_name: 'MMCOE, Karvenagar, Pune', address: { suburb: 'Karvenagar', city: 'Pune', state: 'Maharashtra', country: 'India' } }]),
    'https://api.cloudinary.com/v1_1/demo/image/upload': async (_url, init) => {
      const body = new URLSearchParams(String(init?.body));
      uploads.push(body);
      return json({ secure_url: `https://res.cloudinary.com/demo/image/upload/v17/hackathonfinder/banners/${body.get('public_id')}.png` });
    },
  });
  return Object.assign(h, { uploads });
}

describe('runScrape', () => {
  it('creates, merges, rejects and reviews; stores banners and venue points; never touches sample listings', async () => {
    // A made-up sample listing with the same name and date must not swallow the real event.
    await Hackathon.create({
      slug: 'hacktopia-pune-sample',
      title: 'Hacktopia Pune 2026',
      mode: 'offline',
      city: 'pune',
      startDate: future(20),
      endDate: future(21),
      registrationDeadline: future(15),
      registrationUrl: 'https://example.com/sample',
      state: 'live',
      flags: ['sample'],
    });

    const a = platform(
      'unstop',
      () => [
        cand('1', { title: 'Online AI Sprint 2026', mode: 'online', startDate: future(10), endDate: future(12), registrationDeadline: future(8), teamMin: 1, teamMax: 4, isPaid: false, tags: ['Applied AI'] }),
        cand('2', { title: 'Hacktopia Pune 2026', mode: 'offline', city: 'Pune', region: 'Maharashtra', venue: 'Marathwada Mitramandal College of Engineering, Karvenagar, Pune', country: 'India', startDate: future(20), endDate: future(21), registrationDeadline: future(15), isPaid: false }),
        cand('3', { title: 'Old Hack 2026', mode: 'online', startDate: future(-10), endDate: future(-8), registrationDeadline: future(-12) }),
        cand('4', { title: 'Paid Hack 2026', mode: 'online', startDate: future(10), endDate: future(11), registrationDeadline: future(9), isPaid: true }),
        cand('5', { title: 'Bhopal Build 2026', mode: 'offline', city: 'Bhopal', region: 'Madhya Pradesh', country: 'India', startDate: future(30), endDate: future(31), registrationDeadline: future(25), isPaid: false }),
      ],
      (c) => ({ ...c, data: { ...c.data, imageUrl: `https://cdn.platform.example/banner-${c.externalId}.png` } })
    );
    const b = platform('devfolio', () => [
      cand('x', { title: 'Online AI Sprint', mode: 'online', startDate: future(10, 10), endDate: future(12), registrationDeadline: future(8), imageUrl: 'https://cdn.devfolio.example/cover.png' }, { url: 'https://ai-sprint.devfolio.example/' }),
      cand('y', { title: 'Munich Hack', mode: 'offline', city: 'München', country: 'Germany', startDate: future(10), endDate: future(11), registrationDeadline: future(9) }),
    ]);
    const h = http();
    const run = await acquireRun({ trigger: 'manual', now: NOW });
    const res = await runScrape({ runId: run.kind === 'started' ? run.runId : undefined, connectors: [a, b], http: h, env: ENV, now: NOW });

    expect(res.status).toBe('success');
    expect(res.counts).toMatchObject({ found: 7, created: 3, review: 1, merged: 1, rejected: 2, errors: 0 });

    // One listing for the event on both platforms (whichever was read first named it).
    const sprints = await Hackathon.find({ title: /^Online AI Sprint/ }).lean();
    expect(sprints).toHaveLength(1);
    const sprint = sprints[0];
    expect(sprint.state).toBe('live');
    expect([...sprint.sources].sort()).toEqual(['devfolio', 'unstop']);
    expect(sprint.sourceRefs.map((r) => r.externalId).sort()).toEqual(['1', 'x']);
    expect(sprint.imageUrl).toMatch(/^https:\/\/res\.cloudinary\.com\/demo\/image\/upload\/f_auto,q_auto,c_limit,w_1200\/v17\/hackathonfinder\/banners\/(unstop-1|devfolio-x)-/);
    expect(['https://cdn.platform.example/banner-1.png', 'https://cdn.devfolio.example/cover.png']).toContain(sprint.sourceImageUrl);
    expect(sprint.summary).toMatch(/^An online hackathon/);
    expect((await Hackathon.findOne({ title: 'Paid Hack 2026' }).lean())?.summary).toBeTruthy();

    const pune = await Hackathon.findOne({ title: 'Hacktopia Pune 2026', flags: { $ne: 'sample' } }).lean();
    expect(pune?.city).toBe('pune');
    expect(pune?.location?.coordinates).toEqual([73.82, 18.49]);
    expect(await Hackathon.findOne({ slug: 'hacktopia-pune-sample' }).lean()).toMatchObject({ sources: [], flags: ['sample'] });

    // The stub geocoder answers "Pune, Maharashtra" to everything: a hit in another state is ignored.
    const bhopal = await Hackathon.findOne({ title: 'Bhopal Build 2026' }).lean();
    expect(bhopal).toMatchObject({ city: 'bhopal', cityName: 'Bhopal', region: 'Madhya Pradesh' });
    expect(bhopal?.location).toBeUndefined();

    const paid = await Hackathon.findOne({ title: 'Paid Hack 2026' }).lean();
    expect(paid?.state).toBe('pending');
    expect(paid?.flags).toContain('Paid entry, but the fee amount is not stated');

    // Every upload is signed and never carries the secret itself.
    for (const u of h.uploads) {
      expect(u.get('overwrite')).toBe('false');
      expect(u.get('folder')).toBe('hackathonfinder/banners');
      expect(String(u)).not.toContain('shh-secret');
      expect(u.get('eager')).toBe('f_auto,q_auto,c_limit,w_640|f_auto,q_auto,c_limit,w_1200|f_auto,q_auto,c_limit,w_1400');
      const signed = Object.fromEntries([...u.entries()].filter(([k]) => !['file', 'api_key', 'signature'].includes(k)));
      expect(u.get('signature')).toBe(signParams(signed, 'shh-secret'));
    }
    expect(await GeoCache.countDocuments({ found: true })).toBeGreaterThan(0);

    // The run is recorded for the dashboard.
    const doc = await AgentRun.findById(res.runId).lean();
    expect(doc?.status).toBe('success');
    expect(doc?.progress).toMatchObject({ done: 7, total: 7 });
    expect(doc?.items.map((i) => i.action).sort()).toEqual(['created', 'created', 'created', 'merged', 'rejected', 'rejected', 'review']);
    expect(doc?.items.find((i) => i.title === 'Hacktopia Pune 2026')?.city).toBe('Pune');
    expect(await Source.findOne({ slug: 'unstop' }).lean()).toMatchObject({ health: 'ok', lastItemCount: 5 });
    expect(await RawItem.countDocuments()).toBe(7);

    // Second run: nothing new, no duplicates, no detail pages fetched again.
    const before = a.detailCalls;
    const again = await runScrape({ connectors: [a, b], http: h, env: ENV, now: NOW });
    expect(again.counts).toMatchObject({ created: 0, review: 0, merged: 0, rejected: 2 });
    expect(again.unchanged).toBe(5);
    expect(a.detailCalls).toBe(before);
    expect(await Hackathon.countDocuments({ flags: { $ne: 'sample' } })).toBe(4);
  });

  it('rewrites listings made under older rules and takes down ones the rules now turn away', async () => {
    let drone = false;
    const a = platform('unstop', () => [
      cand('7', { title: 'Code Sprint 2026', mode: 'online', startDate: future(10), endDate: future(11), registrationDeadline: future(9), isPaid: false }),
      cand('8', { title: drone ? 'Drone Soccer | TECHKRITI' : 'Techkriti Event', mode: 'online', startDate: future(10), endDate: future(11), registrationDeadline: future(9), isPaid: false, tags: drone ? ['Drone', 'Robotics'] : [] }),
    ]);
    await runScrape({ connectors: [a], http: http(), env: {}, now: NOW });
    const sprint = await Hackathon.findOne({ title: 'Code Sprint 2026' }).lean();
    expect(sprint?.teamSizeKnown).toBe(false);
    // Pretend an older version wrote it: a wrong theme, a stated team size, an invented summary.
    await Hackathon.updateOne({ _id: sprint!._id }, { $set: { themes: ['climate'], teamSizeKnown: true, summary: 'An online hackathon. Tracks include Climate.' } });
    await RawItem.updateMany({}, { $set: { pipelineVersion: 1 } });
    drone = true;
    const res = await runScrape({ connectors: [a], http: http(), env: {}, now: NOW });
    const after = await Hackathon.findOne({ _id: sprint!._id }).lean();
    expect(after).toMatchObject({ themes: [], teamSizeKnown: false, summary: 'An online hackathon. Free to enter.' });
    // Same Unstop id, now clearly a drone event: taken down.
    expect(await Hackathon.findOne({ 'sourceRefs.externalId': '8' }).lean()).toMatchObject({ state: 'rejected', removedReason: expect.stringMatching(/^not a hackathon-type event/) });
    expect(res.counts.rejected).toBe(1);
  });

  it('keeps going when one source fails and marks the run partial', async () => {
    const ok = platform('unstop', () => [cand('1', { title: 'Fine Hack 2026', mode: 'online', startDate: future(5), endDate: future(6), registrationDeadline: future(4), isPaid: false })]);
    const broken = { ...platform('devfolio', () => []), fetch: async () => Promise.reject(new Error('HTTP 503 from api.devfolio.co')) };
    const res = await runScrape({ connectors: [ok, broken], http: http(), env: {}, now: NOW });
    expect(res.status).toBe('partial');
    expect(res.counts.created).toBe(1);
    expect(res.errors.join(' ')).toMatch(/HTTP 503/);
    expect(await Source.findOne({ slug: 'devfolio' }).lean()).toMatchObject({ health: 'degraded', consecutiveFailures: 1 });
    // Without Cloudinary the source link is kept.
    expect((await Hackathon.findOne({ title: 'Fine Hack 2026' }).lean())?.imageUrl).toBeUndefined();
  });

  it('sends social leads to review and reads the registration link from the poster QR', async () => {
    const QRCode = (await import('qrcode')).default;
    const poster = await QRCode.toBuffer('https://forms.gle/Reg123', { type: 'png', scale: 8 });
    const lead: Connector = {
      slug: 'instagram',
      name: 'Instagram',
      kind: 'social',
      defaultSchedule: '0 2,14 * * *',
      description: 'test',
      trust: 0.4,
      extract: 'always',
      async fetch() {
        return [
          {
            url: 'https://www.instagram.com/p/AbCdEf12345/',
            title: 'Code Rush Pune',
            text: 'Code Rush hackathon at Pune on 20 November. Scan the QR to register',
            imageUrls: ['https://cdn.example.com/poster.png'],
            data: { title: 'Code Rush Pune', mode: 'offline', city: 'pune', country: 'India', startDate: future(27), imageUrl: 'https://cdn.example.com/poster.png', registrationUrl: 'https://www.instagram.com/p/AbCdEf12345/', registrationVia: 'qr', listingSource: 'instagram', flags: ['Found on Instagram via web search — add the poster and check the details', 'Registration is by QR code on the Instagram poster — check where it leads'] },
          },
        ];
      },
    };
    const h = fakeHttp({ 'https://cdn.example.com/poster.png': poster });
    const res = await runScrape({ connectors: [lead], http: h, env: {}, now: NOW });
    expect(res.counts.review).toBe(1);
    const doc = await Hackathon.findOne({ title: 'Code Rush Pune' }).lean();
    expect(doc?.state).toBe('pending');
    expect(doc?.registrationVia).toBe('qr');
    expect(doc?.registrationUrl).toBe('https://forms.gle/Reg123');
    expect(doc?.flags.join(' ')).toMatch(/read from the poster’s QR code/);
  });
});

describe('image helpers', () => {
  it('signs like Cloudinary documents it', () => {
    // Cloudinary's documented example: public_id=sample_image&timestamp=1315060510 + secret "abcd".
    expect(signParams({ timestamp: '1315060510', public_id: 'sample_image' }, 'abcd')).toBe('b4ad47fb4e25c7bf5f92a20089f9db59bc302313');
  });

  it('delivers resized copies and names them deterministically', () => {
    expect(deliveryUrl('https://res.cloudinary.com/demo/image/upload/v1/a/b.png')).toBe('https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_1200/v1/a/b.png');
    expect(bannerPublicId('unstop', '1773842', 'https://x/a.png')).toBe(bannerPublicId('unstop', '1773842', 'https://x/a.png'));
    expect(bannerPublicId('unstop', '1773842', 'https://x/a.png')).not.toBe(bannerPublicId('unstop', '1773842', 'https://x/b.png'));
    expect(bannerPublicId('Web', 'https://Site.example/a b?c', 'u')).toMatch(/^web-https-site-example-a-b-c-[0-9a-f]{8}$/);
  });
});
