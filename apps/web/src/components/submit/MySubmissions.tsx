'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { ArrowUpRight, Inbox } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';

interface MySubmission {
  id: string;
  kind: 'quick' | 'organizer' | 'extension';
  status: 'pending' | 'approved' | 'merged' | 'rejected';
  title: string;
  url: string;
  seenOn: string;
  createdAt: string;
  reviewNote: string;
  hackathon: { slug: string; title: string } | null;
}

const STATUS: Record<MySubmission['status'], { label: string; className: string }> = {
  pending: { label: 'In review', className: 'bg-ink/5 text-ink dark:bg-white/10 dark:text-white' },
  approved: { label: 'Live', className: 'bg-brand-50 text-brand-800 dark:bg-brand-400/15 dark:text-brand-200' },
  merged: { label: 'Already listed', className: 'bg-brand-50 text-brand-800 dark:bg-brand-400/15 dark:text-brand-200' },
  rejected: { label: 'Not listed', className: 'bg-ink/5 text-ink/80' },
};

const KIND: Record<MySubmission['kind'], string> = { quick: 'Quick share', organizer: 'Organizer form', extension: 'Browser extension' };

/** "Your submissions" for signed-in students, with where each one stands. */
export default function MySubmissions() {
  const { status } = useSession();
  const { data, error, isLoading } = useSWR<{ items: MySubmission[] }>(status === 'authenticated' ? '/api/me/submissions' : null);
  if (status !== 'authenticated') return null;

  return (
    <div className="card p-6">
      <h2 className="text-lg font-bold">Your submissions</h2>
      {isLoading && <p className="mt-3 text-sm text-ink/60">Loading…</p>}
      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">We couldn’t load them right now.</p>}
      {data && data.items.length === 0 && (
        <p className="mt-3 flex items-start gap-2 text-sm text-ink/70">
          <Inbox className="mt-0.5 h-4 w-4 shrink-0" />
          Nothing yet. Hackathons you share show up here, with a link once they’re live.
        </p>
      )}
      {data && data.items.length > 0 && (
        <ul className="mt-4 divide-y divide-ink/10">
          {data.items.map((s) => {
            const st = STATUS[s.status] ?? STATUS.pending;
            return (
              <li key={s.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 break-words text-sm font-semibold text-ink">{s.hackathon?.title ?? s.title}</p>
                  <span className={cn('shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold', st.className)}>{st.label}</span>
                </div>
                <p className="mt-0.5 text-xs text-ink/60">
                  {KIND[s.kind]} · {formatDate(s.createdAt)}
                </p>
                {s.hackathon && (
                  <Link href={`/hackathons/${s.hackathon.slug}`} className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline">
                    See the listing
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                )}
                {s.status === 'rejected' && s.reviewNote && <p className="mt-1 text-xs text-ink/70">{s.reviewNote}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
