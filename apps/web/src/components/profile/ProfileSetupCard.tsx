'use client';

import Link from 'next/link';
import { ArrowRight, Check, UserRoundPen } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { useMe, type Me } from '@/lib/useMe';
import { cn } from '@/lib/cn';

/** What a profile still needs before teammates can judge an invite or request. */
export function missingProfileParts(me: Pick<Me, 'onboarded' | 'image' | 'college' | 'about' | 'city' | 'skills'>) {
  return [
    { key: 'photo', label: 'Photo', done: Boolean(me.image) },
    { key: 'college', label: 'College', done: Boolean(me.college) },
    { key: 'year', label: 'Year and branch', done: Boolean(me.about) },
    { key: 'city', label: 'City', done: Boolean(me.city) },
    { key: 'skills', label: 'Skills', done: me.skills.length > 0 },
  ];
}

export function profileIncomplete(me: Parameters<typeof missingProfileParts>[0]): boolean {
  return !me.onboarded || missingProfileParts(me).some((p) => !p.done);
}

/**
 * "Finish your profile": shown to signed-in students whose profile is missing a photo,
 * college, year, city or skills. Hidden for everyone else.
 */
export default function ProfileSetupCard({
  next,
  onEdit,
  className,
}: {
  /** Where to come back to after saving, e.g. "/teams". */
  next?: string;
  /** Open the form in place instead of going to /profile. */
  onEdit?: () => void;
  className?: string;
}) {
  const { me, ready } = useMe();
  if (!ready || !me || !profileIncomplete(me)) return null;

  const parts = missingProfileParts(me);
  const done = parts.filter((p) => p.done).length;
  const href = `/profile?${me.onboarded ? 'edit=1&' : ''}${next ? `next=${encodeURIComponent(next)}` : ''}`.replace(/[?&]$/, '');
  const cta = me.onboarded ? 'Finish my profile' : 'Set up my profile';

  return (
    <section className={cn('card flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6', className)} aria-labelledby="profile-setup-title">
      <Avatar name={me.name || 'You'} image={me.image} size="lg" className="ring-0" />
      <div className="min-w-0 flex-1">
        <h2 id="profile-setup-title" className="font-sans text-lg font-bold normal-case tracking-normal">
          {me.onboarded ? 'Finish your profile to team up' : 'Set up your profile to team up'}
        </h2>
        <p className="mt-1 text-sm text-ink/70">
          Students decide on invites and join requests by your profile. Add a photo, your college and your skills so they know who
          you are.
        </p>
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={`${done} of ${parts.length} done`}>
          {parts.map((p) => (
            <li
              key={p.key}
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold',
                p.done ? 'bg-ink/[0.06] text-ink/60 line-through decoration-ink/30' : 'bg-accent/10 text-brand-700 dark:text-brand-300'
              )}
            >
              {p.done && <Check className="h-3 w-3" aria-hidden="true" />}
              {p.label}
              <span className="sr-only">{p.done ? ' (done)' : ' (missing)'}</span>
            </li>
          ))}
        </ul>
      </div>
      {onEdit ? (
        <button type="button" onClick={onEdit} className="btn-primary shrink-0 py-2.5 text-sm">
          <UserRoundPen className="h-4 w-4" aria-hidden="true" />
          {cta}
        </button>
      ) : (
        <Link href={href} className="btn-primary shrink-0 py-2.5 text-sm">
          {cta}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}
