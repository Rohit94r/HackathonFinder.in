import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PlatformSign } from '@/components/junction/Signs';

export function SectionHeading({
  eyebrow,
  platform,
  title,
  description,
  action,
  center = false,
  dark = false,
}: {
  eyebrow?: string;
  /** Show a platform sign ("PF 2 · eyebrow") instead of the plain eyebrow. */
  platform?: number;
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
        'mb-8 flex flex-col gap-4',
        center ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between'
      )}
    >
      <div className={cn('max-w-3xl', center && 'mx-auto')}>
        {platform !== undefined ? (
          <PlatformSign n={platform} en={eyebrow ?? 'Platform'} className="mb-4" />
        ) : (
          eyebrow && <span className="eyebrow mb-3">{eyebrow}</span>
        )}
        <h2 className={cn('text-[2rem] sm:text-[2.6rem]', dark && 'text-surface')}>{title}</h2>
        {description && (
          <p className={cn('mt-2 text-base leading-7', dark ? 'text-surface/80' : 'text-muted')}>
            {description}
          </p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 font-display text-[15px] font-bold uppercase tracking-[0.06em] underline decoration-board decoration-[3px] underline-offset-[5px] transition-colors',
            dark ? 'text-surface hover:text-board' : 'text-ink hover:text-accent'
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
 * Page header: big signage title on ticket paper, the accent words in signal red, and a description. `children` sits under the text (search, filters, actions).
 */
export function PageHero({
  title,
  accent,
  eyebrow,
  description,
  children,
}: {
  title: string;
  accent?: string;
  eyebrow?: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="hf-hero overflow-hidden border-b border-line">
      <div className="container-page py-10 sm:py-14">
        {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
        <h1 className="max-w-4xl text-[2.6rem] sm:text-[3.6rem] lg:text-[4.4rem]">
          {title}
          {accent && <span className="text-accent dark:text-board">{` ${accent}`}</span>}
        </h1>
        {description && <p className="mt-4 max-w-2xl text-[17px] leading-7 text-ink/70">{description}</p>}
        {children && <div className="mt-7 w-full">{children}</div>}
      </div>
    </section>
  );
}
