import crypto from 'node:crypto';
import { errorMessage, HttpError, RobotsDisallowedError, UnsafeUrlError } from '../errors';
import type { Http } from '../http';
import { PublicUrlGuard } from '../net';

// Banners are copied to our Cloudinary account, so listings don't depend on the
// source's CDN (links expire, some block hotlinking) and every image is served
// resized and compressed. Cloudinary fetches the image itself from the URL we give
// it ("remote upload"); when the source refuses Cloudinary, we download the image
// through our polite client and upload the bytes. Public IDs are derived from the
// listing and the image URL with overwrite=false, so a rerun never stores a copy twice.

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export const BANNER_FOLDER = 'hackathonfinder/banners';
/** Delivery transformation: best format and quality for the browser, at most 1200 px wide, never upscaled. */
export const BANNER_TRANSFORM = 'f_auto,q_auto,c_limit,w_1200';
/** Sizes the site asks for (cards, listings, the hero), generated when the banner is stored. */
export const EAGER_TRANSFORMS = ['f_auto,q_auto,c_limit,w_640', BANNER_TRANSFORM, 'f_auto,q_auto,c_limit,w_1400'];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/** Cloudinary settings from CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET, or a CLOUDINARY_URL. */
export function cloudinaryConfig(env: NodeJS.ProcessEnv = process.env): CloudinaryConfig | null {
  if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    return { cloudName: env.CLOUDINARY_CLOUD_NAME, apiKey: env.CLOUDINARY_API_KEY, apiSecret: env.CLOUDINARY_API_SECRET };
  }
  const m = env.CLOUDINARY_URL?.match(/^cloudinary:\/\/([^:]+):([^@]+)@([\w-]+)/);
  return m ? { apiKey: m[1], apiSecret: m[2], cloudName: m[3] } : null;
}

/** Cloudinary's request signature: the params sorted by name as a=1&b=2, the secret appended, SHA-1. */
export function signParams(params: Record<string, string>, secret: string): string {
  const base = Object.keys(params)
    .filter((k) => params[k] !== '' && params[k] !== undefined)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return crypto.createHash('sha1').update(base + secret).digest('hex');
}

/** "https://res.cloudinary.com/x/image/upload/v1/a.png" → the same with our delivery transformation. */
export function deliveryUrl(secureUrl: string): string {
  return secureUrl.includes(`/image/upload/${BANNER_TRANSFORM}/`) ? secureUrl : secureUrl.replace('/image/upload/', `/image/upload/${BANNER_TRANSFORM}/`);
}

/** True for an image already in our Cloudinary account. */
export function isStoredCopy(url: string | undefined, cloudName?: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.hostname === 'res.cloudinary.com' && (!cloudName || u.pathname.startsWith(`/${cloudName}/`));
  } catch {
    return false;
  }
}

/** The public id inside one of our delivery URLs (".../upload/<transform>/v123/<public id>.jpg"). */
export function publicIdFromUrl(url: string, cloudName: string): string | undefined {
  if (!isStoredCopy(url, cloudName)) return undefined;
  const m = new URL(url).pathname.match(/\/image\/upload\/(?:[^/]+\/)*?v\d+\/(.+)\.[a-z0-9]+$/i);
  return m ? decodeURIComponent(m[1]) : undefined;
}

/** "unstop-1773842-3fa9c1d2": source, the event's id and a hash of the image URL (a new banner gets a new copy). */
export function bannerPublicId(source: string, key: string, imageUrl: string): string {
  const clean = (s: string, max: number) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, max) || 'x';
  const hash = crypto.createHash('sha1').update(imageUrl).digest('hex').slice(0, 8);
  return `${clean(source, 30)}-${clean(key, 60)}-${hash}`;
}

