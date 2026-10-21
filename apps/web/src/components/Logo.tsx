import Link from 'next/link';
import { cn } from '@/lib/cn';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn('h-8 w-8', className)}>
      <rect width="32" height="32" rx="9" fill="#FFFFFF" />
      <circle cx="14" cy="14" r="6.5" fill="none" stroke="#0A0A0A" strokeWidth="2.8" />
      <path d="M19 19l5.5 5.5" stroke="#0A0A0A" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="HackathonFinder home">
      <LogoMark />
      <span className={cn('font-display text-lg uppercase tracking-tight', dark ? 'text-surface' : 'text-ink')}>
        Hackathon<span className="text-neutral-400">Finder</span>
      </span>
    </Link>
  );
}
