import Link from 'next/link';
import { Code2 } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * The HackathonFinder wordmark: a red tile with a white code mark, then the name
 * in Manrope. "Finder" picks up the brand red so the mark and the name read as
 * one lockup.
 */
export function Logo({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      aria-label="HackathonFinder home"
    >
      <span
        className={cn(
          'grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-accent text-white shadow-[0_1px_2px_rgba(16,16,20,0.16)] transition group-hover:bg-accent-dark',
          compact && 'h-7 w-7'
        )}
        aria-hidden="true"
      >
        <Code2 className={compact ? 'h-4 w-4' : 'h-[18px] w-[18px]'} strokeWidth={2.4} />
      </span>
      <span
        className={cn(
          'font-display font-extrabold leading-none tracking-[-0.035em]',
          compact ? 'text-[17px]' : 'text-[19px]',
          dark ? 'text-white' : 'text-ink'
        )}
      >
        Hackathon<span className="text-accent">Finder</span>
      </span>
    </Link>
  );
}
