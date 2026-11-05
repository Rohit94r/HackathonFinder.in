'use client';

import { memo, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { localZone, stationClock } from '@/lib/clock';
import { cn } from '@/lib/cn';

export interface Departure {
  slug: string;
  title: string;
  /** City, or "Online". */
  gate: string;
  /** Registration deadline, ISO. */
  deadline: string;
}

// Each flap only turns forward through its drum, like the real thing, so cells land at
// different moments and the cascade is naturally ragged.
const LETTERS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.:-';
const DIGITS = '0123456789';
/** A long trip round the drum is cut to its last few flaps, so a page change stays snappy. */
const MAX_STEPS = 12;
const STEP_MS = 34;
const LAND_MS = 110;

const ROWS = 6;
const PAGE_MS = 8000;
const DAY = 86_400_000;

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The flaps between `from` and `to`, going forward round the drum (excluding `from`). */
function path(drum: string, from: string, to: string): string[] {
  const start = Math.max(0, drum.indexOf(from));
  const end = drum.indexOf(to);
  if (end < 0) return [to];
  const out: string[] = [];
  for (let i = (start + 1) % drum.length; ; i = (i + 1) % drum.length) {
    out.push(drum[i]);
    if (i === end) break;
  }
  return out.slice(-MAX_STEPS);
}

/**
 * One flap. On a change it riffles forward through its drum, each step a two-part fold
 * (the top half falls, the bottom half lands); the last step lands slower.
 */
const Flap = memo(function Flap({ char, delay, drum }: { char: string; delay: number; drum: string }) {
  const [state, setState] = useState({ current: char, previous: char, flip: 0, last: true });
  const live = useRef(char);

  useEffect(() => {
    if (char === live.current) return;
    if (reducedMotion()) {
      live.current = char;
      setState((s) => ({ ...s, current: char, previous: char }));
      return;
    }
    const steps = path(drum, live.current, char);
    let i = 0;
    let timer = setTimeout(function step() {
      const next = steps[i++];
      const last = i === steps.length;
      setState((s) => ({ current: next, previous: live.current, flip: s.flip + 1, last }));
      live.current = next;
      if (!last) timer = setTimeout(step, STEP_MS);
    }, delay);
    return () => clearTimeout(timer);
  }, [char, delay, drum]);

  const { current, previous, flip, last } = state;
  const ms = last ? LAND_MS : STEP_MS;
  return (
    <span className="flap" aria-hidden="true">
      <span className="flap-half flap-top">
        <span>{current}</span>
      </span>
      <span className="flap-half flap-bottom">
        <span>{flip ? previous : current}</span>
      </span>
      {flip > 0 && (
        <span key={flip} style={{ ['--flap-ms' as string]: `${ms}ms` }}>
          <span className="flap-half flap-top flap-fall">
            <span>{previous}</span>
          </span>
          <span className="flap-half flap-bottom flap-land">
            <span>{current}</span>
          </span>
        </span>
      )}
    </span>
  );
});

function Cells({ text, width, row, offset, numeric = false }: { text: string; width: number; row: number; offset: number; numeric?: boolean }) {
  const padded = text.toUpperCase().replace(/[^A-Z0-9:. -]/g, ' ').slice(0, width).padEnd(width, ' ');
  return (
    <span className="flex gap-[2px]">
      {padded.split('').map((ch, i) => (
        <Flap
          key={i}
          char={ch}
          // Digits roll on a digit drum; the "D", colons and spaces of a countdown never change.
          drum={numeric && DIGITS.includes(ch) ? DIGITS : LETTERS}
          delay={row * 70 + (offset + i) * 14}
        />
      ))}
    </span>
  );
}

function countdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.min(99, Math.floor(s / 86400));
  const hh = String(Math.floor((s % 86400) / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${String(d).padStart(2, '0')}D ${hh}:${mm}:${ss}`;
}

function spoken(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return 'in under an hour';
  if (h < 24) return `in ${h} ${h === 1 ? 'hour' : 'hours'}`;
  const d = Math.round(h / 24);
  return d === 1 ? 'tomorrow' : `in ${d} days`;
}

interface Status {
  en: string;
  tone: string;
  lamp: string;
}

function status(ms: number): Status {
  if (ms < DAY) return { en: 'FINAL CALL', tone: 'text-[#fca5a5]', lamp: 'bg-[#f87171] shadow-[0_0_10px_#f87171] animate-pulse motion-reduce:animate-none' };
  if (ms < 3 * DAY) return { en: 'BOARDING', tone: 'text-[#fcd34d]', lamp: 'bg-[#fbbf24] shadow-[0_0_10px_#fbbf24]' };
  return { en: 'ON TIME', tone: 'text-[#86efac]', lamp: 'bg-[#4ade80] shadow-[0_0_10px_#4ade80]' };
}

type Size = 'sm' | 'md' | 'lg';
const WIDTHS: Record<Size, { no: boolean; title: number; gate: number; status: boolean }> = {
  sm: { no: false, title: 10, gate: 0, status: false },
  md: { no: false, title: 16, gate: 9, status: false },
  lg: { no: true, title: 19, gate: 10, status: true },
};

function useSize(): Size {
  const [size, setSize] = useState<Size>('lg');
  useEffect(() => {
    const md = window.matchMedia('(min-width: 768px)');
    const lg = window.matchMedia('(min-width: 1024px)');
    const update = () => setSize(lg.matches ? 'lg' : md.matches ? 'md' : 'sm');
    update();
    md.addEventListener('change', update);
    lg.addEventListener('change', update);
    return () => {
      md.removeEventListener('change', update);
      lg.removeEventListener('change', update);
    };
  }, []);
  return size;
}

/**
 * The hero's departures board, split-flap style: the next hackathon deadlines with
 * live countdowns, a page flip every few seconds and an announcement ticker.
 * Every row links to its event.
 */
export default function DeparturesBoard({ departures, nowIso }: { departures: Departure[]; nowIso: string }) {
  // The first render uses the server's clock so it matches the HTML; then it ticks live.
  const [now, setNow] = useState(() => Date.parse(nowIso));
  const [page, setPage] = useState(0);
  // UTC until mounted (matches the server), then the visitor's own zone.
  const [zone, setZone] = useState('UTC');
  const size = useSize();
  const w = WIDTHS[size];

  useEffect(() => {
    setZone(localZone());
    setNow(Date.now());
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const upcoming = departures.filter((d) => Date.parse(d.deadline) > now);
  const pages = Math.max(1, Math.ceil(upcoming.length / ROWS));

  useEffect(() => {
    if (pages < 2 || reducedMotion()) return;
    // Holds the page while the visitor has paused animations (MotionToggle).
    const id = setInterval(() => document.documentElement.dataset.motion !== 'paused' && setPage((p) => (p + 1) % pages), PAGE_MS);
    return () => clearInterval(id);
  }, [pages]);

  if (!upcoming.length) return null;

  const first = (page % pages) * ROWS;
  const rows = upcoming.slice(first, first + ROWS);
  const clock = stationClock(now, zone);
  const announcements = upcoming.slice(0, 8).map((d) => `${d.title} (${d.gate}) closes ${spoken(Date.parse(d.deadline) - now)}`);
  const col = (n: number) => ({ width: `calc(${n} * var(--flap-w) - 2px)` });

  return (
    <section aria-label="Next hackathon deadlines" className="departures">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6">
        <p className="flex items-center gap-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#fbbf24] sm:text-xs">
          <span className="inline-block h-2 w-2 rounded-full bg-[#fbbf24]" aria-hidden="true" />
          Departures
          <span className="hidden text-white/60 sm:inline">· next registration deadlines</span>
        </p>
        <p className="font-mono text-[11px] tabular-nums text-white/60 sm:text-xs">
          {clock.zone} <span className="text-white/85">{clock.time}</span>
        </p>
      </div>

      <div className="overflow-hidden px-2 py-3 sm:px-5 sm:py-4">
        <div className="departures-grid mb-2 hidden font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#fbbf24]/75 sm:flex" aria-hidden="true">
          {w.no && (
            <span className="shrink-0" style={col(3)}>
              No.
            </span>
          )}
          <span className="shrink-0" style={col(12)}>
            Closes in
          </span>
          <span className="shrink-0" style={col(w.title)}>
            Hackathon
          </span>
          {w.gate > 0 && (
            <span className="shrink-0" style={col(w.gate)}>
              Where
            </span>
          )}
          {w.status && <span>Status</span>}
        </div>
        <ul className="space-y-[6px]">
          {rows.map((d, i) => {
            const ms = Date.parse(d.deadline) - now;
            const st = status(ms);
            return (
              <li key={i}>
                <Link href={`/hackathons/${d.slug}`} prefetch={false} className="departures-grid group flex items-center rounded-md py-0.5 transition-colors hover:bg-white/[0.05]">
                  <span className="sr-only">
                    {d.title}, {d.gate}, registration closes {spoken(ms)}
                  </span>
                  {w.no && <Cells text={String(first + i + 1).padStart(3, '0')} width={3} row={i} offset={0} numeric />}
                  <Cells text={countdown(ms)} width={12} row={i} offset={3} numeric />
                  <Cells text={d.title} width={w.title} row={i} offset={15} />
                  {w.gate > 0 && <Cells text={d.gate} width={w.gate} row={i} offset={15 + w.title} />}
                  {w.status ? (
                    <span className={cn('ml-1 flex items-center gap-2 whitespace-nowrap font-mono text-[13px] font-semibold tracking-wider', st.tone)} aria-hidden="true">
                      <span className={cn('h-2 w-2 shrink-0 rounded-full', st.lamp)} />
                      {st.en}
                    </span>
                  ) : (
                    <span className={cn('ml-1 h-2 w-2 shrink-0 rounded-full', st.lamp)} aria-hidden="true" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Station announcement ticker. */}
      <div className="flex items-center gap-4 border-t border-white/10 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] sm:px-6 sm:text-[11px]">
        <span className="shrink-0 text-white/60">
          {(page % pages) + 1}/{pages}
        </span>
        <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]" aria-hidden="true">
          <div className="flex w-max whitespace-nowrap text-[#fbbf24]/85 motion-safe:animate-marquee" style={{ animationDuration: '50s' }}>
            {[0, 1].map((copy) => (
              <span key={copy} className="pr-10">
                <span className="text-[#fde68a]">Attention please, hackers</span>
                {announcements.map((a) => (
                  <span key={a}>
                    <span className="px-3 text-white/25">◆</span>
                    {a}
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
        <Link href="/hackathons" className="shrink-0 text-white/70 transition-colors hover:text-white">
          All departures →
        </Link>
      </div>
    </section>
  );
}
