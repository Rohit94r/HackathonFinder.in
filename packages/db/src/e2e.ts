// End-to-end check of a running site: `pnpm test:e2e` (E2E_BASE defaults to http://127.0.0.1:3000).
// Creates two throwaway students and one throwaway admin directly in the DB, signs in through
// next-auth like a browser, exercises the flows, then deletes everything it created.
// For the admin-email check, start the site with E2E_ADMIN_CLAIM's address in ADMIN_EMAILS.
import { loadEnv } from './env';
loadEnv();
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import path from 'node:path';
import { connectDb, disconnectDb } from './connect';
import {
  Activity,
  AdminAction,
  AnalyticsEvent,
  ContentFlag,
  Conversation,
  Hackathon,
  Invite,
  Message,
  Notification,
  PageView,
  User,
} from './models';

const require = createRequire(path.join(process.cwd(), '..', '..', 'apps', 'web', 'package.json'));
const bcrypt = require('bcryptjs') as { hash: (s: string, r: number) => Promise<string> };

const BASE = process.env.E2E_BASE ?? 'http://127.0.0.1:3000';
const tag = crypto.randomBytes(3).toString('hex');
const PASSWORD = `E2e-${crypto.randomBytes(6).toString('hex')}!`;
const ADMIN_CLAIM = process.env.E2E_ADMIN_CLAIM ?? 'e2e-admin-claim@example.invalid';
const results: { ok: boolean; name: string; detail?: string }[] = [];

