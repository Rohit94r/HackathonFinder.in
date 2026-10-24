'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signOut } from 'next-auth/react';
import { LogIn } from 'lucide-react';
import { Button, ErrorBox, inputClass, labelClass, Notice } from './ui';

const NOT_ADMIN = 'This account isn’t an admin.';

function errorText(code: string | null | undefined): string {
  if (!code) return '';
  if (code === 'CredentialsSignin') return 'That email and password don’t match.';
  if (code === 'AccountBanned') return 'This account is suspended.';
  if (code === 'AccessDenied') return 'That account can’t sign in.';
  return 'Signing in didn’t work. Please try again.';
}

/**
 * The admin sign-in form. Anyone can sign in here, but only admins get past it:
 * any other account is signed straight back out with "This account isn't an admin".
 */
export default function AdminLogin({
  next,
  denied,
  autoSignOut,
  providers,
  error: initialError,
}: {
  next: string;
  /** Signed in already, with an account that isn't an admin. */
  denied: boolean;
  /** Just came back from Google/GitHub with a non-admin account: sign it out now. */
  autoSignOut: boolean;
  providers: { google: boolean; github: boolean };
  error: string | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(autoSignOut ? NOT_ADMIN : errorText(initialError));
  const [signedInOther, setSignedInOther] = useState(denied && !autoSignOut);

  useEffect(() => {
    if (autoSignOut) void signOut({ redirect: false }).then(() => router.refresh());
  }, [autoSignOut, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Add your email and password.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await signIn('credentials', { redirect: false, email: email.trim(), password });
      if (!res || res.error) {
        setError(errorText(res?.error ?? 'Default'));
        setBusy(false);
        return;
      }
      // Signed in: now make sure it's an admin account before going in.
      const check = await fetch('/api/admin/me', { credentials: 'same-origin', cache: 'no-store' });
      if (check.ok) {
        router.replace(next);
        router.refresh();
        return;
      }
      await signOut({ redirect: false });
      setPassword('');
      setError(`${NOT_ADMIN} If you were just made an admin, wait a moment and sign in again.`);
      setBusy(false);
    } catch {
      setError('You seem to be offline. Check your connection and try again.');
      setBusy(false);
    }
  };

  const oauth = (id: 'google' | 'github') => {
    setBusy(true);
    void signIn(id, { callbackUrl: `/admin/login?via=oauth&next=${encodeURIComponent(next)}` });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="text-sm font-semibold">HackathonFinder</p>
        <h1 className="mt-1 text-2xl font-semibold">Admin sign in</h1>
        <p className="mt-1 text-sm text-neutral-500">For the HackathonFinder team only.</p>

        <div className="mt-6 space-y-3">
          {error && <ErrorBox>{error}</ErrorBox>}
          {signedInOther && (
            <Notice>
              <p>{NOT_ADMIN} You’re signed in with a student account.</p>
              <button
                type="button"
                className="mt-2 font-medium underline underline-offset-2"
                onClick={async () => {
                  await signOut({ redirect: false });
                  setSignedInOther(false);
                  router.refresh();
                }}
              >
                Sign out and use an admin account
              </button>
            </Notice>
          )}
        </div>

        <form onSubmit={submit} noValidate className="mt-6 space-y-4">
          <div>
            <label htmlFor="admin-email" className={labelClass}>
              Email
            </label>
            <input id="admin-email" type="email" inputMode="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="admin-password" className={labelClass}>
              Password
            </label>
            <input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
          </div>
          <Button type="submit" variant="primary" className="w-full" busy={busy} icon={LogIn}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        {(providers.google || providers.github) && (
          <div className="mt-6 space-y-2 border-t border-neutral-200 pt-6">
            {providers.google && (
              <Button className="w-full" disabled={busy} onClick={() => oauth('google')}>
                Continue with Google
              </Button>
            )}
            {providers.github && (
              <Button className="w-full" disabled={busy} onClick={() => oauth('github')}>
                Continue with GitHub
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
