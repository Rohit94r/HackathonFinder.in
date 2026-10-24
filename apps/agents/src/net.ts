import dns from 'node:dns';
import net from 'node:net';
import { UnsafeUrlError } from './errors';

// SSRF guard. Scraped pages hand us URLs (redirects, images, registration links), so
// before any request we make sure the host is on the public internet: no localhost,
// no private or link-local ranges (cloud metadata lives at 169.254.169.254), no
// internal-only names. Checked on every hop, robots.txt fetches included.

export type LookupFn = (hostname: string) => Promise<{ address: string; family: number }[]>;

const defaultLookup: LookupFn = (hostname) => dns.promises.lookup(hostname, { all: true, verbatim: true });

/** IPv4 ranges that are not the public internet (RFC 6890 and friends), as [base, prefix]. */
const V4_BLOCKED: [string, number][] = [
  ['0.0.0.0', 8], // "this network"
  ['10.0.0.0', 8], // private
  ['100.64.0.0', 10], // carrier-grade NAT
  ['127.0.0.0', 8], // loopback
  ['169.254.0.0', 16], // link-local (cloud metadata)
  ['172.16.0.0', 12], // private
  ['192.0.0.0', 24], // IETF protocol assignments
  ['192.0.2.0', 24], // documentation
  ['192.88.99.0', 24], // 6to4 relay
  ['192.168.0.0', 16], // private
  ['198.18.0.0', 15], // benchmarking
  ['198.51.100.0', 24], // documentation
  ['203.0.113.0', 24], // documentation
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // reserved, broadcast
];

function v4ToInt(ip: string): number {
  return ip.split('.').reduce((n, part) => (n << 8) + Number(part), 0) >>> 0;
}

function inV4Range(ip: string, base: string, prefix: number): boolean {
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  return (v4ToInt(ip) & mask) === (v4ToInt(base) & mask);
}

/** Expands an IPv6 address to its 8 groups (handles "::" and a trailing dotted IPv4). */
function v6Groups(ip: string): number[] | null {
  let s = ip.toLowerCase().replace(/^\[|\]$/g, '').split('%')[0];
  const dotted = s.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) {
    const n = v4ToInt(dotted[1]);
    s = s.slice(0, -dotted[1].length) + `${(n >>> 16).toString(16)}:${(n & 0xffff).toString(16)}`;
  }
  const [head, tail] = s.split('::');
  const a = head ? head.split(':') : [];
  const b = tail !== undefined ? (tail ? tail.split(':') : []) : [];
  const missing = 8 - a.length - b.length;
  if (tail === undefined && a.length !== 8) return null;
  if (missing < 0) return null;
  const groups = [...a, ...Array(tail !== undefined ? missing : 0).fill('0'), ...b].map((g) => parseInt(g || '0', 16));
  return groups.length === 8 && groups.every((g) => Number.isInteger(g) && g >= 0 && g <= 0xffff) ? groups : null;
}

/** True for loopback, private, link-local, multicast, reserved and documentation addresses. */
export function isPrivateIp(ip: string): boolean {
  const kind = net.isIP(ip.replace(/^\[|\]$/g, '').split('%')[0]);
  if (kind === 4) return V4_BLOCKED.some(([base, prefix]) => inV4Range(ip, base, prefix));
  if (kind !== 6) return true; // not an IP at all: refuse rather than guess
  const g = v6Groups(ip);
  if (!g) return true;
  const embeddedV4 = (hi: number, lo: number) => `${hi >>> 8}.${hi & 0xff}.${lo >>> 8}.${lo & 0xff}`;
  if (g.every((x) => x === 0)) return true; // ::
  if (g.slice(0, 7).every((x) => x === 0) && g[7] === 1) return true; // ::1
  // ::ffff:a.b.c.d (mapped) and ::a.b.c.d (compatible): judge the IPv4 inside.
  if (g.slice(0, 5).every((x) => x === 0) && (g[5] === 0xffff || g[5] === 0)) return isPrivateIp(embeddedV4(g[6], g[7]));
  if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0)) return isPrivateIp(embeddedV4(g[6], g[7])); // NAT64
  if ((g[0] & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((g[0] & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((g[0] & 0xffc0) === 0xfec0) return true; // fec0::/10 site-local (deprecated)
  if ((g[0] & 0xff00) === 0xff00) return true; // multicast
  if (g[0] === 0x2001 && g[1] === 0x0db8) return true; // documentation
  if (g[0] === 0x2002) return isPrivateIp(embeddedV4(g[1], g[2])); // 6to4 wraps an IPv4
  return false;
}

const INTERNAL_NAME = /(^|\.)(localhost|local|internal|intranet|lan|home|corp|localdomain)$/i;

interface CachedLookup {
  at: number;
  addresses: string[];
}

const LOOKUP_TTL_MS = 5 * 60_000;

/**
 * Throws UnsafeUrlError unless the URL is http(s) on a public host. Hostnames are
 * resolved and every address must be public, so "evil.example → 127.0.0.1" fails too.
 */
export class PublicUrlGuard {
  private readonly cache = new Map<string, CachedLookup>();

  constructor(private readonly lookup: LookupFn = defaultLookup) {}

  async check(input: string | URL): Promise<void> {
    let u: URL;
    try {
      u = typeof input === 'string' ? new URL(input) : input;
    } catch {
      throw new UnsafeUrlError('not a valid URL', String(input));
    }
    const url = u.toString();
    if (!/^https?:$/.test(u.protocol)) throw new UnsafeUrlError(`unsupported protocol ${u.protocol}`, url);
    if (u.username || u.password) throw new UnsafeUrlError('URLs with credentials are not fetched', url);
    const host = u.hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '').toLowerCase();
    if (!host) throw new UnsafeUrlError('no host', url);
    if (net.isIP(host)) {
      if (isPrivateIp(host)) throw new UnsafeUrlError(`refusing to fetch a private address (${host})`, url);
      return;
    }
    if (INTERNAL_NAME.test(host) || !host.includes('.')) throw new UnsafeUrlError(`refusing to fetch an internal host name (${host})`, url);
    const addresses = await this.resolve(host, url);
    const bad = addresses.find(isPrivateIp);
    if (bad) throw new UnsafeUrlError(`${host} resolves to a private address (${bad})`, url);
  }

  private async resolve(host: string, url: string): Promise<string[]> {
    const hit = this.cache.get(host);
    if (hit && Date.now() - hit.at < LOOKUP_TTL_MS) return hit.addresses;
    let addresses: string[];
    try {
      addresses = (await this.lookup(host)).map((a) => a.address);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      // Let the request itself report "domain not found"; only refuse what resolves privately.
      if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') return [];
      throw new UnsafeUrlError(`could not resolve ${host}`, url);
    }
    if (this.cache.size > 500) this.cache.delete(this.cache.keys().next().value!);
    this.cache.set(host, { at: Date.now(), addresses });
    return addresses;
  }
}

/** One-off check with the default resolver. */
export async function assertPublicUrl(url: string | URL, lookup?: LookupFn): Promise<void> {
  await new PublicUrlGuard(lookup).check(url);
}
