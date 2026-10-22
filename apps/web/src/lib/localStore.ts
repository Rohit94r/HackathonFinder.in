'use client';

import { useCallback, useEffect, useState } from 'react';

// Student data lives in this browser until accounts launch. Every hook built on this
// shares one copy per key: a change in one component shows up in all the others,
// and in other tabs.

const eventName = (key: string) => `hf-store:${key}`;

export function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStore<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode); the change lasts for this visit only.
  }
  window.dispatchEvent(new Event(eventName(key)));
}

/**
 * A value kept in localStorage under `key`. `ready` is false until the first read,
 * so pages can render the server markup first and avoid hydration mismatches.
 */
export function useStore<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setValue(readStore(key, fallback));
    const onStorage = (e: StorageEvent) => e.key === key && sync();
    sync();
    setReady(true);
    window.addEventListener(eventName(key), sync);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(eventName(key), sync);
      window.removeEventListener('storage', onStorage);
    };
    // `fallback` is only a default for empty storage, so it isn't a dependency.
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === 'function' ? (next as (prev: T) => T)(readStore(key, fallback)) : next;
      writeStore(key, resolved);
    },
    [key]
  );

  return [value, update, ready] as const;
}
