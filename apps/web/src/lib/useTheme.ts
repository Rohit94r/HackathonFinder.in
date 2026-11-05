'use client';

import { useCallback, useEffect, useState } from 'react';
import { THEME_KEY } from './theme';

export type Theme = 'light' | 'dark';

const EVENT = 'hf-theme-change';

function current(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

/** The site theme, shared by every toggle on the page and kept in sync across tabs. */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const sync = () => setThemeState(current());
    const onStorage = (e: StorageEvent) => {
      if (e.key !== THEME_KEY) return;
      apply(e.newValue === 'dark' ? 'dark' : 'light');
      sync();
    };
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const setTheme = useCallback((theme: Theme) => {
    apply(theme);
    try {
      if (theme === 'dark') window.localStorage.setItem(THEME_KEY, 'dark');
      else window.localStorage.removeItem(THEME_KEY);
    } catch {
      // Storage unavailable; the choice lasts for this visit only.
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const toggle = useCallback(() => setTheme(current() === 'dark' ? 'light' : 'dark'), [setTheme]);

  return { theme, setTheme, toggle };
}
