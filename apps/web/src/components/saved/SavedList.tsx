'use client';

import Link from 'next/link';
import { Bookmark, CalendarDays, Clock, LogIn, Trash2 } from 'lucide-react';
import type { HackathonView } from '@/lib/hackathons';
import { TRACK_LABELS, useSaved, type TrackStatus } from '@/lib/useSaved';
import { deadlineLabel, formatDateRange } from '@/lib/format';
import EventArt from '@/components/hackathon/EventArt';
import StatusBadge from '@/components/hackathon/StatusBadge';
import { cn } from '@/lib/cn';

const COLUMNS: TrackStatus[] = ['saved', 'registered', 'submitted', 'done'];

const COLUMN_STYLES: Record<TrackStatus, string> = {
  saved: 'bg-ink/[0.06] text-ink/80',
  registered: 'bg-brand-50 text-brand-700 dark:bg-brand-400/15 dark:text-brand-200',
  submitted: 'bg-ink/5 text-ink dark:bg-white/10 dark:text-white',
  done: 'bg-ink text-surface',
};

/** Signed-out students keep their list in this browser; it moves to the account when they sign in. */
function GuestBanner() {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-lg border border-ink/10 bg-ink/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-ink/80">
        <strong className="text-ink">Sign in to keep your list on every device.</strong> Right now it’s saved in this browser only; it
        moves to your account when you sign in.
      </p>
      <div className="flex shrink-0 gap-2">
        <Link href="/login?next=%2Fsaved" className="btn-primary px-4 py-2 text-sm">
          <LogIn className="h-4 w-4" aria-hidden="true" />
          Sign in
        </Link>
        <Link href="/signup?next=%2Fsaved" className="btn-secondary px-4 py-2 text-sm">
          Sign up
        </Link>
      </div>
    </div>
  );
}

export default function SavedList({ items }: { items: HackathonView[] }) {
  const { saved, ready, signedIn, setStatus, remove } = useSaved();

  if (!ready) {
    return <div className="card h-48 animate-pulse bg-ink/5" aria-label="Loading your list" />;
  }

  const list = items.filter((h) => saved[h.slug]);
  const banner = signedIn ? null : <GuestBanner />;

  if (list.length === 0) {
    return (
      <>
        {banner}
        <div className="card flex flex-col items-center px-6 py-16 text-center">
          <span className="mb-4 rounded-xl bg-ink/5 p-4 text-ink">
            <Bookmark className="h-7 w-7" />
          </span>
          <h2 className="text-xl font-bold">Your list is empty</h2>
          <p className="mt-2 max-w-md text-sm text-ink/70">
            Tap the bookmark on any hackathon to save it here. Then track it from saved to registered,
            submitted and done.
          </p>
          <Link href="/hackathons" className="btn-primary mt-6">
            Find hackathons
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      {banner}
      <div className="grid gap-6 lg:grid-cols-4">
        {COLUMNS.map((col) => {
          const inCol = list.filter((h) => saved[h.slug] === col);
          return (
            <section key={col} aria-label={TRACK_LABELS[col]} className="rounded-xl bg-card/60 p-3 ring-1 ring-ink/15">
              <h2 className="mb-3 flex items-center justify-between px-1 font-sans text-sm font-semibold">
                <span className={cn('rounded-full px-2.5 py-1', COLUMN_STYLES[col])}>{TRACK_LABELS[col]}</span>
                <span className="text-ink/45">{inCol.length}</span>
              </h2>
              <ul className="space-y-3">
                {inCol.map((h) => (
                  <li key={h.slug} className="card overflow-hidden">
                    <EventArt title={h.title} imageUrl={h.imageUrl} className="h-14" />
                    <div className="space-y-2 p-4">
                      <Link href={`/hackathons/${h.slug}`} className="block font-display font-bold leading-snug text-ink hover:underline">
                        {h.title}
                      </Link>
                      <StatusBadge status={h.status} />
                      <p className="flex items-center gap-1.5 text-xs text-ink/70">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDateRange(h.startDate, h.endDate)}
                      </p>
                      {(h.status === 'open' || h.status === 'closing-soon') && (
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-300">
                          <Clock className="h-3.5 w-3.5" />
                          {deadlineLabel(h.daysToDeadline)}
                        </p>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        <label htmlFor={`track-${h.slug}`} className="sr-only">
                          Progress for {h.title}
                        </label>
                        <select
                          id={`track-${h.slug}`}
                          value={saved[h.slug]}
                          onChange={(e) => setStatus(h.slug, e.target.value as TrackStatus, h.title)}
                          className="input flex-1 py-1.5 text-xs"
                        >
                          {COLUMNS.map((c) => (
                            <option key={c} value={c}>
                              {TRACK_LABELS[c]}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => remove(h.slug)}
                          className="rounded-lg p-2 text-ink/45 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-400/10 dark:hover:text-rose-400"
                          aria-label={`Remove ${h.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
                {inCol.length === 0 && <li className="px-1 py-4 text-center text-xs text-ink/45">Nothing here yet</li>}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
