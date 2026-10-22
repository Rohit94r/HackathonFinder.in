'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { formatDate, formatTime, timeAgo } from '@/lib/format';
import { cn } from '@/lib/cn';

// Small building blocks shared by the admin screens.

export type Tone = 'neutral' | 'good' | 'warn' | 'bad' | 'brand';

const TONES: Record<Tone, string> = {
  neutral: 'bg-ink/5 text-ink/80',
  good: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-400/15 dark:text-emerald-200',
  warn: 'bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-200',
  bad: 'bg-red-100 text-red-900 dark:bg-red-500/15 dark:text-red-200',
  brand: 'bg-accent text-white',
};

export function Pill({ tone = 'neutral', children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold', TONES[tone], className)}>{children}</span>;
}

const STATE_TONE: Record<string, Tone> = { live: 'good', pending: 'warn', rejected: 'bad', removed: 'neutral' };
export function StatePill({ state }: { state: string }) {
  return <Pill tone={STATE_TONE[state] ?? 'neutral'}>{state}</Pill>;
}

const SUB_TONE: Record<string, Tone> = { pending: 'warn', processing: 'warn', approved: 'good', merged: 'good', rejected: 'bad' };
export function SubmissionStatusPill({ status }: { status: string }) {
  return <Pill tone={SUB_TONE[status] ?? 'neutral'}>{status}</Pill>;
}

const HEALTH_TONE: Record<string, Tone> = { ok: 'good', degraded: 'warn', failing: 'bad', blocked: 'bad', unknown: 'neutral' };
export function HealthPill({ health }: { health: string }) {
  return <Pill tone={HEALTH_TONE[health] ?? 'neutral'}>{health}</Pill>;
}

const RUN_TONE: Record<string, Tone> = { success: 'good', partial: 'warn', failed: 'bad', running: 'brand', queued: 'neutral', skipped: 'neutral' };
export function RunStatusPill({ status }: { status: string }) {
  return <Pill tone={RUN_TONE[status] ?? 'neutral'}>{status}</Pill>;
}

/** 0–1 confidence as a percentage, coloured by how much to trust it. */
export function ConfidencePill({ value }: { value: number | null | undefined }) {
  if (typeof value !== 'number') return null;
  const tone: Tone = value >= 0.8 ? 'good' : value >= 0.5 ? 'warn' : 'bad';
  return <Pill tone={tone}>{Math.round(value * 100)}% sure</Pill>;
}

/** "3 hours ago", rendered only in the browser so server and client never disagree. */
export function Ago({ at, fallback = 'never' }: { at: string | Date | null | undefined; fallback?: string }) {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => setNow(new Date().toISOString()), []);
  if (!at) return <>{fallback}</>;
  const iso = new Date(at).toISOString();
  return <time dateTime={iso} title={`${formatDate(iso)}, ${formatTime(iso)} IST`}>{now ? timeAgo(iso, now) : formatDate(iso)}</time>;
}

export function When({ at }: { at: string | Date | null | undefined }) {
  if (!at) return <>–</>;
  const iso = new Date(at).toISOString();
  return (
    <time dateTime={iso}>
      {formatDate(iso)}, {formatTime(iso)}
    </time>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink/20 px-6 py-10 text-center">
      <p className="font-semibold text-ink">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-lg text-sm text-ink/70">{children}</div>}
    </div>
  );
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
      {children}
    </p>
  );
}

export function Notice({ tone = 'neutral', children }: { tone?: 'neutral' | 'good' | 'warn'; children: React.ReactNode }) {
  const cls =
    tone === 'good'
      ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100'
      : tone === 'warn'
        ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100'
        : 'border-ink/10 bg-ink/5 text-ink/80';
  return <div className={cn('rounded-xl border px-4 py-3 text-sm', cls)}>{children}</div>;
}

/** A search box that waits until typing pauses before reporting the value. */
export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  useEffect(() => {
    if (text === value) return;
    const t = setTimeout(() => onChange(text), 300);
    return () => clearTimeout(t);
  }, [text, value, onChange]);
  return (
    <label className="relative block w-full sm:max-w-sm">
      <span className="sr-only">{placeholder}</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} className="input pl-9" type="search" />
    </label>
  );
}

export function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-center gap-3 text-sm">
      <button type="button" className="btn-secondary px-3 py-1.5 text-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft className="h-4 w-4" />
        Newer
      </button>
      <span className="text-ink/70">
        Page {page} of {pages}
      </span>
      <button type="button" className="btn-secondary px-3 py-1.5 text-sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Older
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Segmented filter buttons, e.g. live / pending / removed. */
export function Tabs<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string; count?: number }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn('chip text-sm', value === o.value && 'chip-active')}
        >
          {o.label}
          {typeof o.count === 'number' && <span className="opacity-70">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** Turns an API error's field keys ("listing.title", "fields.city") into the editor's keys ("title", "city"). */
export function editorErrors(fields: Record<string, string> | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields ?? {})) out[k.replace(/^(listing|fields)\./, '')] = v;
  return out;
}
