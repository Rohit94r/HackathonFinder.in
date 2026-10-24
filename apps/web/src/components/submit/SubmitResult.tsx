'use client';

import Link from 'next/link';
import { CheckCircle2, Copy } from 'lucide-react';

/** What POST /api/submissions answers. */
export interface SubmitResponse {
  id?: string;
  status: 'pending' | 'duplicate';
  hackathonSlug?: string;
}

/** The thank-you card after a share or organizer submission, including the "we already have it" case. */
export default function SubmitResult({
  result,
  what,
  title,
  email,
  signedIn,
  onAgain,
  againLabel,
}: {
  result: SubmitResponse;
  /** "poster", "link", "message" or "details". */
  what: string;
  title?: string;
  email?: string;
  signedIn: boolean;
  onAgain: () => void;
  againLabel: string;
}) {
  const duplicate = result.status === 'duplicate';
  // Organizer details for a listed event are still kept (they get an id) so the team can update it.
  const keptForUpdate = duplicate && Boolean(result.id);
  const tell = signedIn ? ' We’ll let you know in your notifications when it’s live' : '';
  const byEmail = email ? `${tell ? ', and' : ' We’ll'} email ${email}` : '';

  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center" role="status">
      {duplicate ? <Copy className="mb-4 h-14 w-14 text-ink" /> : <CheckCircle2 className="mb-4 h-14 w-14 text-accent" />}
      <h2 className="text-3xl">
        {duplicate ? 'We already have this one' : title ? `Thanks! We’ve got “${title}”.` : 'Thanks for sharing!'}
      </h2>
      <p className="mt-3 max-w-md text-ink/70">
        {keptForUpdate
          ? 'It’s already listed, so we’ve passed your details to our team to update the listing.'
          : duplicate
            ? result.hackathonSlug
              ? 'Someone beat you to it, and it’s already live. Thanks for looking out for other students!'
              : 'Someone shared it in the last day and it’s waiting for our team. Thanks for looking out!'
            : `Our agents read the ${what} and fill in the dates, place and deadline. Our team checks it before it goes live.${tell}${byEmail}${tell || byEmail ? '.' : ''}`}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={onAgain} className="btn-secondary">
          {againLabel}
        </button>
        {result.hackathonSlug ? (
          <Link href={`/hackathons/${result.hackathonSlug}`} className="btn-primary">
            See the listing
          </Link>
        ) : (
          <Link href="/near-me" className="btn-primary">
            Hackathons near me
          </Link>
        )}
      </div>
    </div>
  );
}
