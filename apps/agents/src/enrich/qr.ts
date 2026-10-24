import jpeg from 'jpeg-js';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import { errorMessage } from '../errors';
import type { Http } from '../http';
import { absoluteUrl } from '../text';
import { downloadImage, sniffImage } from './images';

// Many college posters say "scan to register" instead of giving a link. When a
// listing's registration is by QR code, we read the QR from the poster (pure JS:
// jsQR on pixels from jpeg-js or pngjs) and use the link it holds.

/** Biggest image we decode (in pixels); larger posters are scaled down first. */
const MAX_PIXELS = 6_000_000;

interface Pixels {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

function toPixels(buf: Buffer): Pixels | null {
  const type = sniffImage(buf);
  if (type === 'image/jpeg') {
    const img = jpeg.decode(buf, { useTArray: true, formatAsRGBA: true, maxResolutionInMP: 60, maxMemoryUsageInMB: 600 });
    return { data: new Uint8ClampedArray(img.data.buffer, img.data.byteOffset, img.data.byteLength), width: img.width, height: img.height };
  }
  if (type === 'image/png') {
    const img = PNG.sync.read(buf);
    return { data: new Uint8ClampedArray(img.data.buffer, img.data.byteOffset, img.data.byteLength), width: img.width, height: img.height };
  }
  return null; // WebP and GIF need native decoders; those posters are left for a person.
}

/** Nearest-neighbour downscale by an integer factor (QR codes survive it well). */
function shrink(p: Pixels, factor: number): Pixels {
  const width = Math.floor(p.width / factor);
  const height = Math.floor(p.height / factor);
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const src = ((y * factor) * p.width + x * factor) * 4;
      const dst = (y * width + x) * 4;
      data[dst] = p.data[src];
      data[dst + 1] = p.data[src + 1];
      data[dst + 2] = p.data[src + 2];
      data[dst + 3] = 255;
    }
  }
  return { data, width, height };
}

/** The text in the first QR code found in a JPG or PNG, or null. */
export function decodeQr(buf: Buffer): string | null {
  let p = toPixels(buf);
  if (!p) return null;
  if (p.width * p.height > MAX_PIXELS) p = shrink(p, Math.ceil(Math.sqrt((p.width * p.height) / MAX_PIXELS)));
  const tries = [p];
  if (p.width > 1200) tries.push(shrink(p, 2));
  for (const img of tries) {
    const hit = jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' });
    if (hit?.data) return hit.data.trim().slice(0, 2000);
  }
  return null;
}

/** A web link from a QR code's text (plain URLs and "www." links); UPI and contact cards are ignored. */
export function qrLink(text: string | null): string | undefined {
  if (!text) return undefined;
  const t = text.trim();
  if (/^https?:\/\//i.test(t)) return absoluteUrl(t.split(/\s/)[0]);
  if (/^www\.[^\s]+\.[a-z]{2,}/i.test(t)) return absoluteUrl(`https://${t.split(/\s/)[0]}`);
  return undefined;
}

export interface QrRead {
  link?: string;
  /** What the QR said when it isn't a web link, or why nothing was read. */
  note: string;
}

/** Downloads a poster (politely) and reads its QR code. */
export async function readPosterQr(http: Http, imageUrl: string): Promise<QrRead> {
  try {
    const { data } = await downloadImage(http, imageUrl);
    const text = decodeQr(data);
    if (!text) return { note: 'no QR code could be read from the poster' };
    const link = qrLink(text);
    if (link) return { link, note: 'registration link read from the poster’s QR code' };
    return { note: /^upi:/i.test(text) ? 'the poster’s QR code is a UPI payment code' : 'the poster’s QR code is not a web link' };
  } catch (err) {
    return { note: `poster could not be read (${errorMessage(err)})` };
  }
}
