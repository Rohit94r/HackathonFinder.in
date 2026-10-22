'use client';

import { useCallback, useMemo } from 'react';
import { apiFetch, goToLogin } from './apiClient';
import { useMe } from './useMe';

/** The profile fields students edit. Stored on their account. */
export interface MyProfile {
  name: string;
  /** URL-safe name, shown as @handle. */
  handle: string;
  /** e.g. "2nd year, Information Technology" */
  about: string;
  college: string;
  /** City slug from CITIES. */
  city: string;
  skills: string[];
  bio: string;
  github: string;
  linkedin: string;
  lookingForTeam: boolean;
}

export function toHandle(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30) || 'student'
  );
}

/**
 * The signed-in student's profile. `profile` is null when signed out; `save` sends
 * signed-out students to sign in first.
 */
export function useProfile() {
  const { me, ready, signedIn, refresh } = useMe();

  const profile = useMemo<MyProfile | null>(
    () =>
      me
        ? {
            name: me.name,
            handle: me.handle,
            about: me.about,
            college: me.college,
            city: me.city,
            skills: me.skills,
            bio: me.bio,
            github: me.github,
            linkedin: me.linkedin,
            lookingForTeam: me.lookingForTeam,
          }
        : null,
    [me]
  );

  const save = useCallback(
    async (next: Partial<MyProfile> & { onboarded?: boolean }) => {
      if (!signedIn) {
        goToLogin();
        return;
      }
      const body = { ...next, handle: next.handle ? toHandle(next.handle) : undefined };
      await apiFetch('/api/me', { method: 'PATCH', body });
      await refresh();
    },
    [signedIn, refresh]
  );

  // Profiles live on the account now; signing out is how you leave it.
  const clear = useCallback(() => {}, []);

  return { profile, ready, signedIn, me, save, clear };
}
