'use client';

import { useCallback, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ApiClientError, apiFetch, goToLogin } from '@/lib/apiClient';
import type { Viewer } from './model';

/** The signed-in student from the session, or null. `ready` is false while the session loads. */
export function useViewer(): { viewer: Viewer | null; ready: boolean } {
  const { data, status } = useSession();
  const user = status === 'authenticated' ? data?.user : null;
  return {
    viewer: user?.id ? { id: user.id, handle: user.handle, role: user.role } : null,
    ready: status !== 'loading',
  };
}

export function errorMessage(err: unknown): string {
  return err instanceof ApiClientError ? err.message : 'Something went wrong. Please try again.';
}

type Count = { votes: number; voted: boolean };

/**
 * Upvotes with an instant response: the count changes on click and settles on what the
 * server says. Signed-out clicks go to sign in.
 */
export function useVotes() {
  const { status } = useSession();
  const [overrides, setOverrides] = useState<Record<string, Count>>({});
  const [error, setError] = useState('');

  const view = useCallback(
    (targetType: 'thread' | 'reply', item: { id: string } & Count): Count => overrides[`${targetType}:${item.id}`] ?? item,
    [overrides]
  );

  const toggle = useCallback(
    async (targetType: 'thread' | 'reply', item: { id: string } & Count) => {
      if (status === 'loading') return;
      if (status !== 'authenticated') {
        goToLogin();
        return;
      }
      const key = `${targetType}:${item.id}`;
      const current = overrides[key] ?? { votes: item.votes, voted: item.voted };
      setError('');
      setOverrides((o) => ({ ...o, [key]: { votes: Math.max(0, current.votes + (current.voted ? -1 : 1)), voted: !current.voted } }));
      try {
        const res = await apiFetch<Count>('/api/votes', { body: { targetType, targetId: item.id } });
        setOverrides((o) => ({ ...o, [key]: res }));
      } catch (err) {
        setOverrides((o) => ({ ...o, [key]: current }));
        if (err instanceof ApiClientError && err.status === 401) goToLogin();
        else setError(errorMessage(err));
      }
    },
    [overrides, status]
  );

  return { view, toggle, error };
}
