'use client';

import { useState } from 'react';
import { Flag, Loader2, X } from 'lucide-react';
import { apiFetch, ApiClientError } from '@/lib/apiClient';
import { cn } from '@/lib/cn';

const REASONS = [
  { value: 'wrong-details', label: 'Wrong details' },
  { value: 'expired', label: 'Expired or cancelled' },
  { value: 'broken-link', label: 'Broken link' },
  { value: 'duplicate', label: 'Listed twice' },
  { value: 'scam', label: 'Scam or suspicious fee' },
  { value: 'other', label: 'Something else' },
] as const;

/**
 * "Report this listing" for event pages: <ReportListingButton slug={h.slug} />.
 * Posts to /api/hackathons/[slug]/report; works signed in or out.
 */
export default function ReportListingButton({ slug, className }: { slug: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>('');
  const [details, setDetails] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return setError('Pick what’s wrong.');
    setState('sending');
    setError('');
    try {
      await apiFetch(`/api/hackathons/${encodeURIComponent(slug)}/report`, { body: { reason, details: details.trim() } });
      setState('sent');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong. Please try again.');
      setState('idle');
    }
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={cn('inline-flex items-center gap-1.5 text-sm font-medium text-ink/60 hover:text-ink', className)}>
        <Flag className="h-4 w-4" />
        Report this listing
      </button>
    );
  }

  if (state === 'sent') {
    return (
      <p role="status" className={cn('rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-100', className)}>
        Thanks! Our team will take a look.
      </p>
    );
  }

  return (
    <form onSubmit={send} className={cn('card space-y-3 p-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">What’s wrong with this listing?</p>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-1 text-ink/60 hover:text-ink">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {REASONS.map((r) => (
          <button
            key={r.value}
            type="button"
            aria-pressed={reason === r.value}
            onClick={() => setReason(r.value)}
            className={cn('chip text-xs', reason === r.value && 'chip-active')}
          >
            {r.label}
          </button>
        ))}
      </div>
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        maxLength={1000}
        placeholder="Anything that helps us fix it (optional)"
        className="input min-h-[80px]"
      />
      {error && <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
      <button type="submit" className="btn-primary py-2 text-sm" disabled={state === 'sending'}>
        {state === 'sending' && <Loader2 className="h-4 w-4 animate-spin" />}
        Send report
      </button>
    </form>
  );
}
