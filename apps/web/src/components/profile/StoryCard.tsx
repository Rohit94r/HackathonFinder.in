import Link from 'next/link';
import { Heart, MapPin } from 'lucide-react';
import { cityName } from '@hackathonfinder/shared';
import EventArt from '@/components/hackathon/EventArt';
import ResultBadge from '@/components/wins/ResultBadge';
import { RESULT_LABELS } from '@/data/people';
import { monthYear, type ProfileStory } from './profileTypes';

/** A winning story on a profile. The title link covers the card. */
export default function StoryCard({ story, mine = false }: { story: ProfileStory; mine?: boolean }) {
  return (
    <article className="group card relative flex flex-col overflow-hidden transition duration-200 hover:-translate-y-1 hover:shadow-lift">
      <EventArt theme={story.themes[0] ?? 'open-innovation'} title={story.projectName} label={RESULT_LABELS[story.result]} className="h-28" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <ResultBadge result={story.result} />
          {mine && <span className="rounded bg-pop px-1.5 py-0.5 text-[10px] font-bold uppercase text-navy">You</span>}
        </div>
        <h3 className="mt-3 font-sans text-lg font-bold leading-snug">
          <Link href={`/wins/${story.slug}`} className="after:absolute after:inset-0 after:content-[''] group-hover:underline">
            {story.projectName}
          </Link>
        </h3>
        <p className="mt-1 text-sm font-semibold text-ink/80">{story.hackathon}</p>
        {story.tagline && <p className="mt-2 line-clamp-2 flex-1 text-sm leading-6 text-ink/70">{story.tagline}</p>}
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/60">
          {story.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {cityName(story.city)}
            </span>
          )}
          <span>{monthYear(story.createdAt)}</span>
          <span className="inline-flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" aria-hidden="true" />
            {story.cheers.toLocaleString('en-IN')} {story.cheers === 1 ? 'cheer' : 'cheers'}
          </span>
        </p>
      </div>
    </article>
  );
}
