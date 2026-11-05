import Link from 'next/link';
import { cn } from '@/lib/cn';

/**
 * The wordmark on a station signboard: "HACKATHONFINDER" on a yellow plate with a black
 * inset rule. No icon. `dark` is kept for older callers; the plate reads on any background.
 */
export function Logo({ size = 'md' }: { dark?: boolean; size?: 'md' | 'lg' }) {
  return (
    <Link href="/" className="flex shrink-0 items-center rounded-md" aria-label="HackathonFinder home">
      <span className={cn('station-board flex flex-col items-center', size === 'md' ? 'px-3 py-[7px]' : 'px-5 py-3')}>
        <span
          className={cn(
            'font-display font-extrabold uppercase leading-none tracking-[0.05em]',
            size === 'md' ? 'text-[19px]' : 'text-[28px]'
          )}
        >
          Hackathon<span className="text-accent">Finder</span>
        </span>
      </span>
    </Link>
  );
}
