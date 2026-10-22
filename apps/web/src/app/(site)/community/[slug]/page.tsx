import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ChevronRight, MapPin } from 'lucide-react';
import { cityName } from '@hackathonfinder/shared';
import Avatar from '@/components/Avatar';
import HackathonCard from '@/components/hackathon/HackathonCard';
import ThreadView from '@/components/community/ThreadView';
import { authorHref, type ThreadItem } from '@/components/community/model';
import { CompactThreadList } from '@/components/community/parts';
import { categoryById, excerpt } from '@/data/discussions';
import { getSessionUser } from '@/server/auth';
import { getThread, moreInCategory } from '@/server/community';
import { getHackathon } from '@/server/hackathons';
import { cn } from '@/lib/cn';

export const dynamic = 'force-dynamic';

const smallHeading = 'font-sans text-base font-bold normal-case leading-tight tracking-normal';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getThread(params.slug, null);
  if (!data) return { title: 'Discussion not found', robots: { index: false } };
  const t = data.thread;
  return {
    title: t.title,
    description: `${categoryById(t.category)?.label ?? 'Community'}: ${excerpt(t.body)}`,
    alternates: { canonical: `/community/${t.slug}` },
  };
}

export default async function ThreadPage({ params }: { params: { slug: string } }) {
  const user = await getSessionUser();
  const data = await getThread(params.slug, user);
  if (!data) notFound();
  const { thread } = data;
  const [listing, more] = await Promise.all([
    thread.hackathonSlug ? getHackathon(thread.hackathonSlug).then((r) => r?.item ?? null) : Promise.resolve(null),
    moreInCategory(thread, user),
  ]);
  const category = categoryById(thread.category);
  const viewer = user ? { id: user.id, handle: user.handle, role: user.role } : null;

  return (
    <section className="bg-surface py-8 sm:py-12">
      <div className="container-page">
        <nav aria-label="Breadcrumb" className="mb-6 flex min-w-0 items-center gap-1.5 text-sm text-ink/60">
          <Link href="/community" className="shrink-0 hover:text-ink hover:underline">
            Community
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <Link href={`/community?category=${thread.category}#discussions`} className="shrink-0 hover:text-ink hover:underline">
            {category?.label}
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <span className="truncate text-ink/80" aria-current="page">
            {thread.title}
          </span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <ThreadView initial={data} viewer={viewer} />

          <aside className="min-w-0 space-y-6" aria-label="About this discussion">
            <AuthorCard thread={thread} />
            {listing && (
              <div>
                <h2 className={cn(smallHeading, 'mb-3')}>About this hackathon</h2>
                <HackathonCard h={listing} />
              </div>
            )}
            <div className="card p-5">
              <h2 className={cn(smallHeading, 'mb-4')}>More in {category?.label}</h2>
              {more.length > 0 ? <CompactThreadList threads={more} now={data.now} /> : <p className="text-sm text-ink/70">Nothing else here yet.</p>}
              <Link
                href={`/community?category=${thread.category}#discussions`}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ink hover:underline"
              >
                See all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function AuthorCard({ thread }: { thread: ThreadItem }) {
  const a = thread.author;
  const href = authorHref(a, thread.mine);
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink/60">Posted by</p>
      <div className="mt-3 flex items-center gap-3">
        <Avatar name={a.name} image={a.image} size="lg" />
        <div className="min-w-0">
          {href ? (
            <Link href={href} className="block truncate font-semibold text-ink hover:underline">
              {a.name}
            </Link>
          ) : (
            <p className="truncate font-semibold text-ink/70">{a.name}</p>
          )}
          {a.id && <p className="truncate text-xs text-ink/60">@{a.handle}</p>}
          {a.about && <p className="mt-0.5 text-xs text-ink/70">{a.about}</p>}
        </div>
      </div>
      {(a.college || a.city) && (
        <div className="mt-4 space-y-1 text-sm text-ink/70">
          {a.college && <p>{a.college}</p>}
          {a.city && (
            <p className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {cityName(a.city)}
            </p>
          )}
        </div>
      )}
      {a.skills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {a.skills.map((s) => (
            <span key={s} className="rounded-md bg-ink/5 px-2 py-0.5 text-xs font-medium text-ink/80">
              {s}
            </span>
          ))}
        </div>
      )}
      {href && (
        <Link href={href} className="btn-secondary mt-5 w-full py-2 text-sm">
          {thread.mine ? 'Your profile' : 'View profile'}
        </Link>
      )}
    </div>
  );
}
