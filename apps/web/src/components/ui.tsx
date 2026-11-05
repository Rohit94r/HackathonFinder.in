import Link from 'next/link';
import { ArrowRight, Info } from 'lucide-react';
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
        'mb-8 flex flex-col gap-4',
        center ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between'
      )}
    >
      <div className={cn('max-w-3xl', center && 'mx-auto')}>
        {eyebrow && <span className="eyebrow mb-3">{eyebrow}</span>}
        <h2 className={cn('text-2xl sm:text-3xl', dark && 'text-surface')}>{title}</h2>
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
            'inline-flex shrink-0 items-center gap-1.5 text-sm font-medium',
            dark ? 'text-brand-300 hover:text-white' : 'text-accent hover:text-accent-dark dark:text-brand-300 dark:hover:text-white'
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
 * Page header: a plain band with the title, an optional accent line and a description,
 * left-aligned like an editorial page. `children` sits under the text (search, filters, actions).
 */
export function PageHero({
  title,
  accent,
  description,
  children,
}: {
  title: string;
  accent?: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="hf-hero border-b border-line">
      <div className="container-page py-10 sm:py-14">
        <h1 className="max-w-3xl text-3xl sm:text-4xl lg:text-[2.75rem]">
          {title}
          {accent && <span className="text-muted">{` ${accent}`}</span>}
        </h1>
        {description && <p className="mt-3 max-w-2xl text-base leading-7 text-muted">{description}</p>}
        {children && <div className="mt-6 w-full">{children}</div>}
      </div>
    </section>
  );
}

export function SampleNotice({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'flex items-start gap-2 rounded-lg border border-line bg-card px-4 py-3 text-sm text-ink/80',
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