function check(name: string, ok: boolean, detail = '') {
  results.push({ ok, name, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
}

/** A tiny cookie jar per signed-in browser. */
class Client {
  cookies = new Map<string, string>();
  constructor(public label: string) {}
  header() {
    return [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ');
  }
  store(res: Response) {
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [pair] = c.split(';');
      const i = pair.indexOf('=');
      this.cookies.set(pair.slice(0, i), pair.slice(i + 1));
    }
  }
  async req(p: string, init: RequestInit & { json?: unknown } = {}) {
    const headers: Record<string, string> = { cookie: this.header(), ...(init.headers as Record<string, string>) };
    let body = init.body;
    if (init.json !== undefined) {
      headers['content-type'] = 'application/json';
      body = JSON.stringify(init.json);
    }
    const res = await fetch(BASE + p, { ...init, headers, body, redirect: 'manual' });
    this.store(res);
    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, data, location: res.headers.get('location') ?? '' };
  }
  async signIn(email: string, password: string) {
    const csrf = await this.req('/api/auth/csrf');
    const form = new URLSearchParams({ csrfToken: csrf.data.csrfToken, email, password, json: 'true', callbackUrl: BASE });
    const res = await this.req('/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    const session = await this.req('/api/auth/session');
    return { status: res.status, user: session.data?.user };
  }
}

async function makeUser(kind: 'student' | 'admin', n: string) {
  const email = `e2e-${kind}-${n}-${tag}@example.invalid`;
  const user = await User.create({
    email,
    emailVerified: new Date(),
    passwordHash: await bcrypt.hash(PASSWORD, 10),
    name: `E2E ${kind} ${n}`,
    handle: `e2e-${kind}-${n}-${tag}`,
    role: kind,
    onboarded: true,
    college: 'Test College',
    city: 'pune',
    skills: ['frontend'],
    about: '2nd year, Computer Engineering',
  });
  return { id: String(user._id), email, handle: user.handle };
}

// 1×1 PNG, a real image file.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64');

async function main() {
  await connectDb();
  const created: string[] = [];
  const anon = new Client('anon');
  try {
    // ── Public pages and data ───────────────────────────────────────────────
    for (const p of ['/', '/hackathons', '/near-me', '/calendar', '/cities', '/cities/pune', '/themes/ai-ml', '/teams', '/community', '/wins', '/blog', '/how-it-works', '/about', '/submit', '/login', '/signup', '/organizers', '/privacy', '/terms']) {
      const r = await anon.req(p);
      check(`page ${p} loads`, r.status === 200, `HTTP ${r.status}`);
    }

    // ── Search engines and AI assistants ────────────────────────────────────
    for (const slug of ['upcoming-hackathons-in-india', 'hackathons-near-me', 'free-online-hackathons-for-beginners', 'ai-ml-hackathons-india', 'hackathon-resume-and-internships', 'what-is-a-hackathon', 'how-to-win-your-first-hackathon']) {
      const r = await anon.req(`/blog/${slug}`);
      const html = String(r.data);
      check(`guide /blog/${slug} has article JSON-LD and its canonical`, r.status === 200 && html.includes('"BlogPosting"') && html.includes(`<link rel="canonical" href="https://hackathonfinder.in/blog/${slug}"`), `HTTP ${r.status}`);
    }
    const home = String((await anon.req('/')).data);
    check('home page has Organization + founder JSON-LD', home.includes('"Organization"') && home.includes('Rohit Jadhav'));
    check('home page canonical is hackathonfinder.in', home.includes('<link rel="canonical" href="https://hackathonfinder.in"'));
    const about = String((await anon.req('/about')).data);
    check('about page names the founder and links', about.includes('Rohit Jadhav') && about.includes('linkedin.com/in/rohit-jadhav94') && about.includes('github.com/rohit94r') && about.includes('dev.by.rohit'));
    const sitemap = await anon.req('/sitemap.xml');
    const urls = (String(sitemap.data).match(/<loc>/g) ?? []).length;
    check('sitemap.xml lists pages, guides and listings', sitemap.status === 200 && urls > 100 && String(sitemap.data).includes('https://hackathonfinder.in/blog/what-is-a-hackathon'), `${urls} URLs`);
    const robots = await anon.req('/robots.txt');
    check('robots.txt points to the sitemap, blocks /admin, welcomes AI crawlers', robots.status === 200 && String(robots.data).includes('Sitemap: https://hackathonfinder.in/sitemap.xml') && String(robots.data).includes('Disallow: /admin') && String(robots.data).includes('GPTBot'));
    const llms = await anon.req('/llms.txt');
    check('llms.txt describes the site', llms.status === 200 && String(llms.data).startsWith('# HackathonFinder'));
    const og = await fetch(`${BASE}/opengraph-image`);
    check('share image renders', og.ok && (og.headers.get('content-type') ?? '').startsWith('image/png'), `HTTP ${og.status}`);
    const manifest = await anon.req('/manifest.webmanifest');
    check('web manifest', manifest.status === 200 && String(manifest.data?.name).includes('HackathonFinder'));
    const list = await anon.req('/api/hackathons?status=all&limit=100');
    const total = list.data?.total ?? 0;
    check('real hackathons listed by the API', total > 50, `${total} listings`);
    const sample = (list.data?.items ?? []).find((h: any) => h.imageUrl && h.registrationUrl);
    if (sample) {
      const page = await anon.req(`/hackathons/${sample.slug}`);
      check('hackathon detail page shows the same event', page.status === 200 && String(page.data).includes(sample.title.slice(0, 20).replace(/&/g, '&amp;')), sample.title);
      check('hackathon detail page has Event JSON-LD', String(page.data).includes('"@type":"Event"'));
      const go = await anon.req(`/go/${sample.slug}`);
      check('register link redirects to the official page', [302, 307, 308].includes(go.status) && go.location.startsWith('http'), go.location.slice(0, 80));
      const img = await fetch(sample.imageUrl);
      check('banner image loads', img.ok && (img.headers.get('content-type') ?? '').startsWith('image/'), sample.imageUrl.slice(0, 70));
    } else check('a listing with a banner exists', false);
    const fakes = await Hackathon.countDocuments({ flags: 'sample' });
    check('no fake sample hackathons left in the DB', fakes === 0, `${fakes}`);

    // ── Signed-out protection ───────────────────────────────────────────────
    for (const [m, p] of [
      ['GET', '/api/me/saved'], ['GET', '/api/messages'], ['GET', '/api/me/unread'], ['POST', '/api/threads'], ['POST', '/api/team-posts'],
      ['POST', '/api/invites'], ['POST', '/api/me/avatar'], ['GET', '/api/admin/dashboard'], ['GET', '/api/admin/users'], ['POST', '/api/admin/scrape'],
    ] as const) {
      const r = await anon.req(p, { method: m, json: m === 'POST' ? {} : undefined });
      check(`signed out: ${m} ${p} is refused`, r.status === 401 || r.status === 403, `HTTP ${r.status}`);
    }
    const adminPage = await anon.req('/admin');
    check('signed out: /admin sends to the admin login', [302, 307, 308].includes(adminPage.status) && adminPage.location.includes('/admin/login'), adminPage.location);
    const adminLogin = await anon.req('/admin/login');
    check('/admin/login page loads', adminLogin.status === 200, `HTTP ${adminLogin.status}`);
    const cron = await anon.req('/api/cron/scrape');
    check('cron scrape refuses without the secret', cron.status === 401 || cron.status === 403, `HTTP ${cron.status}`);
    const cronQuery = await anon.req(`/api/cron/reminders?secret=${encodeURIComponent(process.env.CRON_SECRET ?? 'x')}`);
    check('cron secret in the URL is not accepted', cronQuery.status === 401 || cronQuery.status === 403, `HTTP ${cronQuery.status}`);
    const headers = await fetch(`${BASE}/`);
    check(
      'security headers are sent',
      Boolean(headers.headers.get('content-security-policy')?.includes("frame-ancestors 'self'")) && headers.headers.get('x-content-type-options') === 'nosniff' && !headers.headers.get('x-powered-by')
    );

    // ── Nobody can claim admin by signing up with an admin's email ──────────
    const claim = new Client('claim');
    await User.deleteMany({ email: ADMIN_CLAIM });
    const reg = await claim.req('/api/auth/register', { method: 'POST', json: { name: 'Admin Claim', email: ADMIN_CLAIM, password: PASSWORD } });
    const claimed = await User.findOne({ email: ADMIN_CLAIM }).select('_id role').lean();
    if (claimed) created.push(String(claimed._id));
    const claimSession = await claim.signIn(ADMIN_CLAIM, PASSWORD);
    const claimAdmin = await claim.req('/api/admin/users');
    check(
      'signing up with an ADMIN_EMAILS address does not make you admin before the email is verified',
      reg.status === 200 && claimed?.role === 'student' && claimSession.user?.role === 'student' && claimAdmin.status === 403,
      `register ${reg.status}, stored ${claimed?.role}, session ${claimSession.user?.role}, admin API ${claimAdmin.status}`
    );

    // ── Password guessing is limited ────────────────────────────────────────
    const guesser = new Client('guesser');
    for (let i = 0; i < 11; i++) {
      const csrf = await guesser.req('/api/auth/csrf');
      const form = new URLSearchParams({ csrfToken: csrf.data.csrfToken, email: `nobody-${tag}@example.invalid`, password: `wrong-${i}`, json: 'true', callbackUrl: BASE });
      const r = await guesser.req('/api/auth/callback/credentials', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: form.toString() });
      if (i === 10) check('the 11th wrong password in 15 minutes is refused as too many attempts', `${r.location}${JSON.stringify(r.data)}`.includes('TooManyAttempts'), `HTTP ${r.status} ${r.location.slice(0, 80)}`);
    }

    // ── Students ────────────────────────────────────────────────────────────
    const a = await makeUser('student', 'a');
    const b = await makeUser('student', 'b');
    const admin = await makeUser('admin', 'x');
    created.push(a.id, b.id, admin.id);
    const A = new Client('A');
    const B = new Client('B');
    const X = new Client('admin');
    const sa = await A.signIn(a.email, PASSWORD);
    const sb = await B.signIn(b.email, PASSWORD);
    check('student A signs in', sa.user?.id === a.id);
    // A second browser for A: it must be signed out when A changes the password.
    const A2 = new Client('A2');
    await A2.signIn(a.email, PASSWORD);
    check('student B signs in', sb.user?.id === b.id);

    const form = new FormData();
    form.set('photo', new Blob([PNG], { type: 'image/png' }), 'me.png');
    const up = await A.req('/api/me/avatar', { method: 'POST', body: form });
    check('profile photo upload goes to Cloudinary', up.status === 200 && String(up.data?.image).includes('res.cloudinary.com'), String(up.data?.image ?? up.data?.error?.message).slice(0, 90));
    const notImage = new FormData();
    notImage.set('photo', new Blob([Buffer.from('MZ fake exe')], { type: 'image/png' }), 'x.png');
    const bad = await A.req('/api/me/avatar', { method: 'POST', body: notImage });
    check('a non-image upload is refused', bad.status === 415 || bad.status === 400, `HTTP ${bad.status}`);

    const rude = await A.req('/api/me', { method: 'PATCH', json: { bio: 'you are a chutiya' } });
    check('bad-word filter blocks abusive profile text', rude.status === 400, rude.data?.error?.message ?? '');
    const rudeThread = await A.req('/api/threads', { method: 'POST', json: { title: 'What the f u c k is this', body: 'This is a long enough body for a thread, honestly.', category: 'general' } });
    check('bad-word filter blocks an abusive thread (spaced letters)', rudeThread.status === 400, rudeThread.data?.error?.message ?? '');
    const fine = await A.req('/api/me', { method: 'PATCH', json: { bio: 'I assess classic glass designs in Gandhinagar.' } });
    check('normal words are not blocked (assess, classic, Gandhinagar)', fine.status === 200, `HTTP ${fine.status}`);

    // Invite → accept → chat
    const inv = await A.req('/api/invites', { method: 'POST', json: { toHandle: b.handle, message: 'Want to team up for the next hackathon?' } });
    check('A invites B', inv.status === 200, inv.data?.error?.message ?? '');
    const inbox = await B.req('/api/me/invites');
    const invite = (inbox.data?.received ?? inbox.data?.items ?? inbox.data?.invites ?? []).find?.((i: any) => i.from?.handle === a.handle || i.fromHandle === a.handle) ?? null;
    const inviteId = invite?.id ?? inv.data?.invite?.id;
    const acc = await B.req(`/api/invites/${inviteId}`, { method: 'PATCH', json: { status: 'accepted' } });
    check('B accepts the invite', acc.status === 200, acc.data?.error?.message ?? '');
    const convs = await A.req('/api/messages');
    const conv = convs.data?.items?.[0];
    check('a private chat opens after accepting', Boolean(conv?.id), `${convs.data?.items?.length ?? 0} chats`);
    const send = await A.req(`/api/messages/${conv?.id}`, { method: 'POST', json: { body: 'Hi! Let’s build something.' } });
    check('A sends a message', send.status === 200, send.data?.error?.message ?? '');
    const abuse = await A.req(`/api/messages/${conv?.id}`, { method: 'POST', json: { body: 'madarchod' } });
    check('bad-word filter blocks an abusive chat message', abuse.status === 400);
    const unread = await B.req('/api/me/unread');
    check('B sees an unread message', (unread.data?.unread ?? unread.data?.count ?? 0) >= 1, JSON.stringify(unread.data).slice(0, 60));
    const read = await B.req(`/api/messages/${conv?.id}`);
    check('B reads the message', read.status === 200 && read.data?.messages?.some((m: any) => m.body.startsWith('Hi!')));
    const sx = await X.signIn(admin.email, PASSWORD);
    check('test admin signs in', sx.user?.id === admin.id && sx.user?.role === 'admin', sx.user?.role);
    const spy = await X.req(`/api/messages/${conv?.id}`);
    check('a non-member (even an admin) cannot read the chat', spy.status === 404, `HTTP ${spy.status}`);
    const block = await B.req(`/api/messages/${conv?.id}/block`, { method: 'POST' });
    const afterBlock = await A.req(`/api/messages/${conv?.id}`, { method: 'POST', json: { body: 'hello?' } });
    check('blocking stops new messages', block.status === 200 && afterBlock.status === 403, `HTTP ${afterBlock.status}`);
    const flags = await ContentFlag.countDocuments({ userId: a.id });
    check('blocked words were logged for admins', flags >= 3, `${flags} flags`);

    // ── Admin ───────────────────────────────────────────────────────────────
    for (const p of ['/admin', '/admin/analytics', '/admin/hackathons', '/admin/scraper', '/admin/review', '/admin/users', '/admin/community', '/admin/reports', '/admin/settings']) {
      const r = await X.req(p);
      check(`admin page ${p} loads`, r.status === 200, `HTTP ${r.status}`);
    }
    for (const p of ['/api/admin/dashboard', '/api/admin/analytics', '/api/admin/listings', '/api/admin/users', '/api/admin/scrape', '/api/admin/scrape/sources', '/api/admin/community', '/api/admin/settings']) {
      const r = await X.req(p);
      check(`admin API ${p}`, r.status === 200, `HTTP ${r.status}`);
    }
    const studentAdmin = await A.req('/api/admin/users');
    check('a student cannot use admin APIs', studentAdmin.status === 403, `HTTP ${studentAdmin.status}`);
    const studentAdminPage = await A.req('/admin');
    check('a student is kept out of /admin pages', studentAdminPage.status !== 200, `HTTP ${studentAdminPage.status}`);
    const userDetail = await X.req(`/api/admin/users/${a.id}`);
    check('admin sees a student’s details', userDetail.status === 200 && JSON.stringify(userDetail.data).includes(a.handle));
    check('admin user details never include password hashes', !JSON.stringify(userDetail.data).includes('passwordHash'));
    const ban = await X.req(`/api/admin/users/${b.id}`, { method: 'PATCH', json: { banned: true } });
    check('admin bans a student', ban.status === 200, ban.data?.error?.message ?? '');
    const newPassword = `${PASSWORD}-new1`;
    const change = await A.req('/api/me/password', { method: 'POST', json: { current: PASSWORD, next: newPassword } });
    check('A changes the password', change.status === 200, change.data?.error?.message ?? '');
    // Sessions re-check the account at most once a minute.
    await new Promise((r) => setTimeout(r, 65_000));
    // An ended session keeps a cookie but carries no account (empty id), like a banned one.
    const oldSession = await A2.req('/api/auth/session');
    const oldMe = await A2.req('/api/me');
    check('a password change signs out the other browser', !oldSession.data?.user?.id && !oldMe.data?.user, `id=${JSON.stringify(oldSession.data?.user?.id)} me=${Boolean(oldMe.data?.user)}`);
    const fresh = await new Client('A3').signIn(a.email, newPassword);
    check('A signs in with the new password', fresh.user?.id === a.id);
    const bannedTry = await B.req('/api/me');
    const bannedSignIn = await new Client('B2').signIn(b.email, PASSWORD);
    check('a banned student is signed out and cannot sign in again', !bannedSignIn.user && !bannedTry.data?.user, `me=${Boolean(bannedTry.data?.user)}`);
    const selfBan = await X.req(`/api/admin/users/${admin.id}`, { method: 'PATCH', json: { banned: true } });
    check('an admin cannot ban themselves', selfBan.status >= 400, `HTTP ${selfBan.status}`);
    const runs = await X.req('/api/admin/scrape');
    check('scraper runs are listed', runs.status === 200, JSON.stringify(runs.data).slice(0, 80));

    // ── Analytics beacon ────────────────────────────────────────────────────
    const vid = crypto.randomUUID();
    const track = await anon.req('/api/track', { method: 'POST', headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/130.0' }, json: { t: 'pv', id: crypto.randomBytes(12).toString('hex'), vid, sid: vid, path: '/e2e-test' } });
    check('analytics beacon accepts a page view', track.status === 204 || track.status === 200, `HTTP ${track.status} ${JSON.stringify(track.data).slice(0, 80)}`);
  } finally {
    // ── Clean up everything this run created ────────────────────────────────
    const ids = created;
    const convIds = (await Conversation.find({ members: { $in: ids } }).select('_id').lean()).map((c) => c._id);
    const users = await User.find({ _id: { $in: ids } }).select('image').lean();
    await Promise.all([
      Message.deleteMany({ conversationId: { $in: convIds } }),
      Conversation.deleteMany({ _id: { $in: convIds } }),
      Invite.deleteMany({ $or: [{ fromUserId: { $in: ids } }, { toUserId: { $in: ids } }] }),
      Notification.deleteMany({ userId: { $in: ids } }),
      Activity.deleteMany({ userId: { $in: ids } }),
      ContentFlag.deleteMany({ userId: { $in: ids } }),
      AnalyticsEvent.deleteMany({ $or: [{ userId: { $in: ids } }, { path: '/e2e-test' }] }),
      PageView.deleteMany({ $or: [{ userId: { $in: ids } }, { path: '/e2e-test' }] }),
      AdminAction.deleteMany({ $or: [{ adminId: { $in: ids } }, { targetId: { $in: ids } }] }),
    ]);
    await User.deleteMany({ _id: { $in: ids } });
    // Remove the uploaded test photo from Cloudinary.
    for (const u of users) {
      const m = u.image?.match(/\/upload\/(?:[^/]+\/)*?(?:v\d+\/)?(hackathonfinder\/avatars\/[^.]+)\./);
      if (m && process.env.CLOUDINARY_API_SECRET) {
        const ts = Math.floor(Date.now() / 1000).toString();
        const sig = crypto.createHash('sha1').update(`public_id=${m[1]}&timestamp=${ts}${process.env.CLOUDINARY_API_SECRET}`).digest('hex');
        const body = new URLSearchParams({ public_id: m[1], timestamp: ts, api_key: process.env.CLOUDINARY_API_KEY!, signature: sig });
        await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/destroy`, { method: 'POST', body });
      }
    }
    const left = await User.countDocuments({ _id: { $in: ids } });
    console.log(`\ncleanup: test users left ${left}`);
    const failed = results.filter((r) => !r.ok);
    console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
    for (const f of failed) console.log(`  FAILED: ${f.name}${f.detail ? ` — ${f.detail}` : ''}`);
    await disconnectDb();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
