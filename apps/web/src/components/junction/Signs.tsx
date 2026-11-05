import { cn } from '@/lib/cn';

/**
 * A yellow station signboard with a black inset rule, like the name boards at the end of a platform.
 * `posts` stands it on two legs; `code` adds the station code in the corner.
 */
export function StationBoard({
  en,
  code,
  note,
  size = 'md',
  posts = false,
  className,
}: {
  en: string;
  code?: string;
  note?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  posts?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'station-board relative flex flex-col items-center justify-center text-center',
        posts && 'station-board-posts',
        size === 'sm' && 'px-4 py-2.5',
        size === 'md' && 'px-5 py-3.5',
        size === 'lg' && 'px-8 py-5',
        className
      )}
    >
      {code && (
        <span className="absolute right-2.5 top-2 font-mono text-[9px] font-bold tracking-[0.12em] text-navy/55" aria-hidden="true">
          {code}
        </span>
      )}
      <span
        className={cn(
          'block max-w-full truncate font-display font-extrabold uppercase leading-none tracking-[0.04em]',
          size === 'sm' ? 'text-xl' : size === 'md' ? 'text-[26px]' : 'text-4xl'
        )}
      >
        {en}
      </span>
      {note && <span className="mt-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-navy/70">{note}</span>}
    </div>
  );
}

/** "PF 3 · Platform name": the black platform sign over a section. */
export function PlatformSign({ n, en, className }: { n: number | string; en: string; className?: string }) {
  return (
    <p className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="pf-num" aria-label={`Platform ${n}`}>
        {n}
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted">Platform</span>
        <span className="mt-1 font-display text-[15px] font-bold uppercase tracking-[0.06em] text-ink">
          {en}
        </span>
      </span>
    </p>
  );
}

/** Decorative barcode drawn from a string, so each ticket gets its own. */
export function Barcode({ seed, bars: count = 26, className }: { seed: string; bars?: number; className?: string }) {
  const bars: number[] = [];
  for (let i = 0; i < count; i++) bars.push(((seed.charCodeAt(i % seed.length) * (i + 7)) % 3) + 1);
  return (
    <span className={cn('flex h-full items-stretch gap-[1.5px]', className)} aria-hidden="true">
      {bars.map((w, i) => (
        <span key={i} className="bg-current" style={{ width: w }} />
      ))}
    </span>
  );
}
