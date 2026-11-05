import Link from 'next/link';
import { ArrowLeft, ArrowRight, Code2, ExternalLink, Gift, MapPin, Users } from 'lucide-react';
import { cityName } from '@hackathonfinder/shared';
import Avatar from '@/components/Avatar';
import EventArt from '@/components/hackathon/EventArt';
import HackathonCard from '@/components/hackathon/HackathonCard';
import ShareButtons from '@/components/hackathon/ShareButtons';
import { authorHref } from '@/components/community/model';
import { RESULT_LABELS } from '@/data/people';
import { SECTION_TITLES, paragraphs, postedLabel, resultLine } from '@/data/wins';
import type { HackathonView } from '@/lib/hackathons';
import { cn } from '@/lib/cn';
import CheerButton from './CheerButton';
import { RESULT_ICONS } from './ResultBadge';
import WinCard from './WinCard';
import WinOwnerActions from './WinOwnerActions';
import { daysBetween, type WinItem } from './model';

const BANNER: Record<WinItem['result'], string> = {
  winner: 'bg-accent text-white',
  'runner-up': 'bg-white text-navy',
  finalist: 'bg-brand-600 text-white',
};

function SideCard({ title, icon: Icon, children }: { title: string; icon: typeof Users; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="mb-3 flex items-center gap-2 font-sans text-sm font-semibold normal-case tracking-normal text-ink">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {title}
      </h2>
      {children}
    </section>
  );
}

