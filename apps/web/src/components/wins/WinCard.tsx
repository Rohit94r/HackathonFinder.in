import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { cityName, type ThemeSlug } from '@hackathonfinder/shared';
import Avatar from '@/components/Avatar';
import EventArt from '@/components/hackathon/EventArt';
import { authorHref } from '@/components/community/model';
import { RESULT_LABELS } from '@/data/people';
import { postedLabel, storyAuthor, type WinResult, type WinStory } from '@/data/wins';
import { cn } from '@/lib/cn';
import CheerButton from './CheerButton';
import ResultBadge from './ResultBadge';
import { daysBetween, type WinItem } from './model';

interface CardData {
  slug: string;
  projectName: string;
  hackathon: string;
  tagline: string;
  city?: string;
  result: WinResult;
  theme: ThemeSlug;
  coverUrl?: string;
  posted: string;
  authorName: string;
  authorImage?: string;
  authorHref?: string;
  cheers: number;
  cheered: boolean;
}

function cardData(story: WinItem | WinStory, now: string): CardData {
  if ('slug' in story) {
    return {
      slug: story.slug,
      projectName: story.projectName,
      hackathon: story.hackathon,
      tagline: story.tagline,
      city: story.city,
      result: story.result,
      theme: story.themes[0] ?? 'open-innovation',
      coverUrl: story.coverUrl,
      // Callers that render on the server pass `now`; the clock is a fallback for client-only lists.
      posted: postedLabel(daysBetween(story.createdAt, now || new Date().toISOString())),
      authorName: story.author.name,
      authorImage: story.author.image,
      authorHref: authorHref(story.author, story.mine),
      cheers: story.cheers,
      cheered: story.cheered,
    };
  }
  // A sample story from @/data/wins (still passed by /u/[handle]); its id is the database slug.
  const author = storyAuthor(story);
  return {
    slug: story.id,
    projectName: story.projectName,
    hackathon: story.hackathon,
    tagline: story.tagline,
    city: story.city,
    result: story.result,
    theme: story.themes[0] ?? 'open-innovation',
    posted: postedLabel(story.daysAgo),
    authorName: author.name,
    authorHref: author.href,
    cheers: story.cheers,
    cheered: false,
  };
}

/** Story card. The title link covers the card; the author link and cheer sit above it. */
export default function WinCard({
  story,
  now = '',
  mine = false,
  className,
}: {
  story: WinItem | WinStory;
  /** Server time from the list response, so "3 days ago" matches between server and browser. */
  now?: string;
  mine?: boolean;
  className?: string;
}) {
  const c = cardData(story, now);
  const isMine = mine || ('slug' in story && story.mine);

  return (
    <article
      className={cn(
        'group card relative flex min-w-0 flex-col overflow-hidden transition duration-200 hover:-translate-y-1 hover:shadow-lift',
        className
      )}
    >
      {c.coverUrl ? (
        // Student uploads come from our own storage or Cloudinary, in any size, so a plain img.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.coverUrl} alt="" loading="lazy" className="h-32 w-full object-cover" />
      ) : (
        <EventArt theme={c.theme} title={c.projectName} label={RESULT_LABELS[c.result]} className="h-32" />
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <ResultBadge result={c.result} />
          {isMine && <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">You</span>}
        </div>
        <h3 className="mt-3 break-words font-display text-xl font-bold leading-snug">
          <Link href={`/wins/${c.slug}`} className="after:absolute after:inset-0 after:content-[''] group-hover:underline">
            {c.projectName}
          </Link>
        </h3>
        <p className="mt-1 text-sm font-semibold text-ink/80">{c.hackathon}</p>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-6 text-ink/70">{c.tagline}</p>
        <p className="mt-3 flex items-center gap-1 text-xs text-ink/60">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          {cityName(c.city)}
          {c.posted && <> · {c.posted}</>}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-ink/10 pt-4">
          {c.authorHref ? (
            <Link href={c.authorHref} className="relative z-10 flex min-w-0 items-center gap-2 text-sm font-semibold text-ink hover:underline">
              <Avatar name={c.authorName} image={c.authorImage} size="sm" />
              <span className="truncate">{c.authorName}</span>
            </Link>
          ) : (
            <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-ink/70">
              <Avatar name={c.authorName} size="sm" />
              <span className="truncate">{c.authorName}</span>
            </span>
          )}
          <CheerButton slug={c.slug} cheers={c.cheers} cheered={c.cheered} title={c.projectName} className="relative z-10 shrink-0" />
        </div>
      </div>
    </article>
  );
}
