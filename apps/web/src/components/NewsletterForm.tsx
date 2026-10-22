'use client';

import { useState } from 'react';
import { CheckCircle2, Mail } from 'lucide-react';
import { apiFetch, ApiClientError } from '@/lib/apiClient';
import { useFollowedCities } from '@/lib/useFollowedCities';

export default function NewsletterForm({ dark = true }: { dark?: boolean }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'confirm' | 'subscribed'>('idle');
  const [error, setError] = useState('');
  // The digest leads with the student's shortlisted cities.
  const { cities } = useFollowedCities();

  if (state === 'confirm' || state === 'subscribed') {
    return (
      <p role="status" className={`flex items-center gap-2 text-sm font-medium ${dark ? 'text-lime' : 'text-ink'}`}>
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        {state === 'confirm' ? 'Almost there: check your inbox and confirm your email.' : 'You’re already subscribed. See you on Monday!'}
      </p>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setState('sending');
    try {
      const res = await apiFetch<{ status: 'confirm' | 'subscribed' }>('/api/digest', { body: { email, cities } });
      setState(res.status);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.fields?.email ?? err.message : 'Something went wrong. Please try again.');
      setState('idle');
    }
  };

  return (
    <form onSubmit={submit} className="flex w-full max-w-md flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <div className="relative flex-1">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
          <input
            id="newsletter-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@college.edu"
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? 'newsletter-error' : undefined}
            className="input pl-11"
          />
        </div>
        <button type="submit" disabled={state === 'sending'} className={dark ? 'btn-lime' : 'btn-primary'}>
          {state === 'sending' ? 'Sending…' : 'Get the weekly digest'}
        </button>
      </div>
      {error && (
        <p id="newsletter-error" className="text-xs font-medium text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </form>
  );
}
