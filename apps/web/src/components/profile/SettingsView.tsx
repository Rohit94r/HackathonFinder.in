'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn, signOut } from 'next-auth/react';
import { Bell, Check, Eye, KeyRound, Link2, LogOut, Mail, Pencil, Trash2, type LucideIcon } from 'lucide-react';
import Avatar from '@/components/Avatar';
import PasswordField from '@/components/auth/PasswordField';
import { ProviderIcon, providerLabel, useOAuthProviders } from '@/components/auth/OAuthButtons';
import { passwordStrength } from '@/components/auth/authUtils';
import { ApiClientError, apiFetch } from '@/lib/apiClient';
import { useMe, type Me } from '@/lib/useMe';
import { cn } from '@/lib/cn';
import VerifyEmailBanner from './VerifyEmailBanner';

type Prefs = { reminders: boolean; digest: boolean; teamEmails: boolean };
// GET /api/me also returns email preferences (server/me.ts).
type MeWithPrefs = Me & { prefs?: Prefs };

const OAUTH = ['google', 'github'];

function Section({ id, title, icon: Icon, children, tone }: { id: string; title: string; icon: LucideIcon; children: React.ReactNode; tone?: 'danger' }) {
  return (
    <section aria-labelledby={id} className={cn('card p-5 sm:p-6', tone === 'danger' && 'border-brand-300 dark:border-brand-500/40')}>
      <h2 id={id} className="mb-4 flex items-center gap-2 font-sans text-lg font-bold normal-case tracking-normal">
        <Icon className={cn('h-5 w-5', tone === 'danger' && 'text-brand-700 dark:text-brand-300')} aria-hidden="true" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function Status({ tone, children }: { tone: 'ok' | 'error'; children: React.ReactNode }) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('text-sm font-medium', tone === 'ok' ? 'text-ink/80' : 'text-brand-700 dark:text-brand-300')}
    >
      {children}
    </p>
  );
}

