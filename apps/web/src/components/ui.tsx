import Link from 'next/link';
import { ArrowRight, Info } from 'lucide-react';
import Sticker from '@/components/art/Sticker';
import CursorSpotlight from '@/components/motion/CursorSpotlight';
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
      data-reveal="up"
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
            'inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold',
            dark ? 'text-brand-300 hover:text-white' : 'text-brand-700 hover:text-ink dark:text-brand-300 dark:hover:text-white'
          )}
        >
          {action.label}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

/**
 * Page header in the landing page style: white with a red fade (light theme) or charcoal
 * with a warm glow (dark), a serif title and a red accent line, centered.
 */
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
    <section className="hf-hero relative overflow-hidden border-b border-ink/10">
      <CursorSpotlight />
      {stickers && (
        <>
          <Sticker text="Ship it" tone="yellow" parallax={0.12} className="left-[4%] top-10 hidden -rotate-12 lg:inline-flex" />
          <Sticker text="Team up" tone="turquoise" shape="circle" parallax={-0.1} className="bottom-8 right-[5%] hidden rotate-12 lg:inline-flex" />
        </>
      )}
      <div className="container-page relative z-[3] flex flex-col items-center py-14 text-center sm:py-20">
        <h1 className="hf-rise text-[2.5rem] sm:text-6xl lg:text-7xl">
          {title}
          {accent && (
            <>
              {' '}
              <span className="hf-rise text-neon-dark block pb-1" style={{ ['--d' as string]: '120ms' }}>
                {accent}
              </span>
            </>
          )}
        </h1>
        {description && (
          <p className="hf-rise mt-5 max-w-2xl text-base leading-7 text-ink/70 sm:text-lg sm:leading-8" style={{ ['--d' as string]: '240ms' }}>
            {description}
          </p>
        )}
        {children && (
          <div className="hf-rise mt-8 w-full" style={{ ['--d' as string]: '360ms' }}>
            {children}
          </div>
        )}
      </div>
    </section>
  );
}

export function SampleNotice({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'flex items-start gap-2 rounded-[14px] border border-ink/15 bg-card px-4 py-3 text-sm text-ink/80',
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
