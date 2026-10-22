'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MailCheck, Send } from 'lucide-react';
import { ApiClientError, apiFetch } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { FormNotice } from './AuthShell';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordForm({ initialEmail = '' }: { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!EMAIL.test(value)) {
      setFieldError('Add the email you signed up with.');
      document.getElementById('forgot-email')?.focus();
      return;
    }
    setFieldError(null);
    setError(null);
    setBusy(true);
    try {
      await apiFetch('/api/auth/forgot', { body: { email: value } });
      setSentTo(value);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (sentTo) {
    return (
      <div className="flex h-full flex-col items-start justify-center">
        <span className="inline-flex rounded-2xl bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200">
          <MailCheck className="h-7 w-7" aria-hidden="true" />
        </span>
        <h2 className="mt-4 font-sans text-2xl font-bold normal-case tracking-normal">Check your inbox</h2>
        <p className="mt-2 text-sm leading-6 text-ink/70" role="status">
          If there’s an account for <strong className="text-ink">{sentTo}</strong>, we’ve sent a link to choose a new password. It works
          for 1 hour. Can’t find it? Look in spam or promotions.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/login" className="btn-primary">
            Back to sign in
          </Link>
          <button type="button" onClick={() => setSentTo(null)} className="btn-secondary">
            Use another email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-sans text-2xl font-bold normal-case tracking-normal">Forgot your password?</h2>
      <p className="mt-1 text-sm text-ink/70">Happens to everyone. Tell us your email and we’ll send you a link to pick a new one.</p>
      {error && (
        <div className="mt-6">
          <FormNotice tone="error">{error}</FormNotice>
        </div>
      )}
      <form onSubmit={submit} noValidate className="mt-6 space-y-5">
        <div>
          <label htmlFor="forgot-email" className="label">
            Email
          </label>
          <input
            id="forgot-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn('input', fieldError && 'border-brand-500')}
            aria-invalid={Boolean(fieldError) || undefined}
            aria-describedby={fieldError ? 'forgot-email-error' : undefined}
          />
          {fieldError && (
            <p id="forgot-email-error" className="mt-1 text-xs font-medium text-brand-700 dark:text-brand-300">
              {fieldError}
            </p>
          )}
        </div>
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          <Send className="h-4 w-4" aria-hidden="true" />
          {busy ? 'Sending…' : 'Send me a reset link'}
        </button>
      </form>
      <p className="mt-6 text-sm text-ink/70">
        Remembered it?{' '}
        <Link href="/login" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
          Sign in
        </Link>
      </p>
    </div>
  );
}
