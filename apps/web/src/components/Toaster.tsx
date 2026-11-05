'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

type Tone = 'success' | 'info' | 'error';

interface Toast {
  id: number;
  message: string;
  tone: Tone;
  action?: { label: string; href: string };
}

const EVENT = 'hf-toast';
const DURATION = 3500;
let nextId = 1;

/** Shows a short message at the bottom of the screen. Safe to call from any client code. */
export function toast(message: string, options: { tone?: Tone; action?: Toast['action'] } = {}) {
  if (typeof window === 'undefined') return;
  const detail: Toast = { id: nextId++, message, tone: options.tone ?? 'success', action: options.action };
  window.dispatchEvent(new CustomEvent<Toast>(EVENT, { detail }));
}

const ICONS = { success: CheckCircle2, info: Info, error: XCircle };
const ICON_COLOR = { success: 'text-success', info: 'text-accent', error: 'text-danger' };

/** Renders the toasts; mounted once in Providers. */
export default function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    const onToast = (e: Event) => {
      const t = (e as CustomEvent<Toast>).detail;
      // Keep the newest three; a repeat of the same message replaces the old one.
      setItems((list) => [...list.filter((x) => x.message !== t.message).slice(-2), t]);
      setTimeout(() => setItems((list) => list.filter((x) => x.id !== t.id)), DURATION);
    };
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  const dismiss = (id: number) => setItems((list) => list.filter((x) => x.id !== id));

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[90] flex flex-col items-center gap-2 px-4 sm:bottom-6"
    >
      {items.map((t) => {
        const Icon = ICONS[t.tone];
        return (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className="hf-toast-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border border-line bg-card px-4 py-3 text-sm text-ink shadow-lift"
          >
            <Icon className={cn('h-[18px] w-[18px] shrink-0', ICON_COLOR[t.tone])} aria-hidden="true" />
            <span className="min-w-0 flex-1 font-medium">{t.message}</span>
            {t.action && (
              <Link href={t.action.href} onClick={() => dismiss(t.id)} className="shrink-0 font-semibold text-accent hover:underline">
                {t.action.label}
              </Link>
            )}
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="-mr-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-ink/5 hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
