import Link from 'next/link';
import { cn } from '@/lib/cn';

/** The wordmark: "HackathonFinder" in one colour, no icon. */
export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="flex shrink-0 items-center rounded-md" aria-label="HackathonFinder home">
      <span className={cn('text-[17px] font-semibold leading-none tracking-[-0.03em]', dark ? 'text-surface' : 'text-ink')}>
        Hackathon<span className="text-accent">Finder</span>
      </span>
    </Link>
  );
}
