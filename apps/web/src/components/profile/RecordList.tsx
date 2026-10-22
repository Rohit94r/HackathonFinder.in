import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ResultBadge from '@/components/wins/ResultBadge';
import { monthYear, type ProfileRecord } from './profileTypes';

/**
 * Hackathon history, newest first. `storyLinks` maps a record id to its winning story's
 * slug; `actions` adds buttons to each entry (the student's own profile).
 */
export default function RecordList({
  record,
  storyLinks = {},
  actions,
}: {
  record: ProfileRecord[];
  storyLinks?: Record<string, string>;
  actions?: (entry: ProfileRecord) => React.ReactNode;
}) {
  const sorted = [...record].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <ol className="relative space-y-4 border-l-2 border-ink/10 pl-5">
      {sorted.map((r) => (
        <li key={r.id} className="relative">
          <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full bg-card ring-2 ring-accent" aria-hidden="true" />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="font-semibold leading-snug text-ink">
                {r.hackathonSlug ? (
                  <Link href={`/hackathons/${r.hackathonSlug}`} className="hover:underline">
                    {r.event}
                  </Link>
                ) : (
                  r.event
                )}
              </p>
              <p className="mt-0.5 text-sm text-ink/70">
                {r.project ? (
                  <>
                    Built <span className="font-medium text-ink">{r.project}</span> ·{' '}
                  </>
                ) : null}
                <time dateTime={r.date}>{monthYear(r.date)}</time>
              </p>
              {storyLinks[r.id] && (
                <Link
                  href={`/wins/${storyLinks[r.id]}`}
                  className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300"
                >
                  Read the story
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2 self-start">
              <ResultBadge result={r.result} />
              {actions?.(r)}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
