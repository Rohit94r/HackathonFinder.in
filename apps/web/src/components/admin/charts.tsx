'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { num } from './ui';

// Hand-made charts in black and grey. One axis only; every chart has a table view.

export interface Point {
  /** "2026-10-24" for days, "2026-10-24T14" for hours (India time). */
  key: string;
  views: number;
  visitors: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "24 Oct" or "2 PM". */
export function bucketLabel(key: string, long = false): string {
  const [date, hour] = key.split('T');
  const [, m, d] = date.split('-').map(Number);
  if (hour !== undefined) {
    const h = Number(hour);
    const label = `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`;
    return long ? `${d} ${MONTHS[m - 1]}, ${label}` : label;
  }
  return `${d} ${MONTHS[m - 1]}`;
}

/** A tidy top value for the axis: 1, 2, 5 × 10ⁿ. */
function niceMax(v: number): number {
  if (v <= 4) return 4;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

/** Page views (grey) with visitors (black) inside each bar, per day or hour, with a hover readout and a table view. */
export function TrafficChart({ points, height = 180 }: { points: Point[]; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const max = useMemo(() => niceMax(Math.max(1, ...points.map((p) => p.views))), [points]);
  // Drawn at the box's real width (one unit = one pixel), so labels stay 10px on any screen.
  const boxRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(720);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setW(Math.max(280, Math.round(el.clientWidth)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = height;
  const padL = 34;
  const padB = 22;
  const plotW = W - padL - 4;
  const plotH = H - padB - 6;
  const slot = plotW / Math.max(1, points.length);
  const barW = Math.max(2, Math.min(28, slot - 2));
  const inner = Math.max(1, barW * 0.45);
  const y = (v: number) => 6 + plotH - (v / max) * plotH;
  const labelEvery = Math.max(1, Math.ceil(points.length / 8));
  const active = hover !== null ? points[hover] : null;
  const totals = points.reduce((t, p) => ({ views: t.views + p.views, visitors: t.visitors + p.visitors }), { views: 0, visitors: 0 });

  return (
    <div ref={boxRef}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-4" aria-hidden={asTable}>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 bg-black" /> Visitors
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 bg-neutral-300" /> Page views
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="tabular-nums text-neutral-500" aria-live="polite">
            {active ? `${bucketLabel(active.key, true)}: ${num(active.visitors)} visitors · ${num(active.views)} page views` : `${num(totals.views)} page views in all`}
          </span>
          <button type="button" className="underline decoration-neutral-400 underline-offset-2 hover:decoration-black" onClick={() => setAsTable((t) => !t)}>
            {asTable ? 'Chart' : 'Table'}
          </button>
        </div>
      </div>
      {asTable ? (
        <div className="max-h-72 overflow-y-auto border border-neutral-300">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="border-b border-neutral-300 px-3 py-1.5 text-left text-[11px] uppercase text-neutral-500">When</th>
                <th className="border-b border-neutral-300 px-3 py-1.5 text-right text-[11px] uppercase text-neutral-500">Visitors</th>
                <th className="border-b border-neutral-300 px-3 py-1.5 text-right text-[11px] uppercase text-neutral-500">Page views</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.key}>
                  <td className="border-b border-neutral-200 px-3 py-1">{bucketLabel(p.key, true)}</td>
                  <td className="border-b border-neutral-200 px-3 py-1 text-right tabular-nums">{num(p.visitors)}</td>
                  <td className="border-b border-neutral-200 px-3 py-1 text-right tabular-nums">{num(p.views)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block max-w-full" role="img" aria-label={`Visitors and page views, ${points.length} ${points[0]?.key.includes('T') ? 'hours' : 'days'}`} onMouseLeave={() => setHover(null)}>
          {[0, 0.5, 1].map((f) => (
            <g key={f}>
              <line x1={padL} x2={W - 4} y1={y(max * f)} y2={y(max * f)} stroke="#e5e5e5" strokeWidth={1} />
              <text x={padL - 6} y={y(max * f) + 3} textAnchor="end" fontSize={10} fill="#666">
                {num(Math.round(max * f))}
              </text>
            </g>
          ))}
          {points.map((p, i) => {
            const x = padL + i * slot + (slot - barW) / 2;
            const on = hover === i;
            return (
              <g key={p.key}>
                <rect x={x} y={y(p.views)} width={barW} height={Math.max(0, y(0) - y(p.views))} fill={on ? '#a3a3a3' : '#d4d4d4'} />
                <rect x={x + (barW - inner) / 2} y={y(p.visitors)} width={inner} height={Math.max(0, y(0) - y(p.visitors))} fill="#000" />
                {i % labelEvery === 0 && (
                  <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize={10} fill="#666">
                    {bucketLabel(p.key)}
                  </text>
                )}
                {/* A full-height hit area, wider than the bar, for hover and touch. */}
                <rect x={padL + i * slot} y={0} width={slot} height={H - padB} fill="transparent" onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)}>
                  <title>{`${bucketLabel(p.key, true)}: ${p.visitors} visitors, ${p.views} page views`}</title>
                </rect>
              </g>
            );
          })}
          <line x1={padL} x2={W - 4} y1={y(0)} y2={y(0)} stroke="#000" strokeWidth={1} />
        </svg>
      )}
    </div>
  );
}

export interface BarRow {
  label: string;
  value: number;
  /** Shown after the value, e.g. "120 views". */
  sub?: string;
  href?: string;
  /** Opens in a new tab (outside links). */
  external?: boolean;
}

/** A ranked list with a thin bar under each row, scaled to the largest value. */
export function BarList({ rows, empty = 'Nothing yet.', unit }: { rows: BarRow[]; empty?: string; unit?: string }) {
  if (!rows.length) return <p className="py-3 text-sm text-neutral-500">{empty}</p>;
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ol className="space-y-2">
      {rows.map((r, i) => {
        const label = r.href ? (
          r.external ? (
            <a href={r.href} target="_blank" rel="noopener noreferrer nofollow" className="truncate hover:underline">
              {r.label}
            </a>
          ) : (
            <Link href={r.href} className="truncate hover:underline">
              {r.label}
            </Link>
          )
        ) : (
          <span className="truncate">{r.label}</span>
        );
        return (
          <li key={`${r.label}-${i}`} className="text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-baseline gap-2">
                <span className="w-4 shrink-0 text-right text-xs tabular-nums text-neutral-400">{i + 1}</span>
                {label}
              </span>
              <span className="shrink-0 tabular-nums">
                {num(r.value)}
                {unit && <span className="text-neutral-500"> {unit}</span>}
                {r.sub && <span className="ml-1 text-xs text-neutral-500">{r.sub}</span>}
              </span>
            </div>
            <div className="ml-6 mt-1 h-[3px] bg-neutral-200">
              <div className={cn('h-full bg-black')} style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** A plain progress bar: done of total. */
export function Progress({ done, total, label }: { done: number; total: number; label?: string }) {
  const share = total > 0 ? Math.min(1, done / total) : 0;
  return (
    <div>
      <div className="h-2.5 w-full border border-black bg-white" role="progressbar" aria-valuemin={0} aria-valuemax={total || 1} aria-valuenow={done} aria-label={label ?? 'Progress'}>
        <div className="h-full bg-black transition-[width] duration-500" style={{ width: `${share * 100}%` }} />
      </div>
    </div>
  );
}
