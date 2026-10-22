import 'server-only';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ApiError } from './api';

export type StorageMode = 'cloudinary' | 'local' | 'none';

const MAX_BYTES = 8 * 1024 * 1024;

/** Cloudinary when its keys are set; the local public/uploads folder in development; none in production. */
export function storageMode(): StorageMode {
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) return 'cloudinary';
  return process.env.NODE_ENV === 'production' ? 'none' : 'local';
}

// The first bytes of each format, so a renamed .exe can't pass as a poster.
function sniffImage(data: Buffer): { ext: string; type: string } | null {
  if (data.length > 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return { ext: 'jpg', type: 'image/jpeg' };
  if (data.length > 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: 'png', type: 'image/png' };
  if (data.length > 12 && data.subarray(0, 4).toString() === 'RIFF' && data.subarray(8, 12).toString() === 'WEBP') return { ext: 'webp', type: 'image/webp' };
  if (data.length > 6 && /^GIF8[79]a$/.test(data.subarray(0, 6).toString())) return { ext: 'gif', type: 'image/gif' };
  return null;
}

export interface StoredImage {
  url: string;
  /** Also returned so the Extractor can read the poster without fetching it again. */
  base64: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
}

/** Checks and stores an uploaded image (poster, cover, avatar). */
export async function storeImage(data: Buffer, folder: 'posters' | 'covers' | 'avatars'): Promise<StoredImage> {
  if (data.length > MAX_BYTES) throw new ApiError(413, 'too_large', 'Use an image under 8 MB.');
  const kind = sniffImage(data);
  if (!kind) throw new ApiError(415, 'unsupported', 'Use a JPG, PNG, WebP or GIF image.');
  const base64 = data.toString('base64');
  const mediaType = kind.type as StoredImage['mediaType'];
  const mode = storageMode();

  if (mode === 'cloudinary') {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const params = `folder=hackathonfinder/${folder}&timestamp=${timestamp}`;
    const signature = crypto.createHash('sha1').update(params + process.env.CLOUDINARY_API_SECRET).digest('hex');
    const form = new FormData();
    form.set('file', `data:${kind.type};base64,${base64}`);
    form.set('folder', `hackathonfinder/${folder}`);
    form.set('timestamp', timestamp);
    form.set('api_key', process.env.CLOUDINARY_API_KEY!);
    form.set('signature', signature);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: form });
    if (!res.ok) {
      console.error('[storage] Cloudinary upload failed', res.status, await res.text());
      throw new ApiError(502, 'upload_failed', 'We couldn’t save that image. Please try again.');
    }
    const json = (await res.json()) as { secure_url: string };
    return { url: json.secure_url, base64, mediaType };
  }

  if (mode === 'local') {
    const name = `${crypto.createHash('sha256').update(data).digest('hex').slice(0, 24)}.${kind.ext}`;
    const dir = path.join(process.cwd(), 'public', 'uploads', folder);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, name), data);
    return { url: `/uploads/${folder}/${name}`, base64, mediaType };
  }

  throw new ApiError(503, 'storage_not_configured', 'Image uploads aren’t set up yet. Paste a link instead.');
}

/** Reads an uploaded file from multipart form data, or null when none was sent. */
export async function readUpload(form: FormData, field: string): Promise<Buffer | null> {
  const file = form.get(field);
  if (!file || typeof file === 'string' || file.size === 0) return null;
  if (file.size > MAX_BYTES) throw new ApiError(413, 'too_large', 'Use an image under 8 MB.');
  return Buffer.from(await file.arrayBuffer());
}
