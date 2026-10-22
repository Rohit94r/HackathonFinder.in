'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import { apiFetch, ApiClientError } from '@/lib/apiClient';

const REASONS = [
  { value: 'wrong-details', label: 'Wrong dates or details' },
  { value: 'expired', label: 'Event is over or cancelled' },
  { value: 'broken-link', label: 'Registration link doesn’t work' },
  { value: 'duplicate', label: 'Listed twice' },
  { value: 'scam', label: 'Looks like a scam or asks for money' },
  { value: 'other', label: 'Something else' },
];

/** "Report this listing": sends a flag to the admin review queue. */
export default function ReportListing({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('wrong-details');
  const [details, setDetails] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  if (state === 'sent') {
    return <p className="mt-3 text-xs font-medium text-ink/70">Thanks. We’ll check this listing soon.</p>;
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-ink/60 hover:text-ink hover:underline">
        <Flag className="h-3.5 w-3.5" />
        Report this listing
      </button>
    );
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('sending');
    setError('');
    try {
      await apiFetch(`/api/hackathons/${slug}/report`, { body: { reason, details } });
      setState('sent');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Couldn’t send that. Please try again.');
      setState('idle');
    }
  };

  return (
    <form onSubmit={send} className="mt-3 space-y-2">
      <label htmlFor="report-reason" className="label text-xs">
        What’s wrong?
      </label>
      <select id="report-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="input py-2 text-sm">
        {REASONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <label htmlFor="report-details" className="sr-only">
        Details (optional)
      </label>
      <textarea
        id="report-details"
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        maxLength={1000}
        placeholder="Details (optional)"
        className="input min-h-[70px] text-sm"
      />
      {error && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={state === 'sending'} className="btn-secondary px-3 py-1.5 text-xs">
          {state === 'sending' ? 'Sending…' : 'Send report'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-2 text-xs font-medium text-ink/60 hover:underline">
          Cancel
        </button>
      </div>
    </form>
  );
}