/** A winning story, laid out like a blog post. */
export default function WinArticle({
  story,
  listing,
  more,
  now,
  canManage = false,
}: {
  story: WinItem;
  listing?: HackathonView | null;
  more: WinItem[];
  /** Server time, for "3 days ago". */
  now: string;
  /** The author or an admin: show edit and delete. */
  canManage?: boolean;
}) {
  const author = story.author;
  const href = authorHref(author, story.mine);
  const ResultIcon = RESULT_ICONS[story.result];

  return (
    <article>
      <header className="bg-surface">
        <div className="container-page max-w-5xl pb-10 pt-8">
          <Link href="/wins" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            All winning stories
          </Link>
          <p className="flex flex-wrap items-center gap-x-2 text-xs font-semibold uppercase tracking-wider text-ink">
            {story.hackathon}
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {cityName(story.city)}
            </span>
          </p>
          <h1 className="mt-3 break-words font-sans text-3xl font-semibold leading-tight sm:text-4xl">{story.projectName}</h1>
          <p className="mt-4 max-w-3xl text-lg text-ink/70">{story.tagline}</p>
          <p className="mt-5 flex items-center gap-2 text-sm text-ink/60">
            <Avatar name={author.name} image={author.image} size="sm" />
            <span>
              By{' '}
              {href ? (
                <Link href={href} className="font-semibold text-ink hover:underline">
                  {author.name}
                </Link>
              ) : (
                <span className="font-semibold text-ink/70">{author.name}</span>
              )}{' '}
              · {postedLabel(daysBetween(story.createdAt, now))}
            </span>
          </p>
          {story.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={story.coverUrl} alt={`${story.projectName} cover`} className="mt-8 h-56 w-full rounded-xl object-cover sm:h-72" />
          ) : (
            <EventArt
              theme={story.themes[0] ?? 'open-innovation'}
              title={story.projectName}
              label={RESULT_LABELS[story.result]}
              size="hero"
              className="mt-8 h-56 rounded-xl"
            />
          )}
          <div className={cn('mt-4 flex flex-col gap-3 rounded-xl px-5 py-4 sm:flex-row sm:items-center sm:justify-between', BANNER[story.result])}>
            <p className="flex items-center gap-3 font-display text-xl font-bold leading-tight sm:text-2xl">
              <ResultIcon className="h-7 w-7 shrink-0" aria-hidden="true" />
              {resultLine(story)}
            </p>
            {story.prize && (
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Gift className="h-4 w-4 shrink-0" aria-hidden="true" />
                {story.prize}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="container-page grid max-w-5xl grid-cols-1 gap-10 pb-16 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <div className="prose-hf break-words">
            {SECTION_TITLES.map(({ key, title }) =>
              story.sections[key] ? (
                <section key={key}>
                  <h2>{title}</h2>
                  {paragraphs(story.sections[key]).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </section>
              ) : null
            )}
          </div>

          <div className="mt-10 flex flex-col gap-4 rounded-xl border border-ink/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-ink">Liked this story?</p>
              <p className="text-sm text-ink/60">Cheer for the team, or send it to a friend.</p>
            </div>
            <CheerButton slug={story.slug} cheers={story.cheers} cheered={story.cheered} title={story.projectName} size="lg" className="self-start sm:self-auto" />
          </div>
          <div className="mt-4">
            <ShareButtons title={`${story.projectName}: ${resultLine(story)}`} path={`/wins/${story.slug}`} />
          </div>

          {listing && (
            <section className="mt-12">
              <h2 className="mb-4 font-sans text-xl font-bold normal-case tracking-normal">The hackathon</h2>
              <HackathonCard h={listing} className="max-w-sm" />
            </section>
          )}
        </div>

        <aside className="min-w-0 space-y-5" aria-label="About this project">
          {canManage && <WinOwnerActions slug={story.slug} title={story.projectName} mine={story.mine} />}

          <section className="card p-5">
            <h2 className="sr-only">Written by</h2>
            <div className="flex items-center gap-3">
              <Avatar name={author.name} image={author.image} size="lg" />
              <div className="min-w-0">
                {href ? (
                  <Link href={href} className="font-semibold text-ink hover:underline">
                    {author.name}
                  </Link>
                ) : (
                  <p className="font-semibold text-ink/70">{author.name}</p>
                )}
                {author.about && <p className="text-xs text-ink/60">{author.about}</p>}
                {author.college && <p className="text-xs text-ink/60">{author.college}</p>}
              </div>
            </div>
            {href && (
              <Link href={href} className="btn-secondary mt-4 w-full py-2 text-sm">
                {story.mine ? 'Your profile' : 'View profile'}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
          </section>

          {story.techStack.length > 0 && (
            <SideCard title="Tech stack" icon={Code2}>
              <ul className="flex flex-wrap gap-1.5">
                {story.techStack.map((t) => (
                  <li key={t} className="rounded-md bg-ink/5 px-2 py-1 text-xs font-medium text-ink/80">
                    {t}
                  </li>
                ))}
              </ul>
            </SideCard>
          )}

          {story.team.length > 0 && (
            <SideCard title={`Team of ${story.team.length}`} icon={Users}>
              <ul className="space-y-2">
                {story.team.map((name, i) => (
                  <li key={`${name}-${i}`} className="flex items-center gap-2 text-sm">
                    <Avatar name={name} image={i === 0 ? author.image : undefined} size="sm" />
                    {i === 0 && href ? (
                      <Link href={href} className="font-medium text-ink hover:underline">
                        {name}
                      </Link>
                    ) : (
                      <span className="text-ink/80">{name}</span>
                    )}
                  </li>
                ))}
              </ul>
            </SideCard>
          )}

          {(story.links.demo || story.links.github) && (
            <SideCard title="Links" icon={ExternalLink}>
              <div className="flex flex-col gap-2">
                {story.links.demo && (
                  <a href={story.links.demo} target="_blank" rel="noopener noreferrer nofollow ugc" className="chip justify-center">
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    Try the demo
                  </a>
                )}
                {story.links.github && (
                  <a href={story.links.github} target="_blank" rel="noopener noreferrer nofollow ugc" className="chip justify-center">
                    <Code2 className="h-4 w-4" aria-hidden="true" />
                    See the code
                  </a>
                )}
              </div>
            </SideCard>
          )}
        </aside>
      </div>

      <section className="border-t border-ink/10 bg-surface py-14">
        <div className="container-page max-w-6xl">
          {more.length > 0 && (
            <>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <h2 className="font-sans text-2xl font-bold normal-case tracking-normal">More winning stories</h2>
                <Link href="/wins" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:underline">
                  See all
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {more.map((s) => (
                  <WinCard key={s.id} story={s} now={now} />
                ))}
              </div>
            </>
          )}

          <div className={cn('on-dark overflow-hidden rounded-xl bg-ink p-8 text-center sm:p-10', more.length > 0 && 'mt-12')}>
            <h2 className="text-3xl text-surface">Won something?</h2>
            <p className="mx-auto mt-3 max-w-md text-surface/80">
              Finals count too. Share what you built and what the judges liked, so the next team learns from it.
            </p>
            <Link href="/wins?share=1" className="btn-lime mt-6">
              Share your win
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
