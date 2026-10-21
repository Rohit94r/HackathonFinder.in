'use client';

import { useCallback, useEffect, useState } from 'react';

export type TrackStatus = 'saved' | 'registered' | 'submitted' | 'done';

export const TRACK_LABELS: Record<TrackStatus, string> = {
  saved: 'Saved',
  registered: 'Registered',
  submitted: 'Submitted',
  done: 'Done',
};

const KEY = 'hf_saved_v1';
const EVENT = 'hf-saved-change';

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

/** "My hackathons" list, stored in this browser and shared across components. */
export function useSaved() {
  const [saved, setSaved] = useState<SavedMap>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setSaved(read());
    sync();
    setReady(true);
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const toggle = useCallback((slug: string) => {
    const next = read();
    if (next[slug]) delete next[slug];
    else next[slug] = 'saved';
    write(next);
  }, []);

  const setStatus = useCallback((slug: string, status: TrackStatus) => {
    write({ ...read(), [slug]: status });
  }, []);

  const remove = useCallback((slug: string) => {
    const next = read();
    delete next[slug];
    write(next);
  }, []);

  return { saved, ready, count: Object.keys(saved).length, toggle, setStatus, remove };
}
