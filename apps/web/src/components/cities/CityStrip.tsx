'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Handshake, MessageCircle, MessagesSquare, Users } from 'lucide-react';
import { CITIES } from '@hackathonfinder/shared';
import Avatar from '@/components/Avatar';
import DistanceFromYou from '@/components/hackathon/DistanceFromYou';
import type { CitySnapshot } from '@/data/teamPosts';
import { siteConfig } from '@/data/siteConfig';
import { useFollowedCities } from '@/lib/useFollowedCities';
import { FollowCityButton } from './CityParts';

interface CityStripProps {
  slug: string;
  /** Students and open teams in this city, loaded on the server. */
  snapshot: CitySnapshot;
}

function BlockTitle({ icon: Icon, children }: { icon: typeof Users; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
      <Icon className="h-4 w-4 shrink-0" />
      {children}
    </h3>
  );
}

const linkClass = 'mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300';

/** Follow, distance, students, teams and the city group, above a city's listings. */
export default function CityStrip({ slug, snapshot }: CityStripProps) {
  const { ready, toggle, isFollowing } = useFollowedCities();
  const city = CITIES.find((c) => c.slug === slug);
  if (!city) return null;

  const { students, studentTotal, lookingTotal, teamTotal: teams } = snapshot;
  const group = siteConfig.cityGroups[slug];
  const external = Boolean(group?.startsWith('http'));

  return (
    <section aria-label={`${city.name} at a glance`} className="card mb-8 overflow-hidden">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Link href="/cities" className="inline-flex items-center gap-1 text-xs font-semibold text-ink/60 hover:text-ink">
            <ArrowLeft className="h-3.5 w-3.5" />
            All cities
          </Link>
          <h2 className="mt-1 font-sans text-xl font-bold normal-case tracking-normal">
            {city.name}, {city.state}
          </h2>
          <DistanceFromYou point={{ lat: city.lat, lng: city.lng }} />
        </div>
        <FollowCityButton
          variant="full"
          name={city.name}
          following={ready && isFollowing(slug)}
          onToggle={() => toggle(slug)}
          className="self-start sm:self-auto"
        />
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-ink/10 bg-ink/10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card p-5">
          <BlockTitle icon={Users}>Students from {city.name}</BlockTitle>
          {studentTotal > 0 ? (
            <>
              <div className="mt-3 flex -space-x-2">
                {students.map((p) => (
                  <Link key={p.handle} href={`/u/${p.handle}`} title={p.name} className="rounded-full transition hover:-translate-y-0.5">
                    <Avatar name={p.name} size="sm" />
                    <span className="sr-only">{p.name}</span>
                  </Link>
                ))}
                {studentTotal > students.length && (
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink/10 text-[11px] font-bold text-ink ring-2 ring-surface">
                    +{studentTotal - students.length}
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-ink/60">
                {studentTotal} on HackathonFinder · {lookingTotal} looking for a team
              </p>
              {lookingTotal > 0 && (
                <Link href={`/teams?tab=people&city=${slug}`} className={linkClass}>
                  Find teammates here
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-ink/70">
              No one from {city.name} yet.{' '}
              <Link href="/profile" className="font-semibold text-ink underline underline-offset-2">
                Be the first
              </Link>
              .
            </p>
          )}
        </div>

        <div className="bg-card p-5">
          <BlockTitle icon={Handshake}>Teams in {city.name}</BlockTitle>
          <p className="mt-2 text-sm text-ink/70">
            <strong className="font-display text-3xl leading-none text-ink">{teams}</strong>{' '}
            {teams === 1 ? 'team is' : 'teams are'} looking for members
          </p>
          <Link href={`/teams?city=${slug}`} className={linkClass}>
            {teams > 0 ? 'See the teams' : 'Post the first team'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="bg-card p-5">
          <BlockTitle icon={MessageCircle}>{city.name} WhatsApp group</BlockTitle>
          {group ? (
            <>
              <p className="mt-2 text-sm text-ink/70">New hackathons in {city.name}, the day they’re listed.</p>
              <a
                href={group}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="btn-primary mt-3 px-4 py-2 text-sm"
              >
                Join the group
              </a>
            </>
          ) : (
            <>
              <span className="mt-2 inline-flex rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-400/15 dark:text-brand-200">
                Starting soon
              </span>
              <p className="mt-2 text-sm text-ink/70">Until then, follow {city.name} to keep its hackathons on your shortlist.</p>
            </>
          )}
        </div>

        <div className="bg-card p-5">
          <BlockTitle icon={MessagesSquare}>Talk with students</BlockTitle>
          <p className="mt-2 text-sm text-ink/70">Ask about venues, share rides and find people going to the same event.</p>
          <Link href="/community" className={linkClass}>
            Open discussions
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
