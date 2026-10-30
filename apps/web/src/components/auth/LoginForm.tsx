'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { ArrowRight, LogIn } from 'lucide-react';
import { authErrorMessage, withNext } from './authUtils';
import { FormNotice } from './AuthShell';
import OAuthButtons from './OAuthButtons';
import PasswordField from './PasswordField';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginForm({
  next,
  error: initialError,
  notice,
}: {
  next: string | null;
  /** next-auth's ?error= code, e.g. after a failed Google sign-in. */
  error?: string | null;
  notice?: 'deleted' | 'reset' | 'details-limit' | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(authErrorMessage(initialError));
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const target = next ?? '/profile';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found: typeof fieldErrors = {};
    if (!EMAIL.test(email.trim())) found.email = 'Add the email you signed up with.';
    if (!password) found.password = 'Add your password.';
    setFieldErrors(found);
    if (found.email || found.password) {
      document.getElementById(found.email ? 'login-email' : 'login-password')?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await signIn('credentials', { redirect: false, email: email.trim(), password });
      if (!res || res.error) {
        setError(authErrorMessage(res?.error ?? 'Default'));
        setBusy(false);
        return;
      }
      router.replace(target);
      router.refresh();
    } catch {
      setError('You seem to be offline. Check your connection and try again.');
      setBusy(false);
    }
  };

  return (
    <div>
      <h2 className="font-sans text-2xl font-bold normal-case tracking-normal">Sign in</h2>
      <p className="mt-1 text-sm text-ink/70">
        New here?{' '}
        <Link href={withNext('/signup', next)} className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
          Create a free account
        </Link>
      </p>

      <div className="mt-6 space-y-4">
        {notice === 'deleted' && (
          <FormNotice tone="info">Your account is deleted. Thanks for being part of HackathonFinder. You can make a new one any time.</FormNotice>
        )}
        {notice === 'reset' && <FormNotice tone="success">Your password is changed. Sign in with the new one.</FormNotice>}
        {notice === 'details-limit' && <FormNotice tone="info">You’ve explored five hackathon pages. Sign in or create a free account to keep browsing.</FormNotice>}
        {error && <FormNotice tone="error">{error}</FormNotice>}
      </div>

      <div className="mt-6">
        <OAuthButtons callbackUrl={target} />
      </div>

      <form onSubmit={submit} noValidate className="space-y-5">
        <div>
          <label htmlFor="login-email" className="label">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            aria-invalid={Boolean(fieldErrors.email) || undefined}
            aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
          />
          {fieldErrors.email && (
            <p id="login-email-error" className="mt-1 text-xs font-medium text-brand-700 dark:text-brand-300">
              {fieldErrors.email}
            </p>
          )}
        </div>
        <PasswordField
          id="login-password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          error={fieldErrors.password}
          hint={
            <Link
              href={email ? `/forgot-password?email=${encodeURIComponent(email.trim())}` : '/forgot-password'}
              className="font-semibold text-brand-700 hover:underline dark:text-brand-300"
            >
              Forgot password?
            </Link>
          }
        />
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          <LogIn className="h-4 w-4" aria-hidden="true" />
          {busy ? 'Signing you in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 flex items-center gap-1.5 text-xs text-ink/60">
        Just browsing? You don’t need an account to find hackathons.
        <Link href="/near-me" className="inline-flex items-center gap-0.5 font-semibold text-ink hover:underline">
          Near me <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </p>
    </div>
  );
}
