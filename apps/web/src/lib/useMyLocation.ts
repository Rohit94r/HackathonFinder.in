'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CITIES, nearbyCity, type LatLng } from '@hackathonfinder/shared';

export interface MyLocation extends LatLng {
  /** Shown to the student, e.g. "Your location, near Pune" or "Pune". */
  label: string;
  via: 'gps' | 'city';
}

export type LocateState = 'idle' | 'locating' | 'denied' | 'unavailable';

const KEY = 'hf_location_v1';
const EVENT = 'hf-location-change';

/** The browser's own timeout skips time spent on the permission prompt, so we stop waiting ourselves. */
const GIVE_UP_MS = 15000;

function read(): MyLocation | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MyLocation) : null;
  } catch {
    return null;
  }
}

function write(location: MyLocation | null) {
  try {
    if (location) window.localStorage.setItem(KEY, JSON.stringify(location));
    else window.localStorage.removeItem(KEY);
  } catch {
    // Storage can be unavailable (private mode); the location just won't persist.
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Rounds to about 1 km, so we never keep a precise position. */
function coarse(n: number): number {
  return Math.round(n * 100) / 100;
}

/** The student's location for "near me", stored only in this browser. */
export function useMyLocation() {
  const [location, setLocation] = useState<MyLocation | null>(null);
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<LocateState>('idle');
  // Bumped by every locate or city pick, so a late GPS answer can't undo a newer choice.
  const attempt = useRef(0);

  useEffect(() => {
    const sync = () => setLocation(read());
    sync();
    setReady(true);
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  /** Asks the browser for the student's position. */
  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState('unavailable');
      return;
    }
    const id = ++attempt.current;
    setState('locating');
    // A student who ignores the prompt can still accept it later; we just stop showing "Finding you…".
    const giveUp = setTimeout(() => attempt.current === id && setState('unavailable'), GIVE_UP_MS);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(giveUp);
        if (attempt.current !== id) return;
        const point = { lat: coarse(pos.coords.latitude), lng: coarse(pos.coords.longitude) };
        const city = nearbyCity(point);
        write({ ...point, label: city ? `Your location, near ${city.name}` : 'Your location', via: 'gps' });
        setState('idle');
      },
      (err) => {
        clearTimeout(giveUp);
        if (attempt.current !== id) return;
        setState(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable');
      },
      { enableHighAccuracy: false, timeout: GIVE_UP_MS, maximumAge: 10 * 60 * 1000 }
    );
  }, []);

  /** Uses a city centre instead of GPS. */
  const pickCity = useCallback((slug: string) => {
    const city = CITIES.find((c) => c.slug === slug);
    if (!city) return;
    attempt.current++;
    write({ lat: city.lat, lng: city.lng, label: city.name, via: 'city' });
    setState('idle');
  }, []);

  const clear = useCallback(() => write(null), []);

  return { location, ready, state, locate, pickCity, clear };
}
