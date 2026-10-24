import robotsParser from 'robots-parser';
import { BlockedError, HttpError, RobotsDisallowedError, UnsafeUrlError, errorMessage } from './errors';
import { parsePage, type HtmlPage } from './html';
import { PublicUrlGuard } from './net';

// Every request the agents make goes through here: robots.txt first, one request
// at a time per host with a pause between them, backoff when a site asks us to slow
// down, and hard limits on time and size. We identify ourselves honestly and never
// try to get past a bot check.

export const DEFAULT_USER_AGENT = 'HackathonFinderBot/1.0 (+https://hackathonfinder.in/bot)';

type Robot = ReturnType<typeof robotsParser>;

interface HostState {
  tail: Promise<unknown>;
  /** When the last request to this host finished (ms). */
  last: number;
  /** Set after a 429/5xx: nothing goes to this host before then. */
  notBefore: number;
  delayMs: number;
}

interface RobotsEntry {
  robot: Robot | null;
  fetchedAt: number;
}

interface CachedBody {
  etag?: string;
  lastModified?: string;
  status: number;
  headers: Headers;
  body: Buffer;
}

export interface HttpOptions {
  userAgent?: string;
  /** Pause between two requests to the same host. robots.txt Crawl-delay wins when longer. */
  minDelayMs?: number;
  timeoutMs?: number;
  maxBytes?: number;
  retries?: number;
  /** Re-read robots.txt after this long (the scheduler runs for days). */
  robotsTtlMs?: number;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  /**
   * SSRF guard run before every request (each redirect hop and robots.txt too).
   * Defaults to refusing localhost, private and link-local addresses. Tests pass a stub.
   */
  guard?: ((url: URL) => Promise<void>) | false;
}

export interface RequestOptions {
  method?: 'GET' | 'HEAD' | 'POST';
  headers?: Record<string, string>;
  body?: string;
  accept?: string;
  timeoutMs?: number;
  maxBytes?: number;
  retries?: number;
  maxRedirects?: number;
  /** Return 4xx/5xx responses instead of throwing. */
  allowErrorStatus?: boolean;
  /**
   * An authenticated call to a platform's official API (Graph API, Custom Search,
   * Kaggle, Eventbrite). robots.txt governs crawlers, not API clients; those calls
   * follow the API's own terms and rate limits instead. Never set it for web pages.
   */
  officialApi?: boolean;
}

export interface HttpResponse {
  url: string;
  status: number;
  headers: Headers;
  body: Buffer;
  text(): string;
  json<T = unknown>(): T;
}

export interface LinkCheck {
  /** true: works. false: dead (404/410, no such host). null: couldn't tell (blocked, timeout, 5xx). */
  ok: boolean | null;
  status?: number;
  finalUrl?: string;
  contentType?: string;
  reason?: string;
}

const RETRY_STATUS = new Set([429, 500, 502, 503, 504]);
const sleepReal = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** A bot-check page instead of content. We stop there: no CAPTCHA solving, no evasion. */
export function detectChallenge(status: number, headers: Headers, body: string): string | null {
  const waf = headers.get('x-amzn-waf-action');
  if (waf && /captcha|challenge/i.test(waf)) return `AWS WAF ${waf} (bot check)`;
  if ((headers.get('cf-mitigated') ?? '').toLowerCase() === 'challenge') return 'Cloudflare challenge (bot check)';
  // DuckDuckGo answers bot traffic with 202 and an "anomaly" challenge page.
  if (status === 202 && /anomaly-modal|bots use DuckDuckGo/i.test(body)) return 'search challenge page (anomaly check)';
  if ([403, 405, 429, 503].includes(status) && body.length < 200_000) {
    if (/<title>\s*(human verification|just a moment|attention required|access denied|are you a robot|verify you are human)/i.test(body)) {
      return 'bot verification page';
    }
    if (/captcha-delivery|cf-chl-|hcaptcha\.com|recaptcha\/api/i.test(body) && status !== 429) return 'CAPTCHA page';
  }
  return null;
}

/** The product token robots.txt groups are matched on ("HackathonFinderBot"). */
export function robotsToken(userAgent: string): string {
  return userAgent.split(/[/\s]/)[0] || 'HackathonFinderBot';
}

