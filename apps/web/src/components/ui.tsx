import Link from 'next/link';
import { ArrowRight, Info } from 'lucide-react';
import Sticker from '@/components/art/Sticker';
import { cn } from '@/lib/cn';

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  center = false,
  dark = false,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: { href: string; label: string };
  center?: boolean;
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        'mb-10 flex flex-col gap-4',
        center ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between'
      )}
    >
      <div className={cn('max-w-3xl', center && 'mx-auto')}>
        {eyebrow && <span className="eyebrow mb-4">{eyebrow}</span>}
        <h2 className={cn('text-4xl sm:text-5xl lg:text-6xl', dark && 'text-surface')}>{title}</h2>
        {description && (
          <p className={cn('mt-4 text-base leading-7 sm:text-lg', dark ? 'text-surface/80' : 'text-ink/70')}>
            {description}
          </p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold uppercase tracking-wide',
            dark ? 'text-white hover:text-surface' : 'text-ink hover:text-ink'
          )}
        >
          {action.label}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

/** Dark green page header: one cream line and one neon line, centered. */
export function PageHero({
  title,
  accent,
  description,
  children,
  stickers = true,
}: {
  title: string;
  accent?: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  stickers?: boolean;
}) {
  return (
    <section className="on-dark relative overflow-hidden bg-ink">
      {stickers && (
        <>
          <Sticker text="Ship it" tone="yellow" className="left-[4%] top-10 hidden -rotate-12 md:inline-flex" />
          <Sticker text="Team up" tone="turquoise" shape="circle" className="bottom-8 right-[5%] hidden rotate-12 md:inline-flex" />
        </>
      )}
      <div className="container-page relative flex flex-col items-center py-20 text-center sm:py-24">
        <h1 className="text-5xl text-surface sm:text-6xl lg:text-7xl">{title}</h1>
        {accent && <p className="font-display text-5xl uppercase leading-[0.9] tracking-tight text-outline sm:text-6xl lg:text-7xl">{accent}</p>}
        {description && <p className="mt-6 max-w-2xl text-lg leading-8 text-surface/80">{description}</p>}
        {children && <div className="mt-8 w-full">{children}</div>}
      </div>
    </section>
  );
}

export function SampleNotice({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'flex items-start gap-2 rounded-[14px] border border-ink/15 bg-lime-soft px-4 py-3 text-sm text-ink',
        className
      )}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        {children ??
          'Preview: these are sample listings. Real hackathons appear here as soon as our discovery agents go live.'}
      </span>
    </p>
  );
}
