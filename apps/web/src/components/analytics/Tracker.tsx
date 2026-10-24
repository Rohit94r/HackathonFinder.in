'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// First-party analytics for the public site, mounted once in app/layout.tsx. Sends a
// page view on every route change, the time spent on the page when the visitor leaves,
// and batches of hackathon-card impressions (elements with data-hf-impression="<slug>",
// at least half visible for a second) and clicks (data-hf-click="<label>").
// Nothing is sent from /admin, or when the browser asks not to be tracked.

const ENDPOINT = '/api/track';
const VISITOR_COOKIE = 'hf_vid';
const SESSION_COOKIE = 'hf_sid';
const YEAR_S = 365 * 24 * 60 * 60;
const SESSION_S = 30 * 60;
const IMPRESSION_MS = 1000;
const FLUSH_MS = 5000;
const BATCH = 50;
const ID = /^[A-Za-z0-9-]{8,64}$/;

type Item = { k: 'impression' | 'click'; v: string };

interface PageState {
  id: string;
  path: string;
  visibleMs: number;
  visibleSince: number | null;
  /** Slugs already counted as impressions on this page view. */
  seen: Set<string>;
}

function optedOut(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string };
  const win = window as Window & { doNotTrack?: string };
  return nav.globalPrivacyControl === true || nav.doNotTrack === '1' || nav.doNotTrack === 'yes' || win.doNotTrack === '1' || nav.msDoNotTrack === '1';
}

function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

function writeCookie(name: string, value: string, maxAge: number) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
}

const hex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

function randomId(): string {
  return typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : hex(crypto.getRandomValues(new Uint8Array(16)));
}

/** The visitor id (kept a year) and session id (ends after 30 minutes without activity), refreshed on every use. */
function ids(): { vid: string; sid: string } {
  let vid = readCookie(VISITOR_COOKIE);
  if (!vid || !ID.test(vid)) vid = randomId();
  let sid = readCookie(SESSION_COOKIE);
  if (!sid || !ID.test(sid)) sid = randomId();
  writeCookie(VISITOR_COOKIE, vid, YEAR_S);
  writeCookie(SESSION_COOKIE, sid, SESSION_S);
  return { vid, sid };
}

function send(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  try {
    // A plain string goes as text/plain, which needs no preflight and survives page unload.
    if (navigator.sendBeacon?.(ENDPOINT, body)) return;
  } catch {
    // Fall through to fetch.
  }
  fetch(ENDPOINT, { method: 'POST', body, keepalive: true, credentials: 'same-origin', headers: { 'Content-Type': 'text/plain;charset=UTF-8' } }).catch(() => {});
}

const skipped = (path: string) => /^\/(admin|api)(\/|$)/.test(path);

