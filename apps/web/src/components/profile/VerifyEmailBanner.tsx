'use client';

import { useState } from 'react';
import { CheckCircle2, MailWarning, X } from 'lucide-react';
import { ApiClientError, apiFetch } from '@/lib/apiClient';

/**
 * "Confirm your email" with a resend button, plus the result of clicking the emailed
 * link (?verified=1 or ?verified=expired).
 */
export default function VerifyEmailBanner({
  email,
  verified,
  linkResult,
}: {
  email: string;
  verified: boolean;
  linkResult: 'ok' | 'expired' | null;
}) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (verified) {
    if (linkResult !== 'ok' || dismissed) return null;
    return (
      <div role="status" className="flex items-start gap-3 rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-100">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="flex-1">
          <strong>Email confirmed.</strong> You’ll now get deadline reminders and team requests at {email}.
        </p>
        <button type="button" onClick={() => setDismissed(true)} className="rounded-lg p-1 hover:bg-emerald-100 dark:hover:bg-emerald-400/10" aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }
  if (!email) return null;

  const resend = async () => {
    setBusy(true);
    setError(null);
    try {
      await apiFetch('/api/auth/verify', { method: 'POST' });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Couldn’t send it. Try again in a minute.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-100">
      <MailWarning className="hidden h-5 w-5 shrink-0 sm:block" aria-hidden="true" />
      <p className="flex-1" aria-live="polite">
        {sent ? (
          <>
            <strong>Sent.</strong> Check your inbox at {email} (and spam). The link works for 3 days.
          </>
        ) : linkResult === 'expired' ? (
          <>
            <strong>That link has expired or was already used.</strong> Send yourself a new one to confirm {email}.
          </>
        ) : (
          <>
            <strong>Confirm your email</strong> so we can send deadline reminders and team requests to {email}.
          </>
        )}
        {error && <span className="mt-1 block font-medium">{error}</span>}
      </p>
      {!sent && (
        <button type="button" onClick={() => void resend()} disabled={busy} className="btn-secondary shrink-0 px-4 py-2 text-sm">
          {busy ? 'Sending…' : 'Resend the link'}
        </button>
      )}
    </div>
  );
}
