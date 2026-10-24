'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { PartyPopper } from 'lucide-react';
import { ApiClientError, apiFetch, goToLogin } from '@/lib/apiClient';
import { cn } from '@/lib/cn';

interface CheerButtonProps {
  /** The story's slug. */
  slug: string;
  cheers: number;
  /** Whether the signed-in student already cheered. */
  cheered: boolean;
  title: string;
  size?: 'sm' | 'lg';
  className?: string;
}

/** Cheer for a story, or take it back. The count moves on click and settles on the server's number. */
export default function CheerButton({ slug, cheers, cheered, title, size = 'sm', className }: CheerButtonProps) {
  const { status } = useSession();
  const [state, setState] = useState({ cheers, cheered });
  const [busy, setBusy] = useState(false);

  // A fresh list (new filters, a refresh) brings new numbers.
  useEffect(() => setState({ cheers, cheered }), [cheers, cheered]);

  const toggle = async () => {
    if (status === 'loading' || busy) return;
    if (status !== 'authenticated') {
      goToLogin();
      return;
    }
    const before = state;
    setBusy(true);
    setState({ cheers: Math.max(0, before.cheers + (before.cheered ? -1 : 1)), cheered: !before.cheered });
    try {
      setState(await apiFetch<{ cheers: number; cheered: boolean }>(`/api/wins/${slug}/cheer`, { method: 'POST' }));
    } catch (err) {
      setState(before);
      if (err instanceof ApiClientError && err.status === 401) goToLogin();
    } finally {
      setBusy(false);
    }
  };

  const { cheers: count, cheered: on } = state;
  return (
    <button
      type="button"
      onClick={(e) => {
        // Cards are links; keep the click on the button.
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      aria-pressed={on}
      aria-label={`${on ? 'Remove your cheer for' : 'Cheer for'} ${title}, ${count} ${count === 1 ? 'cheer' : 'cheers'}`}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold transition',
        size === 'lg' ? 'px-4 py-2 text-sm' : 'px-2.5 py-1 text-xs',
        on
          ? 'border-accent bg-accent text-white hover:border-brand-700 hover:bg-brand-700'
          : 'border-ink/20 bg-card text-ink hover:border-accent hover:text-accent',
        className
      )}
    >
      <PartyPopper className={size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'} aria-hidden="true" />
      {size === 'lg' ? `${on ? 'Cheered' : 'Cheer'} · ${count}` : count}
    </button>
  );
}
