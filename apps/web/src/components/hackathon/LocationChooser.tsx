'use client';

import { useId } from 'react';
import { LocateFixed } from 'lucide-react';
import { CITIES } from '@hackathonfinder/shared';
import type { LocateState } from '@/lib/useMyLocation';
import { cn } from '@/lib/cn';

const MESSAGES: Partial<Record<LocateState, string>> = {
  denied: 'Location is blocked in your browser. Pick your city instead.',
  unavailable: 'We couldn’t find your location. Pick your city instead.',
};

interface LocationChooserProps {
  state: LocateState;
  onLocate: () => void;
  onPickCity: (slug: string) => void;
  /** Button and city list side by side on wider screens. */
  row?: boolean;
  className?: string;
}

/** "Use my location", with a city list for students who'd rather not share it. */
export default function LocationChooser({ state, onLocate, onPickCity, row = false, className }: LocationChooserProps) {
  const id = useId();
  const message = MESSAGES[state];

  return (
    <div className={className}>
      <div className={cn('flex flex-col gap-3', row && 'sm:flex-row')}>
        <button type="button" onClick={onLocate} disabled={state === 'locating'} className="btn-secondary whitespace-nowrap">
          <LocateFixed className={cn('h-4 w-4', state === 'locating' && 'animate-spin')} />
          {state === 'locating' ? 'Finding you…' : 'Use my location'}
        </button>
        <label htmlFor={id} className="sr-only">
          Or pick your city
        </label>
        <select
          id={id}
          value=""
          onChange={(e) => e.target.value && onPickCity(e.target.value)}
          className={cn('input', row && 'sm:w-52')}
        >
          <option value="">Or pick your city</option>
          {CITIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      {message && (
        <p role="status" className="mt-2 text-xs font-medium text-danger dark:text-red-400">
          {message}
        </p>
      )}
    </div>
  );
}
