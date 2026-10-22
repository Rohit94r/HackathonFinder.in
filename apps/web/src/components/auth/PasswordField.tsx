'use client';

import { useState } from 'react';
import { Check, Eye, EyeOff, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { passwordStrength } from './authUtils';

const BAR = ['bg-ink/15', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-600'];

/** Password input with a show/hide toggle and, for new passwords, a strength hint. */
export default function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  error,
  showStrength = false,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: 'current-password' | 'new-password';
  error?: string;
  showStrength?: boolean;
  hint?: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const strength = passwordStrength(value);
  const describedBy = [error && `${id}-error`, showStrength && `${id}-strength`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="label">
          {label}
        </label>
        {hint && (
          <span id={`${id}-hint`} className="text-xs">
            {hint}
          </span>
        )}
      </div>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          maxLength={128}
          className={cn('input pr-12', error && 'border-brand-500')}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-1.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink/55 hover:bg-ink/5 hover:text-ink"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs font-medium text-brand-700 dark:text-brand-300">
          {error}
        </p>
      )}
      {showStrength && (
        <div id={`${id}-strength`} className="mt-2" aria-live="polite">
          <div className="flex items-center gap-2">
            <div className="flex flex-1 gap-1" aria-hidden="true">
              {[1, 2, 3].map((n) => (
                <span key={n} className={cn('h-1.5 flex-1 rounded-full transition', strength.score >= n ? BAR[strength.score] : 'bg-ink/10')} />
              ))}
            </div>
            <span className="w-16 text-right text-xs font-semibold text-ink/70">{strength.label}</span>
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {strength.rules.map((r) => (
              <li key={r.text} className={cn('flex items-center gap-1', r.ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-ink/60')}>
                {r.ok ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <X className="h-3.5 w-3.5" aria-hidden="true" />}
                {r.text}
                <span className="sr-only">{r.ok ? '(done)' : '(not yet)'}</span>
              </li>
            ))}
            {strength.score > 0 && strength.score < 3 && (
              <li className="text-ink/55">Longer, with a symbol or capital, is stronger.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
