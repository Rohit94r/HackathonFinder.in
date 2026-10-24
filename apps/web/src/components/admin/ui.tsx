'use client';

import { forwardRef, useCallback, useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, ExternalLink, ImageOff, Loader2, Search } from 'lucide-react';
import { ApiClientError } from '@/lib/apiClient';
import { formatDate, formatTime, timeAgo } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { LucideIcon } from 'lucide-react';

// Building blocks for the admin area: black and white only, hairline borders, small
// radius, dense tables. Grey is only for secondary text and lines.

// ---------- Formatting ----------

export const num = (n: number | null | undefined) => (typeof n === 'number' && Number.isFinite(n) ? n.toLocaleString('en-IN') : '–');
export const pct = (x: number | null | undefined, digits = 0) => (typeof x === 'number' && Number.isFinite(x) ? `${(x * 100).toFixed(digits)}%` : '–');

/** "1m 20s", "45s", "–". */
export function duration(ms: number | null | undefined): string {
  if (typeof ms !== 'number' || !Number.isFinite(ms) || ms <= 0) return '–';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m ${s % 60}s` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

/** Only http(s) links are ever rendered as links. */
export function safeHref(url: string | null | undefined): string | undefined {
  return url && /^https?:\/\//i.test(url.trim()) ? url.trim() : undefined;
}

// ---------- Buttons ----------

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

export function btnClass(variant: Variant = 'secondary', size: Size = 'md', className?: string) {
  return cn(
    'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[3px] border font-medium transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black',
    size === 'sm' ? 'h-7 px-2.5 text-xs' : size === 'lg' ? 'h-12 px-6 text-base' : 'h-9 px-3.5 text-sm',
    variant === 'primary' && 'border-black bg-black text-white hover:bg-neutral-800',
    variant === 'secondary' && 'border-neutral-400 bg-white text-black hover:border-black hover:bg-neutral-100',
    variant === 'ghost' && 'border-transparent bg-transparent text-black hover:bg-neutral-100',
    className
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  busy?: boolean;
  icon?: LucideIcon;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', busy, icon: Icon, children, className, disabled, type = 'button', ...props },
  ref
) {
  const iconCls = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  return (
    <button ref={ref} type={type} className={btnClass(variant, size, className)} disabled={disabled || busy} aria-busy={busy || undefined} {...props}>
      {busy ? <Loader2 className={cn(iconCls, 'animate-spin')} aria-hidden="true" /> : Icon ? <Icon className={iconCls} aria-hidden="true" /> : null}
      {children}
    </button>
  );
});

/** An outside link: always a new tab, never passes our page as the referrer. */
export function ExtLink({ href, children, className, title }: { href: string | null | undefined; children: ReactNode; className?: string; title?: string }) {
  const url = safeHref(href);
  if (!url) return <span className={cn('text-neutral-500', className)}>{children}</span>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer nofollow" title={title ?? url} className={cn('inline-flex items-center gap-1 underline decoration-neutral-400 underline-offset-2 hover:decoration-black', className)}>
      {children}
      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
    </a>
  );
}

// ---------- Text and layout ----------

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-neutral-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
  flush,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** No padding inside, for tables and lists that bring their own. */
  flush?: boolean;
}) {
  return (
    <section className={cn('min-w-0 border border-neutral-300 bg-white', className)}>
      {(title || action) && (
        <header className="flex min-h-[42px] flex-wrap items-center justify-between gap-2 border-b border-neutral-200 px-4 py-2">
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          {action}
        </header>
      )}
      <div className={flush ? '' : 'p-4'}>{children}</div>
    </section>
  );
}

export function Badge({ children, tone = 'outline', title, className }: { children: ReactNode; tone?: 'solid' | 'outline' | 'muted'; title?: string; className?: string }) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-[2px] border px-1.5 py-px text-[11px] font-medium uppercase leading-4 tracking-wide',
        tone === 'solid' && 'border-black bg-black text-white',
        tone === 'outline' && 'border-neutral-500 text-black',
        tone === 'muted' && 'border-neutral-300 text-neutral-500',
        className
      )}
    >
      {children}
    </span>
  );
}

const STATE_TONE: Record<string, 'solid' | 'outline' | 'muted'> = { live: 'solid', pending: 'outline', rejected: 'muted', removed: 'muted' };
export function StateBadge({ state }: { state: string }) {
  return <Badge tone={STATE_TONE[state] ?? 'muted'}>{state}</Badge>;
}

export function Loading({ children = 'Loading…' }: { children?: ReactNode }) {
  return (
    <p className="flex items-center gap-2 py-6 text-sm text-neutral-500" role="status">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      {children}
    </p>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="border border-dashed border-neutral-300 px-4 py-8 text-center">
      <p className="text-sm font-medium">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-lg text-sm text-neutral-500">{children}</div>}
    </div>
  );
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2 border-2 border-black bg-white px-3 py-2 text-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 break-words">{children}</div>
    </div>
  );
}

export function Notice({ children, done }: { children: ReactNode; done?: boolean }) {
  return (
    <div role="status" className={cn('flex items-start gap-2 border px-3 py-2 text-sm', done ? 'border-black' : 'border-neutral-300 text-neutral-700')}>
      {done && <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
      <div className="min-w-0 break-words">{children}</div>
    </div>
  );
}

// ---------- Numbers ----------

export function Delta({ current, previous, label }: { current: number | null; previous: number | null; label?: string }) {
  if (current === null || previous === null) return null;
  if (previous === 0) {
    return <span className="text-xs text-neutral-500">{current > 0 ? `new vs ${label ?? 'before'}` : `no change`}</span>;
  }
  const change = (current - previous) / previous;
  const Icon = change >= 0 ? ArrowUp : ArrowDown;
  return (
    <span className="inline-flex items-center gap-0.5 text-xs text-neutral-500" title={`${num(previous)} ${label ? `in ${label}` : 'before'}`}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      <span className={cn(Math.abs(change) >= 0.1 && 'font-semibold text-black')}>{Math.abs(change * 100).toFixed(0)}%</span>
      {label && <span>vs {label}</span>}
    </span>
  );
}

export function Stat({ label, value, sub, hint }: { label: string; value: ReactNode; sub?: ReactNode; hint?: string }) {
  return (
    <div className="min-w-0 border border-neutral-300 bg-white px-3 py-2.5" title={hint}>
      <p className="truncate text-[11px] font-medium uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-0.5 text-2xl font-semibold tabular-nums leading-tight">{value}</p>
      {sub && <div className="mt-0.5 min-h-[16px]">{sub}</div>}
    </div>
  );
}

// ---------- Tables ----------

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-x-auto border border-neutral-300 bg-white', className)}>
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className, right }: { children?: ReactNode; className?: string; right?: boolean }) {
  return (
    <th scope="col" className={cn('whitespace-nowrap border-b border-neutral-300 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500', right ? 'text-right' : 'text-left', className)}>
      {children}
    </th>
  );
}

export function Td({ children, className, right, colSpan }: { children?: ReactNode; className?: string; right?: boolean; colSpan?: number }) {
  return (
    <td colSpan={colSpan} className={cn('border-b border-neutral-200 px-3 py-2 align-top', right && 'text-right tabular-nums', className)}>
      {children}
    </td>
  );
}

// ---------- Inputs ----------

export const inputClass =
  'h-9 w-full min-w-0 rounded-[3px] border border-neutral-400 bg-white px-2.5 text-sm text-black placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black disabled:bg-neutral-100';
export const labelClass = 'mb-1 block text-xs font-medium text-neutral-600';

export function SearchInput({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder: string; className?: string }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  useEffect(() => {
    if (text === value) return;
    const t = setTimeout(() => onChange(text), 300);
    return () => clearTimeout(t);
  }, [text, value, onChange]);
  return (
    <label className={cn('relative block w-full sm:w-72', className)}>
      <span className="sr-only">{placeholder}</span>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
      <input type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} className={cn(inputClass, 'pl-8')} maxLength={80} />
    </label>
  );
}

export function Select<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (v: NoInfer<T>) => void;
  options: { value: NoInfer<T>; label: string }[];
  label: string;
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)} className={cn(inputClass, 'pr-7')} aria-label={label}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Segmented buttons, e.g. live / pending / removed. Scrolls sideways on a phone. */
export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: NoInfer<T>; label: string; count?: number }[]; onChange: (v: NoInfer<T>) => void; label?: string }) {
  return (
    <div role="tablist" aria-label={label} className="flex max-w-full overflow-x-auto rounded-[3px] border border-neutral-400">
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={cn('h-8 shrink-0 whitespace-nowrap px-3 text-sm transition-colors', i > 0 && 'border-l border-neutral-400', on ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100')}
          >
            {o.label}
            {typeof o.count === 'number' && <span className={cn('ml-1.5 tabular-nums', on ? 'text-neutral-300' : 'text-neutral-500')}>{num(o.count)}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Pager({ page, pages, onPage, total }: { page: number; pages: number; onPage: (p: number) => void; total?: number }) {
  if (pages <= 1) return total !== undefined ? <p className="mt-3 text-xs text-neutral-500">{num(total)} total</p> : null;
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
      <span className="text-xs text-neutral-500">{total !== undefined ? `${num(total)} total · ` : ''}Page {page} of {pages}</span>
      <div className="flex gap-2">
        <Button size="sm" icon={ChevronLeft} disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

// ---------- Media and time ----------

/** A banner or poster thumbnail, with a plain box when there's no image or it fails to load. */
export function Thumb({ src, className, alt = '' }: { src: string | null | undefined; className?: string; alt?: string }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  const ok = src && (src.startsWith('/uploads/') || safeHref(src));
  if (!ok || broken) {
    return (
      <span className={cn('flex shrink-0 items-center justify-center border border-neutral-300 bg-white text-neutral-400', className ?? 'h-12 w-20')} aria-hidden="true">
        <ImageOff className="h-4 w-4" />
      </span>
    );
  }
  return (
    // Images come from many hosts (Cloudinary, scraped posters), so a plain img is used.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} className={cn('shrink-0 border border-neutral-300 bg-white object-cover', className ?? 'h-12 w-20')} />
  );
}

/** "3 hours ago", rendered in the browser so server and client never disagree. */
export function Ago({ at, fallback = 'never' }: { at: string | Date | null | undefined; fallback?: string }) {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => setNow(new Date().toISOString()), []);
  if (!at) return <>{fallback}</>;
  const iso = new Date(at).toISOString();
  return (
    <time dateTime={iso} title={`${formatDate(iso)}, ${formatTime(iso)} IST`}>
      {now ? timeAgo(iso, now) : formatDate(iso)}
    </time>
  );
}

export function When({ at, time = true }: { at: string | Date | null | undefined; time?: boolean }) {
  if (!at) return <>–</>;
  const iso = new Date(at).toISOString();
  return (
    <time dateTime={iso} className="whitespace-nowrap">
      {formatDate(iso)}
      {time && `, ${formatTime(iso)}`}
    </time>
  );
}

// ---------- Running an action ----------

/**
 * Runs one API action at a time and keeps its state: which one is busy, the last
 * error (with per-field messages) and the last success message.
 */
export function useAction() {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [done, setDone] = useState('');
  const run = useCallback(async <T,>(key: string, fn: () => Promise<T>, success?: string | ((result: T) => string)): Promise<T | undefined> => {
    setBusy(key);
    setError('');
    setFields({});
    setDone('');
    try {
      const result = await fn();
      if (success) setDone(typeof success === 'function' ? success(result) : success);
      return result;
    } catch (err) {
      const e = err instanceof ApiClientError ? err : null;
      setError(e?.message ?? (err instanceof Error && err.message ? err.message : 'That didn’t work. Please try again.'));
      setFields(e?.fields ?? {});
      return undefined;
    } finally {
      setBusy('');
    }
  }, []);
  const clear = useCallback(() => {
    setError('');
    setFields({});
    setDone('');
  }, []);
  return { busy, error, fields, done, run, clear, setDone, setError };
}

/** The error and success lines for useAction, in one place. */
export function ActionStatus({ error, done, fields }: { error: string; done: string; fields?: Record<string, string> }) {
  const extra = Object.entries(fields ?? {}).filter(([k]) => k !== '_');
  if (!error && !done) return null;
  return error ? (
    <ErrorBox>
      {error}
      {extra.length > 0 && (
        <ul className="mt-1 list-inside list-disc text-xs">
          {extra.slice(0, 8).map(([k, v]) => (
            <li key={k}>
              {k.replace(/^(listing|fields)\./, '')}: {v}
            </li>
          ))}
        </ul>
      )}
    </ErrorBox>
  ) : (
    <Notice done>{done}</Notice>
  );
}

// ---------- Confirm dialog ----------

export interface ConfirmOptions {
  title: string;
  body?: ReactNode;
  confirmLabel?: string;
  /** Ask for a reason (e.g. why a listing is removed). */
  reason?: { label: string; placeholder?: string; required?: boolean; suggestions?: string[] };
  /** Make them type this exact text first, for things that can't be undone. */
  typeToConfirm?: string;
  checkbox?: { label: string; defaultChecked?: boolean };
}
export interface ConfirmResult {
  reason: string;
  checked: boolean;
}

/**
 * A confirm dialog as a hook: `const [dialog, confirm] = useConfirm()`, render
 * `{dialog}`, then `const ok = await confirm({...})` (null when cancelled).
 */
export function useConfirm(): [ReactNode, (opts: ConfirmOptions) => Promise<ConfirmResult | null>] {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((r: ConfirmResult | null) => void) | null>(null);
  const ask = useCallback((o: ConfirmOptions) => {
    resolver.current?.(null);
    setOpts(o);
    return new Promise<ConfirmResult | null>((resolve) => (resolver.current = resolve));
  }, []);
  const close = useCallback((result: ConfirmResult | null) => {
    resolver.current?.(result);
    resolver.current = null;
    setOpts(null);
  }, []);
  return [opts ? <ConfirmDialog key={opts.title} opts={opts} onClose={close} /> : null, ask];
}

function ConfirmDialog({ opts, onClose }: { opts: ConfirmOptions; onClose: (r: ConfirmResult | null) => void }) {
  const [reason, setReason] = useState('');
  const [typed, setTyped] = useState('');
  const [checked, setChecked] = useState(Boolean(opts.checkbox?.defaultChecked));
  const box = useRef<HTMLDivElement>(null);
  const ok = (!opts.reason?.required || reason.trim().length >= 2) && (!opts.typeToConfirm || typed.trim() === opts.typeToConfirm);

  useEffect(() => {
    const first = box.current?.querySelector<HTMLElement>('input, textarea, button[data-confirm]');
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && onClose(null)}>
      <div ref={box} role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md border border-black bg-white p-5">
        <h2 id="confirm-title" className="text-base font-semibold">
          {opts.title}
        </h2>
        {opts.body && <div className="mt-2 text-sm text-neutral-700">{opts.body}</div>}
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (ok) onClose({ reason: reason.trim(), checked });
          }}
        >
          {opts.reason && (
            <div>
              <label htmlFor="confirm-reason" className={labelClass}>
                {opts.reason.label}
                {!opts.reason.required && ' (optional)'}
              </label>
              <input id="confirm-reason" className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder={opts.reason.placeholder} list={opts.reason.suggestions ? 'confirm-reasons' : undefined} />
              {opts.reason.suggestions && (
                <>
                  <datalist id="confirm-reasons">
                    {opts.reason.suggestions.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {opts.reason.suggestions.map((s) => (
                      <button key={s} type="button" onClick={() => setReason(s)} className={cn('rounded-[2px] border px-2 py-0.5 text-xs', reason === s ? 'border-black bg-black text-white' : 'border-neutral-300 hover:border-black')}>
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          {opts.checkbox && (
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-0.5 h-4 w-4 accent-black" />
              {opts.checkbox.label}
            </label>
          )}
          {opts.typeToConfirm && (
            <div>
              <label htmlFor="confirm-type" className={labelClass}>
                Type <strong className="font-mono text-black">{opts.typeToConfirm}</strong> to confirm
              </label>
              <input id="confirm-type" className={inputClass} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck={false} />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button onClick={() => onClose(null)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={!ok} data-confirm="">
              {opts.confirmLabel ?? 'Confirm'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
