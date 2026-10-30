'use client';

import Link from 'next/link';
import { ArrowRight, Calendar, Compass, Flame, MapPin, Sparkles, Trophy, Users } from 'lucide-react';
import { placeName, sourceBySlug, themeName } from '@hackathonfinder/shared';
import EventArt from '@/components/hackathon/EventArt';
import StatusBadge from '@/components/hackathon/StatusBadge';
import SaveButton from '@/components/hackathon/SaveButton';
import { formatDateRange, formatPrizeShort, formatTeamSize } from '@/lib/format';
import type { HackathonView } from '@/lib/hackathons';
import { cn } from '@/lib/cn';

interface ListingsSectionProps {
  items: HackathonView[];
  total: number;
}

export function ListingsSection({ items, total }: ListingsSectionProps) {
  // Show up to 8 top featured or newest items
  const displayItems = items.slice(0, 8);

  return (
    <section className="py-16 sm:py-24 bg-slate-50/60 dark:bg-zinc-900/40 border-y border-slate-200/70 dark:border-zinc-800">
      <div className="container-page">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-950/30 px-3 py-1 text-xs font-semibold text-accent border border-red-200/60 dark:border-red-900/30 mb-3">
              <Flame className="h-3.5 w-3.5" />
              <span>Trending Competitions</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Featured &amp; Upcoming Hackathons
            </h2>
            <p className="mt-2 text-base text-slate-600 dark:text-zinc-400 max-w-2xl">
              Curated hackathons with verified prizes, mentors, and direct recruiter access. Showing a selection from{' '}
              <strong className="text-slate-900 dark:text-white font-semibold">{total} live events</strong>.
            </p>
          </div>

          <Link
            href="/hackathons"
            className="inline-flex items-center gap-2 text-sm font-bold text-accent hover:text-accent-dark transition group self-start md:self-auto"
          >
            <span>Explore all {total} hackathons</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Hackathon Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayItems.map((h) => {
            const source = sourceBySlug(h.sources[0])?.name;
            const location = h.mode === 'online' ? 'Online' : placeName(h);

            return (
              <div
                key={h.slug}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-all duration-200 hover:-translate-y-1 hover:border-red-200 hover:shadow-lg hover:shadow-red-500/5"
              >
                {/* Event Photo / Art */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-zinc-800">
                  <EventArt title={h.title} imageUrl={h.imageUrl} className="h-full w-full object-cover" />
                  
                  {/* Badges on image */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                    <StatusBadge status={h.status} />
                    {h.featured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent text-white px-2.5 py-0.5 text-xs font-bold shadow-sm">
                        <Sparkles className="h-3 w-3" /> Featured
                      </span>
                    )}
                  </div>

                  <SaveButton slug={h.slug} title={h.title} className="absolute top-3 right-3 z-10" />
                </div>

                {/* Card Content */}
                <div className="flex flex-1 flex-col p-5">
                  {/* Organizer & Mode */}
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 mb-2">
                    <span className="truncate font-medium">{h.organizer}</span>
                    <span className="shrink-0 font-semibold text-accent">{location}</span>
                  </div>

                  {/* Title */}
                  <Link href={`/hackathons/${h.slug}`} className="focus:outline-none">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-accent transition-colors">
                      {h.title}
                    </h3>
                  </Link>

                  {/* Metadata Row */}
                  <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{formatDateRange(h.startDate, h.endDate)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-zinc-100">
                        <Trophy className="h-3.5 w-3.5 text-accent shrink-0" />
                        <span>{formatPrizeShort(h.prizePool, h.prizeCurrency)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <Users className="h-3.5 w-3.5" />
                        <span>{formatTeamSize(h.teamMin, h.teamMax, h.teamSizeKnown !== false)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {h.themes.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-zinc-300"
                      >
                        {themeName(t)}
                      </span>
                    ))}
                    {h.fee === 0 && (
                      <span className="rounded-md bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 px-2 py-0.5 text-[11px] font-medium">
                        Free
                      </span>
                    )}
                  </div>

                  {/* Footer Action */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">via {source || 'Web'}</span>
                    <Link
                      href={`/hackathons/${h.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:text-accent-dark"
                    >
                      <span>View Event</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Banner */}
        <div className="mt-12 text-center">
          <Link
            href="/hackathons"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-accent-dark transition"
          >
            <Compass className="h-4 w-4" />
            <span>Browse All {total} Live Hackathons</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
