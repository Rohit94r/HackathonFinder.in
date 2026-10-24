import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';
import QRCode from 'qrcode';
import { describe, expect, it } from 'vitest';
import { decodeQr, qrLink, readPosterQr } from '../src/enrich/qr';
import { fakeHttp } from './helpers';

const LINK = 'https://forms.gle/AbCdEf123456';

/** A "poster": white canvas with the QR code pasted in, as PNG. */
async function poster(text: string, size = 900): Promise<Buffer> {
  const qr = PNG.sync.read(await QRCode.toBuffer(text, { type: 'png', margin: 4, scale: 8 }));
  const out = new PNG({ width: size, height: Math.round(size * 1.3) });
  out.data.fill(255);
  const ox = size - qr.width - 40;
  const oy = out.height - qr.height - 40;
  PNG.bitblt(qr, out, 0, 0, qr.width, qr.height, ox, oy);
  return PNG.sync.write(out);
}

describe('QR codes on posters', () => {
  it('reads a QR code from a PNG poster', async () => {
    expect(decodeQr(await poster(LINK))).toBe(LINK);
  });

  it('reads a QR code from a JPG poster', async () => {
    const png = PNG.sync.read(await poster(LINK));
    const jpg = jpeg.encode({ data: png.data, width: png.width, height: png.height }, 92).data;
    expect(decodeQr(Buffer.from(jpg))).toBe(LINK);
  });

  it('returns null when there is no code or the format is unsupported', async () => {
    const blank = new PNG({ width: 300, height: 300 });
    blank.data.fill(255);
    expect(decodeQr(PNG.sync.write(blank))).toBeNull();
    expect(decodeQr(Buffer.from('RIFF0000WEBPVP8 '))).toBeNull();
    expect(decodeQr(Buffer.from('<html>not an image</html>'))).toBeNull();
  });

  it('keeps only web links', () => {
    expect(qrLink('https://unstop.com/hackathons/x?ref=qr')).toBe('https://unstop.com/hackathons/x?ref=qr');
    expect(qrLink('www.example.org/register')).toBe('https://www.example.org/register');
    expect(qrLink('upi://pay?pa=club@okaxis')).toBeUndefined();
    expect(qrLink('BEGIN:VCARD')).toBeUndefined();
  });

  it('downloads a poster politely and reads its link', async () => {
    const http = fakeHttp({ 'https://cdn.example.com/poster.png': await poster(LINK) });
    expect(await readPosterQr(http, 'https://cdn.example.com/poster.png')).toEqual({ link: LINK, note: 'registration link read from the poster’s QR code' });
    const upi = fakeHttp({ 'https://cdn.example.com/pay.png': await poster('upi://pay?pa=club@okaxis&am=100') });
    expect((await readPosterQr(upi, 'https://cdn.example.com/pay.png')).link).toBeUndefined();
  });
});
