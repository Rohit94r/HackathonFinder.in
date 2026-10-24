import Link from 'next/link';
import { cn } from '@/lib/cn';

/** The wordmark, same serif as the landing navbar: just "HackathonFinder", one colour, no icon. */
export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="flex items-center" aria-label="HackathonFinder home">
      <span className={cn('font-display text-[22px] leading-none', dark ? 'text-surface' : 'text-ink')}>HackathonFinder</span>
    </Link>
  );
}
