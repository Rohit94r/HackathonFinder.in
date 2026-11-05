'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { UserPlus } from 'lucide-react';
import { ApiClientError, apiFetch } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { passwordStrength, withNext } from './authUtils';
import { FormNotice } from './AuthShell';
import OAuthButtons from './OAuthButtons';
import PasswordField from './PasswordField';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Field = 'name' | 'email' | 'password';

export default function SignupForm({ next }: { next: string | null }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [error, setError] = useState<React.ReactNode>(null);
  const [busy, setBusy] = useState(false);
  // After sign-up: onboarding first, then back to where they came from.
  const welcome = withNext('/profile?welcome=1', next);

  const set = (key: Field, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const found: Partial<Record<Field, string>> = {};
    if (form.name.trim().length < 2) found.name = 'Add your name.';
    if (!EMAIL.test(form.email.trim())) found.email = 'Add a valid email.';
    if (passwordStrength(form.password).score === 0) found.password = 'Use at least 8 characters, with a letter and a number.';
    return found;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    const first = (['name', 'email', 'password'] as Field[]).find((k) => found[k]);
    if (first) {
      document.getElementById(`signup-${first}`)?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    const email = form.email.trim().toLowerCase();
    try {
      await apiFetch('/api/auth/register', { body: { name: form.name.trim(), email, password: form.password } });
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiClientError) {
        if (err.status === 409) {
          setError(
            <>
              {err.message}{' '}
              <Link href={withNext('/login', next)} className="font-semibold underline">
                Sign in
              </Link>
            </>
          );
          return;
        }
        if (err.fields) setErrors(err.fields as Partial<Record<Field, string>>);
        setError(err.message);
      } else setError('Something went wrong. Please try again.');
      return;
    }
    const res = await signIn('credentials', { redirect: false, email, password: form.password });
    if (!res || res.error) {
      // The account exists; signing in separately still works.
      router.replace(withNext('/login', welcome));
      return;
    }
    router.replace(welcome);
    router.refresh();
  };

  const fieldProps = (key: Field) => ({
    'aria-invalid': Boolean(errors[key]) || undefined,
    'aria-describedby': errors[key] ? `signup-${key}-error` : undefined,
  });
  const fieldError = (key: Field) =>
    errors[key] && (
      <p id={`signup-${key}-error`} className="mt-1 text-xs font-medium text-brand-700 dark:text-brand-300">
        {errors[key]}
      </p>
    );

  return (
    <div>
      <h2 className="font-sans text-2xl font-bold normal-case tracking-normal">Create your account</h2>
      <p className="mt-1 text-sm text-ink/70">
        Already have one?{' '}
        <Link href={withNext('/login', next)} className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
          Sign in
        </Link>
      </p>

      {error && (
        <div className="mt-6">
          <FormNotice tone="error">{error}</FormNotice>
        </div>
      )}

      <div className="mt-6">
        <OAuthButtons callbackUrl={welcome} verb="Sign up" />
      </div>

      <form onSubmit={submit} noValidate className="space-y-5">
        <div>
          <label htmlFor="signup-name" className="label">
            Your name
          </label>
          <input
            id="signup-name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            autoComplete="name"
            maxLength={80}
            placeholder="e.g. Ananya Sharma…"
            className={cn('input', errors.name && 'border-brand-500')}
            {...fieldProps('name')}
          />
          {fieldError('name')}
        </div>
        <div>
          <label htmlFor="signup-email" className="label">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            spellCheck={false}
            inputMode="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="you@college.edu"
            className={cn('input', errors.email && 'border-brand-500')}
            {...fieldProps('email')}
          />
          {fieldError('email')}
          {!errors.email && <p className="mt-1 text-xs text-ink/60">We’ll send deadline reminders and team requests here. No spam.</p>}
        </div>
        <PasswordField
          id="signup-password"
          label="Password"
          value={form.password}
          onChange={(v) => set('password', v)}
          autoComplete="new-password"
          error={errors.password}
          showStrength
        />
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          {busy ? 'Creating your account…' : 'Create my account'}
        </button>
        <p className="text-center text-xs leading-5 text-ink/60">
          By signing up you agree to our{' '}
          <Link href="/terms" className="underline hover:text-ink">
            terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-ink">
            privacy policy
          </Link>
          .
        </p>
      </form>
    </div>
  );
}