function PasswordSection({ me, onChanged }: { me: Me; onChanged: () => void }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [result, setResult] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (!me.email) {
    return <p className="text-sm text-ink/70">Your account has no email address, so you sign in with Google or GitHub only.</p>;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found: typeof errors = {};
    if (me.hasPassword && !current) found.current = 'Enter your current password.';
    if (passwordStrength(next).score === 0) found.next = 'Use at least 8 characters, with a letter and a number.';
    else if (confirm !== next) found.confirm = 'The two passwords don’t match.';
    setErrors(found);
    setResult(null);
    const first = (['current', 'next', 'confirm'] as const).find((k) => found[k]);
    if (first) {
      document.getElementById(`pw-${first}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      await apiFetch('/api/me/password', { body: me.hasPassword ? { current, next } : { next } });
      // The change signs out every session, this one included; sign straight back in with the new password.
      if (me.email) await signIn('credentials', { email: me.email, password: next, redirect: false });
      setCurrent('');
      setNext('');
      setConfirm('');
      setResult({ tone: 'ok', text: me.hasPassword ? 'Password changed. We emailed you to let you know.' : 'Password set. You can now sign in with your email too.' });
      onChanged();
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) setErrors(err.fields);
      setResult({ tone: 'error', text: err instanceof ApiClientError ? err.message : 'Couldn’t change your password. Try again.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <p className="text-sm text-ink/70">
        {me.hasPassword
          ? 'Use at least 8 characters with a letter and a number. Longer is stronger.'
          : 'You sign in with Google or GitHub. Set a password to sign in with your email as well.'}
      </p>
      {me.hasPassword && (
        <PasswordField
          id="pw-current"
          label="Current password"
          value={current}
          onChange={setCurrent}
          autoComplete="current-password"
          error={errors.current}
          hint={
            <Link href={`/forgot-password?email=${encodeURIComponent(me.email)}`} className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
              Forgot it?
            </Link>
          }
        />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <PasswordField id="pw-next" label="New password" value={next} onChange={setNext} autoComplete="new-password" error={errors.next} showStrength />
        <PasswordField id="pw-confirm" label="Type it again" value={confirm} onChange={setConfirm} autoComplete="new-password" error={errors.confirm} />
      </div>
      {result && <Status tone={result.tone}>{result.text}</Status>}
      <button type="submit" disabled={busy} className="btn-primary px-5 py-2.5 text-sm">
        <KeyRound className="h-4 w-4" aria-hidden="true" />
        {busy ? 'Saving…' : me.hasPassword ? 'Change password' : 'Set a password'}
      </button>
    </form>
  );
}

function SignInMethods({ me }: { me: Me }) {
  const enabled = useOAuthProviders();
  const [busy, setBusy] = useState<string | null>(null);
  const rows = [
    { id: 'credentials', label: 'Email and password', on: me.hasPassword, available: Boolean(me.email) },
    ...OAUTH.map((id) => ({ id, label: providerLabel(id), on: me.providers.includes(id), available: Boolean(enabled?.some((p) => p.id === id)) })),
  ];

  return (
    <div>
      <ul className="divide-y divide-ink/10">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <span className="flex items-center gap-3 text-sm font-semibold text-ink">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-ink/5 text-ink/80">
                {row.id === 'credentials' ? <Mail className="h-4 w-4" aria-hidden="true" /> : <ProviderIcon id={row.id} />}
              </span>
              {row.label}
            </span>
            {row.on ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:text-brand-300">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                {row.id === 'credentials' ? 'On' : 'Connected'}
              </span>
            ) : row.id === 'credentials' ? (
              <a href="#password" className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300">
                Set a password
              </a>
            ) : row.available ? (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => {
                  setBusy(row.id);
                  void signIn(row.id, { callbackUrl: `/settings?connected=${row.id}` });
                }}
                className="btn-secondary px-3 py-1.5 text-xs"
              >
                <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                {busy === row.id ? 'Opening…' : `Connect ${row.label}`}
              </button>
            ) : (
              <span className="text-xs text-ink/60">Not available yet</span>
            )}
          </li>
        ))}
      </ul>
      {me.email && enabled?.length ? (
        <p className="mt-4 text-xs leading-5 text-ink/60">
          Connect the Google or GitHub account that uses <strong className="text-ink">{me.email}</strong>. One with a different email
          makes a separate HackathonFinder account.
        </p>
      ) : null}
    </div>
  );
}

const PREFS: { key: keyof Prefs; title: string; text: string }[] = [
  { key: 'reminders', title: 'Deadline reminders', text: 'An email a couple of days before a saved hackathon’s registration closes.' },
  { key: 'teamEmails', title: 'Team Finder emails', text: 'When someone asks to join your team, invites you, or answers your request.' },
  { key: 'digest', title: 'Weekly digest', text: 'The best open hackathons for your cities, every Monday.' },
];

function EmailPrefs({ me }: { me: MeWithPrefs }) {
  const { mutate } = useMe();
  const prefs: Prefs = me.prefs ?? { reminders: true, digest: true, teamEmails: true };
  const [error, setError] = useState<string | null>(null);

  const toggle = async (key: keyof Prefs) => {
    const value = !prefs[key];
    setError(null);
    // Optimistic: flip it now, then save; the server's answer replaces the cache.
    await mutate((data) => (data?.user ? { user: { ...data.user, prefs: { ...prefs, [key]: value } } as Me } : data), { revalidate: false });
    try {
      const res = await apiFetch<{ user: Me | null }>('/api/me', { method: 'PATCH', body: { prefs: { [key]: value } } });
      await mutate(res, { revalidate: false });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Couldn’t save that. Try again.');
      await mutate();
    }
  };

  return (
    <div>
      {!me.emailVerified && me.email && (
        <p className="mb-4 text-xs text-brand-700 dark:text-brand-300">Confirm your email first; we only send these to confirmed addresses.</p>
      )}
      <ul className="space-y-3">
        {PREFS.map((p) => (
          <li key={p.key}>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[p.key]}
              onClick={() => void toggle(p.key)}
              className="flex w-full items-center justify-between gap-4 rounded-lg border border-ink/15 px-4 py-3 text-left transition hover:border-ink/30"
            >
              <span>
                <span className="block text-sm font-semibold text-ink">{p.title}</span>
                <span className="block text-xs text-ink/60">{p.text}</span>
              </span>
              <span className={cn('relative inline-flex h-6 w-11 shrink-0 items-center rounded-[5px] transition', prefs[p.key] ? 'bg-accent' : 'bg-ink/20')} aria-hidden="true">
                <span className={cn('inline-block h-5 w-5 rounded-[3px] bg-white shadow transition', prefs[p.key] ? 'translate-x-[22px]' : 'translate-x-0.5')} />
              </span>
            </button>
          </li>
        ))}
      </ul>
      {error && (
        <div className="mt-3">
          <Status tone="error">{error}</Status>
        </div>
      )}
    </div>
  );
}

function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typed !== 'DELETE') return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch('/api/me', { method: 'DELETE', body: { confirm: 'DELETE' } });
      await signOut({ callbackUrl: '/login?deleted=1' });
    } catch (err) {
      setBusy(false);
      setError(err instanceof ApiClientError ? err.message : 'Couldn’t delete your account. Try again.');
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink/70">
        This removes your profile, record, tracker, cities and notifications, and signs you out for good. Your discussions, replies and
        stories stay up, shown as “Former student”. It can’t be undone.
      </p>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="btn-secondary border-brand-600 px-4 py-2 text-sm text-brand-700 hover:bg-brand-600 hover:text-white dark:text-brand-300">
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Delete my account
        </button>
      ) : (
        <form onSubmit={remove} className="space-y-3 rounded-lg border border-brand-200 bg-brand-50/60 p-4 dark:border-brand-500/30 dark:bg-brand-500/10">
          <label htmlFor="delete-confirm" className="label">
            Type <strong className="font-mono text-ink">DELETE</strong> to confirm
          </label>
          <input
            id="delete-confirm"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="input font-mono"
          />
          {error && <Status tone="error">{error}</Status>}
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary px-4 py-2 text-sm">
              Keep my account
            </button>
            <button type="submit" disabled={typed !== 'DELETE' || busy} className="btn-primary px-4 py-2 text-sm">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {busy ? 'Deleting…' : 'Delete forever'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/** Account settings for the signed-in student. */
export default function SettingsView({ connected }: { connected?: string | null }) {
  const { me, ready, refresh } = useMe();

  if (!ready || !me) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading your settings">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card h-40 animate-pulse bg-ink/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl">Settings</h1>
        <p className="mt-2 text-sm text-ink/70">Your account, sign-in and emails.</p>
      </div>

      {connected && me.providers.includes(connected) && (
        <Status tone="ok">{providerLabel(connected)} is connected. You can sign in with it from now on.</Status>
      )}

      <Section id="settings-profile" title="Profile" icon={Pencil}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={me.name} image={me.image} size="lg" className="ring-0" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{me.name}</p>
              <p className="truncate text-sm text-ink/60">@{me.handle}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/profile?edit=1" className="btn-secondary px-4 py-2 text-sm">
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit profile
            </Link>
            <Link href={`/u/${me.handle}`} className="btn-secondary px-4 py-2 text-sm">
              <Eye className="h-4 w-4" aria-hidden="true" />
              View public
            </Link>
          </div>
        </div>
      </Section>

      <Section id="settings-email" title="Email" icon={Mail}>
        {me.email ? (
          <div className="space-y-3">
            <p className="flex flex-wrap items-center gap-2 text-sm text-ink">
              <strong>{me.email}</strong>
              {me.emailVerified ? (
                <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:text-brand-300">Confirmed</span>
              ) : (
                <span className="rounded-md bg-ink/[0.07] px-2 py-0.5 text-xs font-semibold text-ink/70">Not confirmed</span>
              )}
            </p>
            {!me.emailVerified && <VerifyEmailBanner email={me.email} verified={false} linkResult={null} />}
            <p className="text-xs text-ink/60">Your email is never shown on your profile.</p>
          </div>
        ) : (
          <p className="text-sm text-ink/70">There’s no email on your account.</p>
        )}
      </Section>

      <div id="password" className="scroll-mt-24">
        <Section id="settings-password" title={me.hasPassword ? 'Change password' : 'Password'} icon={KeyRound}>
          <PasswordSection me={me} onChanged={() => void refresh()} />
        </Section>
      </div>

      <Section id="settings-methods" title="Sign-in methods" icon={Link2}>
        <SignInMethods me={me} />
      </Section>

      <Section id="settings-emails" title="Email preferences" icon={Bell}>
        <EmailPrefs me={me as MeWithPrefs} />
      </Section>

      <Section id="settings-signout" title="Sign out" icon={LogOut}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink/70">Sign out on this device. Your saved hackathons stay on your account.</p>
          <button type="button" onClick={() => void signOut({ callbackUrl: '/' })} className="btn-secondary shrink-0 px-4 py-2 text-sm">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </Section>

      <Section id="settings-delete" title="Delete account" icon={Trash2} tone="danger">
        <DeleteAccount />
      </Section>
    </div>
  );
}