export default function Tracker() {
  const pathname = usePathname();
  const ref = useRef<{
    on: boolean;
    page: PageState | null;
    queue: Item[];
    landed: boolean;
    rescan: () => void;
    flush: () => void;
    end: () => void;
  }>({ on: false, page: null, queue: [], landed: false, rescan: () => {}, flush: () => {}, end: () => {} });

  // Listeners for leaving, visibility, clicks and impressions, set up once.
  useEffect(() => {
    if (optedOut()) return;
    const s = ref.current;
    s.on = true;

    const flush = () => {
      const page = s.page;
      if (!page || !s.queue.length) return;
      const { vid, sid } = ids();
      while (s.queue.length) send({ t: 'ev', vid, sid, path: page.path, items: s.queue.splice(0, BATCH) });
    };
    const pause = () => {
      const page = s.page;
      if (page?.visibleSince != null) {
        page.visibleMs += Date.now() - page.visibleSince;
        page.visibleSince = null;
      }
    };
    /** Reports the time seen so far; the server keeps the longest report for the page view. */
    const end = () => {
      const page = s.page;
      if (!page) return;
      pause();
      flush();
      const vid = readCookie(VISITOR_COOKIE);
      if (vid && ID.test(vid) && page.visibleMs >= 200) send({ t: 'leave', id: page.id, vid, ms: Math.round(page.visibleMs) });
    };
    const queue = (item: Item) => {
      if (!s.page) return;
      s.queue.push(item);
      if (s.queue.length >= 20) flush();
    };

    // Impressions: at least half the card on screen for a second, once per slug per page view.
    const timers = new Map<Element, number>();
    const visible = new Set<Element>();
    const observed = new WeakSet<Element>();
    const io =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver(
            (entries) => {
              for (const entry of entries) {
                const el = entry.target;
                if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                  visible.add(el);
                  if (timers.has(el)) continue;
                  timers.set(
                    el,
                    window.setTimeout(() => {
                      timers.delete(el);
                      const slug = el.getAttribute('data-hf-impression')?.trim();
                      const page = s.page;
                      if (!slug || !page || !el.isConnected || !visible.has(el) || document.visibilityState !== 'visible') return;
                      if (page.seen.has(slug)) return;
                      page.seen.add(slug);
                      queue({ k: 'impression', v: slug.slice(0, 120) });
                    }, IMPRESSION_MS)
                  );
                } else {
                  visible.delete(el);
                  const t = timers.get(el);
                  if (t) window.clearTimeout(t);
                  timers.delete(el);
                }
              }
            },
            { threshold: [0, 0.5, 1] }
          )
        : null;

    const scan = () => {
      if (!io) return;
      document.querySelectorAll('[data-hf-impression]').forEach((el) => {
        if (observed.has(el)) return;
        observed.add(el);
        io.observe(el);
      });
    };
    let scanTimer = 0;
    const scheduleScan = () => {
      window.clearTimeout(scanTimer);
      scanTimer = window.setTimeout(scan, 250);
    };
    const mo =
      typeof MutationObserver === 'function'
        ? new MutationObserver((mutations) => {
            for (const m of mutations) {
              // A card reused for another hackathon starts over.
              if (m.type === 'attributes' && m.target instanceof Element && io) {
                io.unobserve(m.target);
                observed.delete(m.target);
              }
            }
            scheduleScan();
          })
        : null;
    mo?.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-hf-impression'] });

    /** A new page view: every card on screen can count again. */
    s.rescan = () => {
      if (!io) return;
      io.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
      timers.clear();
      visible.clear();
      document.querySelectorAll('[data-hf-impression]').forEach((el) => {
        observed.add(el);
        io.observe(el);
      });
    };
    s.flush = flush;
    s.end = end;

    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.('[data-hf-click]');
      const label = el?.getAttribute('data-hf-click')?.trim();
      if (label) queue({ k: 'click', v: label.slice(0, 120) });
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') end();
      else if (s.page) {
        s.page.visibleSince = Date.now();
        ids();
      }
    };
    const onPageShow = (e: PageTransitionEvent) => {
      // Back from the browser's page cache: that's a new visit to this page.
      if (e.persisted && s.page) start(s.page.path, true);
    };
    const timer = window.setInterval(flush, FLUSH_MS);
    document.addEventListener('click', onClick, { capture: true });
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', end);
    window.addEventListener('pageshow', onPageShow);
    scan();

    return () => {
      window.clearInterval(timer);
      window.clearTimeout(scanTimer);
      timers.forEach((t) => window.clearTimeout(t));
      document.removeEventListener('click', onClick, { capture: true });
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', end);
      window.removeEventListener('pageshow', onPageShow);
      mo?.disconnect();
      io?.disconnect();
      s.on = false;
      s.rescan = () => {};
      s.flush = () => {};
      s.end = () => {};
    };
  }, []);

  /** Ends the current page view (if any) and starts one for `path`. */
  function start(path: string, force = false) {
    const s = ref.current;
    if (!s.on) return;
    if (!force && s.page?.path === path) return;
    s.end();
    s.page = null;
    if (skipped(path)) return;
    const { vid, sid } = ids();
    const id = hex(crypto.getRandomValues(new Uint8Array(12)));
    const payload: Record<string, unknown> = { t: 'pv', id, vid, sid, path };
    // Where they came from and the campaign only matter on the page they landed on.
    if (!s.landed) {
      s.landed = true;
      if (document.referrer) payload.ref = document.referrer.slice(0, 1000);
      const q = new URLSearchParams(window.location.search);
      const utm = { s: q.get('utm_source') ?? undefined, m: q.get('utm_medium') ?? undefined, c: q.get('utm_campaign') ?? undefined };
      if (utm.s || utm.m || utm.c) payload.utm = { s: utm.s?.slice(0, 200), m: utm.m?.slice(0, 200), c: utm.c?.slice(0, 200) };
    }
    s.page = { id, path, visibleMs: 0, visibleSince: document.visibilityState === 'visible' ? Date.now() : null, seen: new Set() };
    send(payload);
    s.rescan();
  }

  // A page view on every route change. Query-string changes (filters) aren't new pages.
  useEffect(() => {
    if (pathname) start(pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
