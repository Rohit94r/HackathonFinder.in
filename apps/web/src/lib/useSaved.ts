'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { logActivity } from './activity';
import { apiFetch } from './apiClient';

export type TrackStatus = 'saved' | 'registered' | 'submitted' | 'done';

export const TRACK_LABELS: Record<TrackStatus, string> = {
  saved: 'Saved',
  registered: 'Registered',
  submitted: 'Submitted',
  done: 'Done',
};

// Signed-out students keep their list in this browser; it moves to their account when they sign in.
const KEY = 'hf_saved_v1';
const EVENT = 'hf-saved-change';
const API = '/api/me/saved';

type SavedMap = Record<string, TrackStatus>;

function read(): SavedMap {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedMap) : {};
  } catch {
    return {};
  }
}

function write(map: SavedMap) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // Storage can be unavailable (private mode); the list just won't persist.
  }
  window.dispatchEvent(new Event(EVENT));
}

type ServerList = { items: { slug: string; status: TrackStatus }[] };

/** "My hackathons": the account's tracker when signed in, this browser's list otherwise. */
export function useSaved() {
  const { status: sessionStatus } = useSession();
  const signedIn = sessionStatus === 'authenticated';
  const [local, setLocal] = useState<SavedMap>({});
  const [localReady, setLocalReady] = useState(false);
  const { data, mutate } = useSWR<ServerList>(signedIn ? API : null);
  const imported = useRef(false);

  useEffect(() => {
    const sync = () => setLocal(read());
    sync();
    setLocalReady(true);
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  // After sign-in, move anything saved while signed out into the account.
  useEffect(() => {
    if (!signedIn || imported.current) return;
    const pending = read();
    if (!Object.keys(pending).length) return;
    imported.current = true;
    apiFetch(API, { body: { items: pending } })
      .then(() => {
        write({});
        return mutate();
      })
      .catch(() => {
        imported.current = false;
      });
  }, [signedIn, mutate]);

  const saved = useMemo<SavedMap>(
    () => (signedIn ? Object.fromEntries((data?.items ?? []).map((i) => [i.slug, i.status])) : local),
    [signedIn, data, local]
  );
  const ready = sessionStatus !== 'loading' && (signedIn ? data !== undefined : localReady);

  // Optimistic update, then the server; on failure, refetch the truth.
  const change = useCallback(
    async (slug: string, status: TrackStatus | null) => {
      const next = (prev?: ServerList): ServerList => {
        const items = (prev?.items ?? []).filter((i) => i.slug !== slug);
        return { items: status ? [{ slug, status }, ...items] : items };
      };
      await mutate(next(data), { revalidate: false });
      try {
        if (status) await apiFetch(`${API}/${slug}`, { method: 'PUT', body: { status } });
        else await apiFetch(`${API}/${slug}`, { method: 'DELETE' });
      } finally {
        await mutate();
      }
    },
    [data, mutate]
  );

  /** `title` labels the entry in the student's activity log. */
  const toggle = useCallback(
    (slug: string, title = slug) => {
      if (signedIn) return void change(slug, saved[slug] ? null : 'saved');
      const next = read();
      if (next[slug]) delete next[slug];
      else {
        next[slug] = 'saved';
        logActivity({ type: 'saved', label: title, href: `/hackathons/${slug}` });
      }
      write(next);
    },
    [signedIn, change, saved]
  );

  const setStatus = useCallback(
    (slug: string, status: TrackStatus, title = slug) => {
      if (signedIn) return void change(slug, status);
      write({ ...read(), [slug]: status });
      logActivity({ type: status, label: title, href: `/hackathons/${slug}` });
    },
    [signedIn, change]
  );

  const remove = useCallback(
    (slug: string) => {
      if (signedIn) return void change(slug, null);
      const next = read();
      delete next[slug];
      write(next);
    },
    [signedIn, change]
  );

  return { saved, ready, signedIn, count: Object.keys(saved).length, toggle, setStatus, remove };
}
