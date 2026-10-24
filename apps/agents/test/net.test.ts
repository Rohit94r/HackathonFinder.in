import { describe, expect, it } from 'vitest';
import { UnsafeUrlError } from '../src/errors';
import { ImageMirror } from '../src/enrich/images';
import { isPrivateIp, PublicUrlGuard, type LookupFn } from '../src/net';
import { redact } from '../src/run';
import { fakeHttp } from './helpers';

const lookup =
  (table: Record<string, string[]>): LookupFn =>
  async (host) => {
    const addrs = table[host];
    if (!addrs) throw Object.assign(new Error('not found'), { code: 'ENOTFOUND' });
    return addrs.map((address) => ({ address, family: address.includes(':') ? 6 : 4 }));
  };

describe('isPrivateIp', () => {
  it.each(['127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '224.0.0.1', '255.255.255.255'])('refuses %s', (ip) => {
    expect(isPrivateIp(ip)).toBe(true);
  });
  it.each(['::1', '::', 'fe80::1', 'fc00::1', 'fd12:3456::1', '::ffff:127.0.0.1', '::ffff:10.0.0.1', '64:ff9b::a9fe:a9fe', '[::1]', 'ff02::1', '2001:db8::1'])('refuses %s', (ip) => {
    expect(isPrivateIp(ip)).toBe(true);
  });
  it.each(['8.8.8.8', '1.1.1.1', '172.32.0.1', '104.18.0.1', '2606:4700::1111', '::ffff:8.8.8.8'])('allows %s', (ip) => {
    expect(isPrivateIp(ip)).toBe(false);
  });
});

describe('PublicUrlGuard', () => {
  const guard = new PublicUrlGuard(lookup({ 'example.com': ['93.184.215.14'], 'evil.example': ['127.0.0.1'], 'mixed.example': ['8.8.8.8', '10.0.0.5'] }));

  it('allows public hosts and refuses private ones, by name or by address', async () => {
    await expect(guard.check('https://example.com/a.png')).resolves.toBeUndefined();
    for (const url of ['http://127.0.0.1/', 'http://localhost:3000/', 'http://169.254.169.254/latest/meta-data/', 'http://[::1]/', 'http://2130706433/', 'http://0x7f000001/', 'https://evil.example/', 'https://mixed.example/', 'http://printer.local/', 'http://intranet/']) {
      await expect(guard.check(url), url).rejects.toBeInstanceOf(UnsafeUrlError);
    }
  });

  it('refuses other protocols and URLs with credentials', async () => {
    await expect(guard.check('file:///etc/passwd')).rejects.toBeInstanceOf(UnsafeUrlError);
    await expect(guard.check('ftp://example.com/x')).rejects.toBeInstanceOf(UnsafeUrlError);
    await expect(guard.check('https://user:pw@example.com/')).rejects.toBeInstanceOf(UnsafeUrlError);
  });
});

describe('Http with the guard', () => {
  it('refuses a redirect to a private address', async () => {
    const guard = new PublicUrlGuard(lookup({ 'site.example': ['93.184.215.14'] }));
    const http = fakeHttp(
      { 'https://site.example/page': () => new Response('', { status: 302, headers: { location: 'http://169.254.169.254/latest/meta-data/' } }) },
      { guard: (u) => guard.check(u) }
    );
    await expect(http.fetchHtml('https://site.example/page')).rejects.toBeInstanceOf(UnsafeUrlError);
    expect(http.calls.some((c) => c.includes('169.254.169.254'))).toBe(false);
  });

  it('does not ask Cloudinary to fetch a private image URL', async () => {
    const http = fakeHttp({ 'https://api.cloudinary.com/': () => new Response('{}', { status: 500 }) });
    const mirror = new ImageMirror(http, { cloudName: 'demo', apiKey: 'k', apiSecret: 's' });
    const res = await mirror.mirror('http://127.0.0.1:8080/poster.png', 'test-1');
    expect(res.stored).toBe(false);
    expect(res.url).toBe('');
    expect(http.calls.some((c) => c.includes('api.cloudinary.com'))).toBe(false);
  });
});

describe('redact', () => {
  it('masks secrets in log lines', () => {
    expect(redact('mongodb+srv://user:p4ss@cluster0.x.mongodb.net/db')).toBe('mongodb+srv://***@cluster0.x.mongodb.net/db');
    expect(redact('GET https://graph.facebook.com/v21.0/x?user_id=1&access_token=EAAB123&q=a')).toBe('GET https://graph.facebook.com/v21.0/x?user_id=1&access_token=***&q=a');
    expect(redact('https://www.googleapis.com/customsearch/v1?key=AIzaXYZ&cx=1')).toBe('https://www.googleapis.com/customsearch/v1?key=***&cx=1');
    expect(redact('cloudinary://123:secret@demo')).toBe('cloudinary://***@demo');
  });
});
