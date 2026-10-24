'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { KeyRound, LinkIcon } from 'lucide-react';
import { ApiClientError, apiFetch } from '@/lib/apiClient';
import { passwordStrength } from './authUtils';
import { FormNotice } from './AuthShell';
import PasswordField from './PasswordField';

export default function ResetPasswordForm({ token }: { token: string | null }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!token || expired) {
    return (
      <div className="flex h-full flex-col items-start justify-center">
        <span className="inline-flex rounded-2xl bg-accent/10 p-3 text-accent">
          <LinkIcon className="h-7 w-7" aria-hidden="true" />
        </span>
        <h2 className="mt-4 font-sans text-2xl font-bold normal-case tracking-normal">
          {expired ? 'This link has expired' : 'This link is incomplete'}
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink/70">
          {expired
            ? 'Reset links work once, for 1 hour. Ask for a new one and use the newest email.'
            : 'Open the link from the email exactly as it is, or ask for a new one.'}
        </p>
        <Link href="/forgot-password" className="btn-primary mt-6">
          Send me a new link
        </Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found: typeof errors = {};
    if (passwordStrength(password).score === 0) found.password = 'Use at least 8 characters, with a letter and a number.';
    if (!found.password && confirm !== password) found.confirm = 'The two passwords don’t match.';
    setErrors(found);
    if (found.password || found.confirm) {
      document.getElementById(found.password ? 'reset-password' : 'reset-confirm')?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    let email: string | undefined;
    try {
      ({ email } = await apiFetch<{ ok: boolean; email?: string }>('/api/auth/reset', { body: { token, password } }));
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiClientError && err.status === 400 && !err.fields) {
        setExpired(true);
        return;
      }
      if (err instanceof ApiClientError && err.fields?.password) setErrors({ password: err.fields.password });
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong. Please try again.');
      return;
    }
    // Sign straight in with the new password; if that fails, the login page says it's changed.
    const res = email ? await signIn('credentials', { redirect: false, email, password }) : null;
    if (!res || res.error) {
      router.replace('/login?reset=1');
      return;
    }
    router.replace('/profile');
    router.refresh();
  };

  return (
    <div>
      <h2 className="font-sans text-2xl font-bold normal-case tracking-normal">Choose a new password</h2>
      <p className="mt-1 text-sm text-ink/70">You’ll be signed in right after.</p>
      {error && (
        <div className="mt-6">
          <FormNotice tone="error">{error}</FormNotice>
        </div>
      )}
      <form onSubmit={submit} noValidate className="mt-6 space-y-5">
        <PasswordField
          id="reset-password"
          label="New password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          error={errors.password}
          showStrength
        />
        <PasswordField
          id="reset-confirm"
          label="Type it again"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          error={errors.confirm}
        />
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          <KeyRound className="h-4 w-4" aria-hidden="true" />
          {busy ? 'Saving…' : 'Save my new password'}
        </button>
      </form>
    </div>
  );
}
