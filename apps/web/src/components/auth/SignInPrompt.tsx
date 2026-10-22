import Link from 'next/link';
import { LogIn, UserPlus, type LucideIcon } from 'lucide-react';
import Sticker from '@/components/art/Sticker';
import { withNext } from './authUtils';

/** Shown on account pages to signed-out visitors: what they get, and the way in. */
export default function SignInPrompt({
  next,
  title,
  text,
  icon: Icon = LogIn,
  sticker = 'Free',
}: {
  next: string;
  title: string;
  text: string;
  icon?: LucideIcon;
  sticker?: string;
}) {
  return (
    <div className="mx-auto max-w-xl">
      <div className="card relative overflow-hidden p-7 text-center sm:p-10">
        <Sticker text={sticker} tone="yellow" className="right-4 top-4 rotate-6" />
        <span className="mx-auto inline-flex rounded-2xl bg-accent p-4 text-white">
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
