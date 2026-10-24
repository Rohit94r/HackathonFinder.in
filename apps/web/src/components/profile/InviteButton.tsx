'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Check, Send, UserPlus } from 'lucide-react';
import { ApiClientError, apiFetch, goToLogin } from '@/lib/apiClient';
import { cn } from '@/lib/cn';

const MAX = 500;

/** "Invite to my team": a short note, sent through Team Finder (POST /api/invites). */
export default function InviteButton({
  handle,
  name,
  className,
  secondary = false,
}: {
  handle: string;
  name: string;
  className?: string;
  /** Outline style, when another button (like Message) is the main action. */
  secondary?: boolean;
}) {
  const { status } = useSession();
  const firstName = name.split(' ')[0];
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(`Hi ${firstName}! I’m putting a team together and I think you’d be a great fit. Want to team up?`);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'already'>('idle');
  const [error, setError] = useState<string | null>(null);

  const start = () => {
    if (status !== 'authenticated') return goToLogin();
    setOpen(true);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('sending');
    setError(null);
    try {
      await apiFetch('/api/invites', { body: { toHandle: handle, message: message.trim() } });
      setState('sent');
      setOpen(false);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) return goToLogin();
      if (err instanceof ApiClientError && err.status === 409) {
        setState('already');
        setError(err.message);
        setOpen(false);
        return;
      }
      setState('idle');
      setError(err instanceof ApiClientError ? err.message : 'Couldn’t send your invite. Try again.');
    }
  };

  if (state === 'sent' || state === 'already') {
    return (
      <div className={className}>
        <p className="flex items-center justify-center gap-2 rounded-full bg-accent/10 px-4 py-3 text-sm font-semibold text-brand-700 dark:text-brand-300">
          <Check className="h-4 w-4" aria-hidden="true" />
          {state === 'sent' ? `Invite sent to ${firstName}` : 'Already invited'}
        </p>
        <p className="mt-2 text-xs text-ink/60" role="status">
          {state === 'sent' ? `We’ll let you know when ${firstName} answers. ` : `${error ?? ''} `}
          <Link href="/teams" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
            See your invites
          </Link>
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <div className={className}>
        <button type="button" onClick={start} className={cn(secondary ? 'btn-secondary' : 'btn-primary', 'w-full')}>
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Invite to my team
        </button>
        {error && (
          <p role="alert" className="mt-2 text-xs font-medium text-brand-700 dark:text-brand-300">
            {error}
          </p>
        )}
        {status === 'unauthenticated' && <p className="mt-2 text-xs text-ink/60">Sign in to send {firstName} an invite.</p>}
      </div>
    );
  }

  return (
    <form onSubmit={send} className={cn('space-y-3', className)}>
      <label htmlFor={`invite-${handle}`} className="label">
        A note for {firstName}
      </label>
      <textarea
        id={`invite-${handle}`}
        value={message}
        onChange={(e) => setMessage(e.target.value.slice(0, MAX))}
        maxLength={MAX}
        className="input min-h-[96px] text-sm"
        aria-describedby={`invite-${handle}-count`}
      />
      <p id={`invite-${handle}-count`} className="-mt-2 text-right text-xs text-ink/50">
        {message.length}/{MAX}
      </p>
      {error && (
        <p role="alert" className="text-xs font-medium text-brand-700 dark:text-brand-300">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1 px-3 py-2 text-sm">
          Cancel
        </button>
        <button type="submit" disabled={state === 'sending'} className="btn-primary flex-1 px-3 py-2 text-sm">
          <Send className="h-4 w-4" aria-hidden="true" />
          {state === 'sending' ? 'Sending…' : 'Send invite'}
        </button>
      </div>
    </form>
  );
}