/** The first bytes of each format, so an HTML error page or an SVG can't pass as a banner. */
export function sniffImage(data: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' | null {
  if (data.length > 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return 'image/jpeg';
  if (data.length > 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (data.length > 12 && data.subarray(0, 4).toString() === 'RIFF' && data.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  if (data.length > 6 && /^GIF8[79]a$/.test(data.subarray(0, 6).toString())) return 'image/gif';
  return null;
}

/** Downloads an image politely (robots.txt, SSRF guard, size cap) and checks it really is one. */
export async function downloadImage(http: Http, url: string): Promise<{ data: Buffer; type: NonNullable<ReturnType<typeof sniffImage>> }> {
  const res = await http.request(url, { accept: 'image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8', maxBytes: MAX_IMAGE_BYTES, retries: 1, timeoutMs: 20_000 });
  const type = sniffImage(res.body);
  if (!type) throw new HttpError('not a JPG, PNG, WebP or GIF image', res.url, res.status);
  return { data: res.body, type };
}

export interface MirrorResult {
  /** What the listing should show: our copy when stored, else the source URL. */
  url: string;
  stored: boolean;
  reason?: string;
}

interface UploadResponse {
  secure_url?: string;
  existing?: boolean;
  error?: { message?: string };
}

export class ImageMirror {
  private readonly guard = new PublicUrlGuard();
  private failuresInARow = 0;
  private turn = 0;
  private readonly uploaders: Http[];
  /** Uploads this run (stored or reused), for the run log. */
  stored = 0;
  failed = 0;

  /**
   * `http` reads robots.txt and downloads images; uploads go through `uploaders` (Cloudinary's
   * API takes a few at once; each client still sends one request at a time). Defaults to `http`.
   */
  constructor(
    private readonly http: Http,
    private readonly config: CloudinaryConfig | null,
    private readonly log: (line: string) => void = () => {},
    uploaders?: Http[]
  ) {
    this.uploaders = uploaders?.length ? uploaders : [http];
    for (const u of this.uploaders) u.setHostDelay('api.cloudinary.com', 250);
  }

  get enabled(): boolean {
    return Boolean(this.config) && this.failuresInARow < 8;
  }

  get cloudName(): string | undefined {
    return this.config?.cloudName;
  }

  private async upload(file: string, publicId: string): Promise<UploadResponse & { status: number }> {
    const cfg = this.config!;
    const params: Record<string, string> = {
      // Card, listing and hero sizes, made at upload so the first visitor doesn't wait for them.
      eager: EAGER_TRANSFORMS.join('|'),
      eager_async: 'true',
      folder: BANNER_FOLDER,
      overwrite: 'false',
      public_id: publicId,
      timestamp: String(Math.floor(Date.now() / 1000)),
    };
    const body = new URLSearchParams({ ...params, file, api_key: cfg.apiKey, signature: signParams(params, cfg.apiSecret) });
    const client = this.uploaders[this.turn++ % this.uploaders.length];
    const res = await client.request(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cfg.cloudName)}/image/upload`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      accept: 'application/json',
      officialApi: true,
      allowErrorStatus: true,
      retries: 2,
      timeoutMs: 60_000,
    });
    let json: UploadResponse = {};
    try {
      json = res.json<UploadResponse>();
    } catch {
      // Cloudinary always answers JSON; anything else is reported by status below.
    }
    return { ...json, status: res.status };
  }

  /**
   * Copies `imageUrl` to Cloudinary as `publicId` and returns the delivery URL, or the
   * source URL (stored: false) when Cloudinary isn't set up or the copy failed.
   */
  async mirror(imageUrl: string, publicId: string): Promise<MirrorResult> {
    if (!this.config) return { url: imageUrl, stored: false, reason: 'Cloudinary is not configured' };
    if (!this.enabled) return { url: imageUrl, stored: false, reason: 'image uploads paused after repeated failures' };
    try {
      await this.guard.check(imageUrl);
      if (!(await this.http.isAllowed(imageUrl))) return { url: imageUrl, stored: false, reason: 'robots.txt disallows fetching this image' };
    } catch (err) {
      if (err instanceof UnsafeUrlError) return { url: '', stored: false, reason: err.message };
      // robots.txt unreachable: let Cloudinary try anyway, it fetches as itself.
    }

    let res = await this.upload(imageUrl, publicId).catch((err) => ({ status: 0, error: { message: errorMessage(err) } }) as UploadResponse & { status: number });
    if (!res.secure_url && res.status >= 400 && res.status < 500 && res.status !== 401 && res.status !== 420) {
      // The source refused Cloudinary (hotlink protection, odd headers): fetch it ourselves and upload the bytes.
      try {
        const img = await downloadImage(this.http, imageUrl);
        res = await this.upload(`data:${img.type};base64,${img.data.toString('base64')}`, publicId);
      } catch (err) {
        if (err instanceof RobotsDisallowedError) return this.fail(imageUrl, 'robots.txt disallows fetching this image');
        res = { status: res.status, error: { message: `${res.error?.message ?? `HTTP ${res.status}`}; direct download failed: ${errorMessage(err)}` } };
      }
    }
    if (res.secure_url && isStoredCopy(res.secure_url)) {
      this.failuresInARow = 0;
      this.stored++;
      return { url: deliveryUrl(res.secure_url), stored: true };
    }
    if (res.status === 401 || res.status === 420) this.failuresInARow = 99; // bad credentials or rate limited: stop for this run
    return this.fail(imageUrl, res.error?.message ?? `HTTP ${res.status}`);
  }

  /** Deletes one of our stored copies (by its delivery URL). True when Cloudinary removed it. */
  async destroy(deliveryUrlOrId: string): Promise<boolean> {
    if (!this.config) return false;
    const publicId = deliveryUrlOrId.startsWith('http') ? publicIdFromUrl(deliveryUrlOrId, this.config.cloudName) : deliveryUrlOrId;
    if (!publicId) return false;
    const params = { public_id: publicId, timestamp: String(Math.floor(Date.now() / 1000)) };
    const body = new URLSearchParams({ ...params, api_key: this.config.apiKey, signature: signParams(params, this.config.apiSecret) });
    const res = await this.uploaders[0]
      .request(`https://api.cloudinary.com/v1_1/${encodeURIComponent(this.config.cloudName)}/image/destroy`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
        accept: 'application/json',
        officialApi: true,
        allowErrorStatus: true,
        retries: 1,
      })
      .catch(() => null);
    return Boolean(res && res.status === 200 && /"ok"/.test(res.text()));
  }

  private fail(imageUrl: string, reason: string): MirrorResult {
    this.failuresInARow++;
    this.failed++;
    // Cloudinary's messages name the image URL at most, never our credentials.
    this.log(`image: kept the source link (${reason.slice(0, 200)})`);
    return { url: imageUrl, stored: false, reason };
  }
}
