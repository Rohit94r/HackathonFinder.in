import fs from 'node:fs';
import path from 'node:path';
import { Http } from '../src/http';

// Test helpers: saved (trimmed) source responses, and an Http client that answers
// from them instead of the network.

export const FIXTURES = path.join(__dirname, 'fixtures');

export function fixture(name: string): string {
  return fs.readFileSync(path.join(FIXTURES, name), 'utf8');
}

export function fixtureJson<T = any>(name: string): T {
  return JSON.parse(fixture(name)) as T;
}

type Route = string | Buffer | ((url: string, init?: RequestInit) => Response | Promise<Response>);

function contentType(url: string, body: string | Buffer): string {
  if (Buffer.isBuffer(body)) return /\.jpe?g/i.test(url) ? 'image/jpeg' : 'image/png';
  const t = body.trimStart();
  return t.startsWith('{') || t.startsWith('[') ? 'application/json' : 'text/html; charset=utf-8';
}

/**
 * An Http client whose requests are answered by `routes` (longest matching URL prefix
 * wins). robots.txt allows everything unless a route says otherwise. No delays, no
 * SSRF lookups (tests use made-up hosts), and every request URL is recorded.
 */
export function fakeHttp(routes: Record<string, Route>, opts: { guard?: (u: URL) => Promise<void> } = {}): Http & { calls: string[] } {
  const calls: string[] = [];
  const prefixes = Object.keys(routes).sort((a, b) => b.length - a.length);
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push(`${init?.method ?? 'GET'} ${url}`);
    const prefix = prefixes.find((p) => url.startsWith(p));
    if (!prefix && url.endsWith('/robots.txt')) return new Response('User-agent: *\nAllow: /\n', { status: 200, headers: { 'content-type': 'text/plain' } });
    if (!prefix) return new Response('not found', { status: 404 });
    const route = routes[prefix];
    if (typeof route === 'function') return route(url, init);
    return new Response(route, { status: 200, headers: { 'content-type': contentType(url, route) } });
  }) as typeof fetch;
  const http = new Http({ fetchImpl, guard: opts.guard ?? false, minDelayMs: 0, retries: 0, sleep: async () => {} }) as Http & { calls: string[] };
  http.calls = calls;
  return http;
}

export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
