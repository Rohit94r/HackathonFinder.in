import Link from 'next/link';
import { LogIn, UserPlus, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { withNext } from './authUtils';

/** Shown to signed-out visitors where an account is needed: what they get, and the way in. */
export default function SignInPrompt({
  next,
  title,
  text,
  icon: Icon = LogIn,
  compact = false,
  className,
}: {
  next: string;
  title: string;
  text: string;
  icon?: LucideIcon;
  /** A slim row for inside a page (e.g. in place of a reply form) instead of a centred card. */
  compact?: boolean;
  className?: string;
}) {
  if (compact) {
    return (
      <div className={cn('card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6', className)}>
        <div className="flex items-start gap-3">
          <span className="inline-flex shrink-0 rounded-lg bg-accent/10 p-2.5 text-brand-700 dark:text-brand-300">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-sans text-base font-bold normal-case tracking-normal">{title}</h2>
            <p className="mt-0.5 text-sm text-ink/70">{text}</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link href={withNext('/login', next)} className="btn-primary px-4 py-2 text-sm">
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Sign in
          </Link>
          <Link href={withNext('/signup', next)} className="btn-secondary px-4 py-2 text-sm">
            Create account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('mx-auto max-w-xl', className)}>
      <div className="card p-7 text-center sm:p-10">
        <span className="mx-auto inline-flex rounded-lg bg-accent p-4 text-white">
          <Icon className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-sans text-2xl font-bold normal-case tracking-normal sm:text-3xl">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink/70 sm:text-base">{text}</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={withNext('/login', next)} className="btn-primary">
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Sign in
          </Link>
          <Link href={withNext('/signup', next)} className="btn-secondary">
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Create a free account
          </Link>
        </div>
      </div>
    </div>
  );
}