function retryAfterMs(headers: Headers): number | undefined {
  const v = headers.get('retry-after');
  if (!v) return undefined;
  const secs = Number(v);
  if (Number.isFinite(secs)) return Math.min(secs * 1000, 120_000);
  const at = Date.parse(v);
  return Number.isNaN(at) ? undefined : Math.min(Math.max(0, at - Date.now()), 120_000);
}

async function readLimited(res: Response, maxBytes: number, url: string): Promise<Buffer> {
  const declared = Number(res.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    await res.body?.cancel().catch(() => {});
    throw new HttpError(`response is ${declared} bytes, over the ${maxBytes} byte limit`, url, res.status);
  }
  if (!res.body) return Buffer.alloc(0);
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new HttpError(`response over the ${maxBytes} byte limit`, url, res.status);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

function response(url: string, status: number, headers: Headers, body: Buffer): HttpResponse {
  return {
    url,
    status,
    headers,
    body,
    text: () => body.toString('utf8'),
    json: <T>() => JSON.parse(body.toString('utf8')) as T,
  };
}

function isNetworkError(err: unknown): boolean {
  if (err instanceof HttpError || err instanceof BlockedError) return false;
  const e = err as { name?: string; code?: string; cause?: { code?: string } };
  return e?.name === 'TimeoutError' || e?.name === 'AbortError' || e?.name === 'TypeError' || Boolean(e?.code || e?.cause?.code);
}

function networkCode(err: unknown): string {
  const e = err as { name?: string; code?: string; cause?: { code?: string } };
  return e?.cause?.code ?? e?.code ?? e?.name ?? 'error';
}

export class Http {
  readonly userAgent: string;
  private readonly token: string;
  private readonly minDelayMs: number;
  private readonly timeoutMs: number;
  private readonly maxBytes: number;
  private readonly retries: number;
  private readonly robotsTtlMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly guard: ((url: URL) => Promise<void>) | null;
  private readonly hosts = new Map<string, HostState>();
  private readonly robots = new Map<string, Promise<RobotsEntry>>();
  private readonly cache = new Map<string, CachedBody>();
  /** Requests sent (for run logs). */
  requests = 0;

  constructor(opts: HttpOptions = {}) {
    this.userAgent = opts.userAgent || process.env.CRAWLER_USER_AGENT || DEFAULT_USER_AGENT;
    this.token = robotsToken(this.userAgent);
    this.minDelayMs = opts.minDelayMs ?? 1500;
    this.timeoutMs = opts.timeoutMs ?? 20_000;
    this.maxBytes = opts.maxBytes ?? 6 * 1024 * 1024;
    this.retries = opts.retries ?? 3;
    this.robotsTtlMs = opts.robotsTtlMs ?? 12 * 3600_000;
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.sleep = opts.sleep ?? sleepReal;
    if (opts.guard === false) this.guard = null;
    else if (opts.guard) this.guard = opts.guard;
    else {
      const guard = new PublicUrlGuard();
      this.guard = (u) => guard.check(u);
    }
  }

  /** A longer pause for one host (search engines, geocoders); never shorter than the default. */
  setHostDelay(hostname: string, delayMs: number): void {
    const h = this.host(hostname);
    h.delayMs = Math.max(h.delayMs, delayMs);
  }

  private host(hostname: string): HostState {
    let h = this.hosts.get(hostname);
    if (!h) {
      h = { tail: Promise.resolve(), last: 0, notBefore: 0, delayMs: this.minDelayMs };
      this.hosts.set(hostname, h);
    }
    return h;
  }

  /** Runs `fn` when it's this host's turn: one request at a time, with the pause in between. */
  private slot<T>(hostname: string, fn: () => Promise<T>): Promise<T> {
    const h = this.host(hostname);
    const run = h.tail.then(async () => {
      const wait = Math.max(h.last + h.delayMs, h.notBefore) - Date.now();
      if (wait > 0) await this.sleep(wait);
      try {
        return await fn();
      } finally {
        h.last = Date.now();
      }
    });
    h.tail = run.catch(() => undefined);
    return run;
  }

  private backoff(hostname: string, attempt: number, retryAfter?: number): number {
    const wait = retryAfter ?? Math.min(2000 * 2 ** attempt + Math.floor(Math.random() * 500), 60_000);
    const h = this.host(hostname);
    h.notBefore = Math.max(h.notBefore, Date.now() + wait);
    return wait;
  }

  /** robots.txt rules for an origin, cached. null means "no rules" (missing robots.txt). */
  private robotsFor(origin: string): Promise<RobotsEntry> {
    const cached = this.robots.get(origin);
    if (cached) {
      return cached.then((entry) => {
        if (Date.now() - entry.fetchedAt < this.robotsTtlMs) return entry;
        this.robots.delete(origin);
        return this.robotsFor(origin);
      });
    }
    const p = this.loadRobots(origin);
    this.robots.set(origin, p);
    // A failed robots.txt fetch isn't cached, so the next run tries again.
    p.catch(() => this.robots.delete(origin));
    return p;
  }

  private async loadRobots(origin: string): Promise<RobotsEntry> {
    const url = `${origin}/robots.txt`;
    let current = url;
    for (let hop = 0; hop < 5; hop++) {
      const res = await this.send(current, { method: 'GET', accept: 'text/plain,*/*', maxBytes: 512 * 1024, retries: 2 }, true);
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        current = new URL(res.headers.get('location')!, current).toString();
        continue;
      }
      if (res.status >= 200 && res.status < 300) {
        const host = new URL(origin).hostname;
        const robot = robotsParser(url, res.text());
        const crawlDelay = robot.getCrawlDelay(this.token);
        if (crawlDelay && crawlDelay > 0) this.host(host).delayMs = Math.max(this.minDelayMs, Math.min(crawlDelay * 1000, 60_000));
        return { robot, fetchedAt: Date.now() };
      }
      // RFC 9309: a 4xx robots.txt means no rules; a 5xx means "assume everything is disallowed".
      if (res.status >= 400 && res.status < 500) return { robot: null, fetchedAt: Date.now() };
      throw new HttpError(`robots.txt unavailable (HTTP ${res.status}); not crawling ${origin} until it is`, url, res.status);
    }
    throw new HttpError('robots.txt redirects too many times', url);
  }

  /** True when robots.txt lets our user agent fetch this URL. */
  async isAllowed(url: string): Promise<boolean> {
    const u = new URL(url);
    const { robot } = await this.robotsFor(u.origin);
    if (!robot) return true;
    return robot.isAllowed(u.toString(), this.token) !== false;
  }

  /** One HTTP exchange with retries (no redirect following, no robots check). */
  private async send(url: string, opts: RequestOptions, isRobots = false): Promise<HttpResponse> {
    const u = new URL(url);
    const retries = opts.retries ?? this.retries;
    const method = opts.method ?? 'GET';
    const maxBytes = opts.maxBytes ?? this.maxBytes;
    if (this.guard) await this.guard(u);
    for (let attempt = 0; ; attempt++) {
      try {
        const res = await this.slot(u.hostname, async () => {
          this.requests++;
          const headers: Record<string, string> = {
            'user-agent': this.userAgent,
            accept: opts.accept ?? '*/*',
            'accept-encoding': 'gzip, deflate, br',
            ...(opts.headers ?? {}),
          };
          const cached = method === 'GET' && !isRobots ? this.cache.get(url) : undefined;
          if (cached?.etag) headers['if-none-match'] = cached.etag;
          if (cached?.lastModified) headers['if-modified-since'] = cached.lastModified;
          const r = await this.fetchImpl(url, {
            method,
            headers,
            body: opts.body,
            redirect: 'manual',
            // Inside Next.js fetch is patched with a data cache; scraping must always hit the network.
            cache: 'no-store',
            signal: AbortSignal.timeout(opts.timeoutMs ?? this.timeoutMs),
          });
          if (r.status === 304 && cached) {
            await r.body?.cancel().catch(() => {});
            return response(url, cached.status, cached.headers, cached.body);
          }
          const body = method === 'HEAD' ? Buffer.alloc(0) : await readLimited(r, maxBytes, url);
          if (method === 'GET' && r.status === 200 && !isRobots && body.length < 1024 * 1024) {
            const etag = r.headers.get('etag') ?? undefined;
            const lastModified = r.headers.get('last-modified') ?? undefined;
            if (etag || lastModified) {
              if (this.cache.size > 300) this.cache.delete(this.cache.keys().next().value!);
              this.cache.set(url, { etag, lastModified, status: r.status, headers: r.headers, body });
            }
          }
          return response(url, r.status, r.headers, body);
        });
        const challenge = res.status >= 400 || res.status === 202 ? detectChallenge(res.status, res.headers, res.text().slice(0, 200_000)) : null;
        if (challenge) throw new BlockedError(`${u.hostname}: ${challenge}. We don't solve CAPTCHAs or bypass bot checks.`);
        if (RETRY_STATUS.has(res.status) && attempt < retries) {
          this.backoff(u.hostname, attempt, retryAfterMs(res.headers));
          continue;
        }
        return res;
      } catch (err) {
        if (isNetworkError(err) && attempt < retries && !['ENOTFOUND', 'EAI_AGAIN'].includes(networkCode(err))) {
          this.backoff(u.hostname, attempt);
          continue;
        }
        throw err;
      }
    }
  }

  /** Fetches a URL politely, following redirects (each hop is checked against robots.txt). */
  async request(url: string, opts: RequestOptions = {}): Promise<HttpResponse> {
    let current = new URL(url);
    let method = opts.method ?? 'GET';
    let body = opts.body;
    const maxRedirects = opts.maxRedirects ?? 5;
    for (let hop = 0; hop <= maxRedirects; hop++) {
      if (!/^https?:$/.test(current.protocol)) throw new HttpError(`unsupported protocol ${current.protocol}`, current.toString());
      if (!opts.officialApi && !(await this.isAllowed(current.toString()))) throw new RobotsDisallowedError(current.toString());
      const res = await this.send(current.toString(), { ...opts, method, body });
      const location = res.headers.get('location');
      if (res.status >= 300 && res.status < 400 && location) {
        current = new URL(location, current);
        if (res.status === 303 || ((res.status === 301 || res.status === 302) && method === 'POST')) {
          method = 'GET';
          body = undefined;
        }
        continue;
      }
      if (res.status >= 400 && !opts.allowErrorStatus) {
        throw new HttpError(`HTTP ${res.status} from ${current.hostname}`, current.toString(), res.status);
      }
      return { ...res, url: current.toString() };
    }
    throw new HttpError('too many redirects', url);
  }

  async fetchJson<T = unknown>(url: string, opts: RequestOptions = {}): Promise<T> {
    const res = await this.request(url, { accept: 'application/json', ...opts });
    try {
      return res.json<T>();
    } catch {
      throw new HttpError(`invalid JSON from ${new URL(res.url).hostname}`, res.url, res.status);
    }
  }

  /** Page HTML plus readable text, meta tags and any schema.org Event JSON-LD. */
  async fetchHtml(url: string, opts: RequestOptions = {}): Promise<HtmlPage> {
    const res = await this.request(url, { accept: 'text/html,application/xhtml+xml', ...opts });
    const type = res.headers.get('content-type') ?? '';
    if (type && !/html|xml|text\/plain/i.test(type)) throw new HttpError(`not an HTML page (${type})`, res.url, res.status);
    return { ...parsePage(res.text(), res.url), status: res.status };
  }

  /** Is this link alive? HEAD first, GET when the server doesn't do HEAD properly. */
  async check(url: string, opts: { timeoutMs?: number } = {}): Promise<LinkCheck> {
    const base = { allowErrorStatus: true, retries: 1, timeoutMs: opts.timeoutMs ?? 15_000 } as const;
    try {
      let res = await this.request(url, { ...base, method: 'HEAD' });
      if (res.status >= 400 && res.status !== 410) res = await this.request(url, { ...base, method: 'GET', maxBytes: 2 * 1024 * 1024 });
      const result: LinkCheck = { ok: null, status: res.status, finalUrl: res.url, contentType: res.headers.get('content-type') ?? undefined };
      if (res.status < 400) return { ...result, ok: true };
      if (res.status === 404 || res.status === 410) return { ...result, ok: false, reason: `HTTP ${res.status}` };
      return { ...result, reason: `HTTP ${res.status}` };
    } catch (err) {
      if (err instanceof RobotsDisallowedError) return { ok: null, reason: 'robots.txt disallows checking this link' };
      if (err instanceof BlockedError) return { ok: null, reason: err.message };
      if (err instanceof UnsafeUrlError) return { ok: false, reason: err.message };
      const code = networkCode(err);
      if (code === 'ENOTFOUND') return { ok: false, reason: 'domain not found' };
      if (code === 'ECONNREFUSED') return { ok: false, reason: 'connection refused' };
      return { ok: null, reason: errorMessage(err) };
    }
  }
}
