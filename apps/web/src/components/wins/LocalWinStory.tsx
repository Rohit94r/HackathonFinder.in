'use client';

import Link from 'next/link';
import { Trophy } from 'lucide-react';
import type { HackathonView } from '@/lib/hackathons';
import WinArticle from './WinArticle';
import { useMyWins } from './useWins';

/** A story posted in this browser. It only exists in localStorage, so it is looked up after mount. */
export default function LocalWinStory({ id, listings }: { id: string; listings: HackathonView[] }) {
  const { stories, now, ready } = useMyWins();

  if (!ready) {
    return (
      <div className="container-page max-w-5xl py-10" aria-busy="true" aria-label="Loading the story">
        <div className="h-6 w-40 animate-pulse rounded bg-ink/10" />
        <div className="mt-6 h-12 w-2/3 animate-pulse rounded bg-ink/10" />
        <div className="mt-8 h-56 animate-pulse rounded-lg bg-ink/10" />
      </div>
    );
  }

  const story = stories.find((s) => s.id === id);

  if (!story) {
    return (
      <div className="container-page max-w-3xl py-16">
        <div className="card flex flex-col items-center px-6 py-16 text-center">
          <span className="mb-4 rounded-lg bg-ink/5 p-4 text-ink">
            <Trophy className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="font-sans text-2xl font-bold normal-case tracking-normal">We can’t find this story</h1>
          <p className="mt-2 max-w-md text-sm text-ink/70">
            Stories are saved in the browser they were posted from until accounts launch. It may have been deleted, or
            posted on another phone or laptop.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/wins" className="btn-primary">
              See all winning stories
            </Link>
            <Link href="/wins?share=1" className="btn-secondary">
              Share your win
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const listing = story.hackathonSlug ? listings.find((h) => h.slug === story.hackathonSlug) : undefined;
  return <WinArticle story={story} listing={listing} more={stories.filter((s) => s.id !== story.id).slice(0, 3)} now={now} canManage />;
}
