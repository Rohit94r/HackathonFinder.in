import Link from 'next/link';
import { cn } from '@/lib/cn';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn('h-8 w-8', className)}>
      <defs>
        <linearGradient id="hf-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ec3750" />
          <stop offset="1" stopColor="#ff8c37" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#hf-logo)" />
      <circle cx="14" cy="14" r="6.5" fill="none" stroke="#FFFFFF" strokeWidth="2.8" />
      <path d="M19 19l5.5 5.5" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="HackathonFinder home">
      <LogoMark />
      {/* Same wordmark as the landing navbar: serif, with "Finder" in red (orange on dark panels). */}
      <span className={cn('font-display text-[22px] leading-none', dark ? 'text-surface' : 'text-ink')}>
        Hackathon<span className={dark ? 'text-pop' : 'text-accent'}>Finder</span>
      </span>
    </Link>
  );
}
