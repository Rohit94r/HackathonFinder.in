'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Clock, Flag } from 'lucide-react';
import type { HackathonView } from '@/lib/hackathons';
import { formatWeekday } from '@/lib/format';
import { themeStyle } from '@/lib/themeStyles';
import { cn } from '@/lib/cn';

const TZ_OFFSET_MS = 330 * 60 * 1000;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Calendar date key in India time, e.g. "2026-10-21". */
function dayKey(iso: string): string {
  return new Date(Date.parse(iso) + TZ_OFFSET_MS).toISOString().slice(0, 10);
}

interface DayEvent {
  h: HackathonView;
  kind: 'start' | 'deadline';
}

export default function CalendarView({ items, nowIso }: { items: HackathonView[]; nowIso: string }) {
  const today = dayKey(nowIso);
  const [year, setYear] = useState(Number(today.slice(0, 4)));
  const [month, setMonth] = useState(Number(today.slice(5, 7)) - 1);
  const [show, setShow] = useState<'both' | 'start' | 'deadline'>('both');

  const byDay = useMemo(() => {
    const map = new Map<string, DayEvent[]>();
    const add = (key: string, e: DayEvent) => map.set(key, [...(map.get(key) ?? []), e]);
    for (const h of items) {
      if (show !== 'deadline') add(dayKey(h.startDate), { h, kind: 'start' });
      if (show !== 'start' && h.daysToDeadline >= 0) add(dayKey(h.registrationDeadline), { h, kind: 'deadline' });
    }
    return map;
  }, [items, show]);

  const cells = useMemo(() => {
    const first = new Date(Date.UTC(year, month, 1));
    const lead = (first.getUTCDay() + 6) % 7; // Monday-first
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const total = Math.ceil((lead + daysInMonth) / 7) * 7;
    return Array.from({ length: total }, (_, i) => {
      const day = i - lead + 1;
      if (day < 1 || day > daysInMonth) return null;
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return { day, key, events: byDay.get(key) ?? [] };
    });
  }, [year, month, byDay]);

  const monthEvents = cells.filter((c): c is NonNullable<typeof c> => Boolean(c && c.events.length));

  const shift = (delta: number) => {
    const d = new Date(Date.UTC(year, month + delta, 1));
    setYear(d.getUTCFullYear());
    setMonth(d.getUTCMonth());
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => shift(-1)} className="btn-secondary h-10 w-10 p-0" aria-label="Previous month">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="min-w-[200px] text-center text-2xl font-bold" aria-live="polite">
            {MONTHS[month]} {year}
          </h2>
          <button type="button" onClick={() => shift(1)} className="btn-secondary h-10 w-10 p-0" aria-label="Next month">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="flex gap-2" role="group" aria-label="Show">
          {[
            { value: 'both' as const, label: 'Everything' },
            { value: 'start' as const, label: 'Start dates' },
            { value: 'deadline' as const, label: 'Deadlines' },
          ].map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={show === o.value}
              onClick={() => setShow(o.value)}
              className={cn('chip', show === o.value && 'chip-active')}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Month grid (tablet and up) */}
      <div className="card hidden overflow-hidden md:block">
        <div className="grid grid-cols-7 border-b border-ink/15 bg-surface/60">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-ink/60">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((cell, i) => (
            <div
              key={cell?.key ?? `empty-${i}`}
              className={cn(
                'min-h-[120px] border-b border-r border-ink/10 p-2 [&:nth-child(7n)]:border-r-0',
                !cell && 'bg-surface/60'
              )}
            >
              {cell && (
                <>
                  <span
                    className={cn(
                      'mb-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold',
                      cell.key === today ? 'bg-ink text-surface' : 'text-ink/80'
                    )}
                  >
                    {cell.day}
                  </span>
                  <ul className="space-y-1">
                    {cell.events.slice(0, 3).map(({ h, kind }) => (
                      <li key={`${h.slug}-${kind}`}>
                        <Link
                          href={`/hackathons/${h.slug}`}
                          className={cn(
                            'flex items-center gap-1 truncate rounded-md px-1.5 py-1 text-[11px] font-semibold',
                            kind === 'deadline' ? 'bg-ink text-white' : 'bg-ink/5 text-ink'
                          )}
                          title={`${kind === 'deadline' ? 'Deadline' : 'Starts'}: ${h.title}`}
                        >
                          {kind === 'deadline' ? <Clock className="h-3 w-3 shrink-0" /> : <Flag className="h-3 w-3 shrink-0" />}
                          <span className="truncate">{h.title}</span>
                        </Link>
                      </li>
                    ))}
                    {cell.events.length > 3 && (
                      <li className="px-1.5 text-[11px] font-medium text-ink/60">+{cell.events.length - 3} more</li>
                    )}
                  </ul>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Agenda list (phones) */}
      <div className="space-y-3 md:hidden">
        {monthEvents.length === 0 && (
          <p className="card p-6 text-center text-sm text-ink/70">Nothing this month yet. Try the next month.</p>
        )}
        {monthEvents.map((cell) => (
          <div key={cell.key} className="card p-4">
            <p className={cn('mb-2 text-sm font-bold', cell.key === today ? 'text-ink' : 'text-ink')}>
              {formatWeekday(`${cell.key}T06:30:00.000Z`)}
              {cell.key === today && ' · Today'}
            </p>
            <ul className="space-y-2">
              {cell.events.map(({ h, kind }) => (
                <li key={`${h.slug}-${kind}`}>
                  <Link href={`/hackathons/${h.slug}`} className="flex items-center gap-2 text-sm">
                    <span
                      className={cn(
                        'rounded-md px-2 py-0.5 text-[11px] font-semibold',
                        kind === 'deadline' ? 'bg-ink text-white' : 'bg-ink/5 text-ink'
                      )}
                    >
                      {kind === 'deadline' ? 'Deadline' : 'Starts'}
                    </span>
                    <span className="font-medium text-ink">{h.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink/70">
        <span className="flex items-center gap-1.5">
          <Flag className="h-3.5 w-3.5 text-ink" /> Event starts
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-ink" /> Registration deadline
        </span>
      </div>
    </div>
  );
}
