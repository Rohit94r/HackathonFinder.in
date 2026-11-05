import Link from 'next/link';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

/** A titled card section on the profile pages. */
export function Panel({
  title,
  icon: Icon,
  action,
  children,
  className,
}: {
  title: string;
  icon?: LucideIcon;
  action?: { href: string; label: string };
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('card p-5 sm:p-6', className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-sans text-base font-bold normal-case tracking-normal text-ink">
          {Icon && <Icon className="h-5 w-5" aria-hidden="true" />}
          {title}
        </h2>
        {action && (
          <Link href={action.href} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300">
            {action.label}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** Friendly prompt for an empty section, with one next step. */
export function EmptyNudge({ text, href, cta, icon: Icon }: { text: string; href: string; cta: string; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-ink/20 p-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-center gap-2 text-sm text-ink/70">
        {Icon && <Icon className="h-5 w-5 shrink-0 text-ink/50" aria-hidden="true" />}
        {text}
      </p>
      <Link href={href} className="btn-secondary shrink-0 px-4 py-2 text-sm">
        {cta}
      </Link>
    </div>
  );
}

/** Two-column LeetCode layout: profile card on the left, stats on the right. */
export function ProfileLayout({ side, children }: { side: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="space-y-5">{side}</div>
      <div className="min-w-0 space-y-6">{children}</div>
    </div>
  );
}
