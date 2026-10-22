'use client';

import { useCallback, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { apiFetch } from './apiClient';
import { readStore, useStore, writeStore } from './localStore';

const KEY = 'hf_cities_v1';
const API = '/api/me/cities';

/**
 * Cities a student follows (their shortlist): on the account when signed in, in this
 * browser otherwise. Cities followed while signed out move to the account on sign-in.
 */
export function useFollowedCities() {
  const { status } = useSession();
  const signedIn = status === 'authenticated';
  const [local, setLocal, localReady] = useStore<string[]>(KEY, []);
  const { data, mutate } = useSWR<{ cities: string[] }>(signedIn ? API : null);
  const imported = useRef(false);

  useEffect(() => {
    if (!signedIn || imported.current) return;
    const pending = readStore<string[]>(KEY, []);
    if (!pending.length) return;
    imported.current = true;
    apiFetch<{ cities: string[] }>(API, { method: 'PUT', body: { import: pending } })
      .then((res) => {
        writeStore(KEY, []);
        return mutate(res, { revalidate: false });
      })
      .catch(() => {
        imported.current = false;
      });
  }, [signedIn, mutate]);

  const cities = signedIn ? data?.cities ?? [] : local;
  const ready = status !== 'loading' && (signedIn ? data !== undefined : localReady);

  const toggle = useCallback(
    async (slug: string) => {
      if (!signedIn) {
        setLocal((prev) => (prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]));
        return;
      }
      const following = cities.includes(slug);
      await mutate({ cities: following ? cities.filter((c) => c !== slug) : [...cities, slug] }, { revalidate: false });
      try {
        const res = await apiFetch<{ cities: string[] }>(API, { method: 'PUT', body: following ? { unfollow: slug } : { follow: slug } });
        await mutate(res, { revalidate: false });
      } catch {
        await mutate();
      }
    },
    [signedIn, cities, mutate, setLocal]
  );

  return { cities, ready, signedIn, toggle, isFollowing: (slug: string) => cities.includes(slug) };
}
