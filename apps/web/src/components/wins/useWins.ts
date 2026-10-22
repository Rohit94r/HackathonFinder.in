'use client';

import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import type { WinList } from './model';

/**
 * The signed-in student's own stories, newest first, from /api/wins?author=<handle>.
 * Empty (and ready) when signed out.
 */
export function useMyWins() {
  const { data: session, status } = useSession();
  const handle = status === 'authenticated' ? session?.user?.handle : undefined;
  const { data, error, mutate } = useSWR<WinList>(handle ? `/api/wins?author=${encodeURIComponent(handle)}&limit=50` : null);
  return {
    stories: data?.items ?? [],
    now: data?.now ?? '',
    ready: status === 'unauthenticated' || (status === 'authenticated' && !handle) || Boolean(data || error),
    mutate,
  };
}
