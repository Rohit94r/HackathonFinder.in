'use client';

import useSWR from 'swr';
import { useSession } from 'next-auth/react';

/** The signed-in student's account as returned by GET /api/me (see server/me.ts). */
export interface Me {
  id: string;
  handle: string;
  name: string;
  image?: string;
  about: string;
  college: string;
  city: string;
  skills: string[];
  bio: string;
  github: string;
  linkedin: string;
  lookingForTeam: boolean;
  role: 'student' | 'organizer' | 'admin';
  isSample: boolean;
  joinedAt: string;
  email: string;
  emailVerified: boolean;
  onboarded: boolean;
  followedCities: string[];
  record: { id: string; event: string; hackathonSlug?: string; result: 'winner' | 'runner-up' | 'finalist' | 'participant'; project: string; date: string }[];
  hasPassword: boolean;
  providers: string[];
}

/**
 * Who's signed in. `ready` turns true once we know; `me` is null when signed out.
 * Call `refresh()` after changing the account so every component updates.
 */
export function useMe() {
  const { status, update } = useSession();
  const signedIn = status === 'authenticated';
  const { data, mutate, isLoading } = useSWR<{ user: Me | null }>(signedIn ? '/api/me' : null);
  const me = signedIn ? data?.user ?? null : null;
  const ready = status === 'unauthenticated' || (signedIn && !isLoading && data !== undefined);

  const refresh = async () => {
    await mutate();
    // Refreshes the session's name, handle and picture too.
    await update();
  };

  return { me, ready, signedIn, status, refresh, mutate };
}
