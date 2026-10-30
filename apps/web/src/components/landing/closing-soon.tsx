'use client';

import Link from 'next/link';
import { ArrowRight, Clock, Flame, Sparkles } from 'lucide-react';
import EventArt from '@/components/hackathon/EventArt';
import { cn } from '@/lib/cn';

export interface ClosingCardData {
  slug: string;
  title: string;
  tagline: string;
  theme: string;
  featured: boolean;
  badge: string;
  foundOn: string;
  imageUrl?: string;
}

interface ClosingSoonSectionProps {
  events: ClosingCardData[];
}

export function ClosingSoonSection({ events }: ClosingSoonSectionProps) {
  if (!events || events.length === 0) return null;

  return (
    <section className="py-16 sm:py-24 bg-red-50/40 dark:bg-zinc-900/60 border-t border-red-100/80 dark:border-zinc-800">
      <div className="container-page">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-red-100/80 dark:bg-red-950/50 px-3 py-1 text-xs font-bold text-accent border border-red-200 dark:border-red-900/50 mb-3">
              <Clock className="h-3.5 w-3.5 animate-pulse" />
              <span>Urgent Applications</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Closing Soon: Apply This Week
            </h2>
            <p className="mt-2 text-base text-slate-600 dark:text-zinc-400 max-w-2xl">
              Don&apos;t miss out on these hackathons. Applications and registrations are ending within days.
            </p>
          </div>

          <Link
            href="/hackathons?status=closing-soon"
            className="inline-flex items-center gap-2 text-sm font-bold text-accent hover:text-accent-dark transition group self-start md:self-auto"
          >
            <span>View all closing soon</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Closing Soon Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {events.map((event) => (
            <div
              key={event.slug}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-red-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-all duration-200 hover:-translate-y-1 hover:border-accent hover:shadow-lg hover:shadow-red-500/10"
            >
              {/* Event Art with Red Deadline Pill */}
              <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-zinc-800">
                <EventArt title={event.title} imageUrl={event.imageUrl} className="h-full w-full object-cover" />

                {/* Urgent Deadline Badge */}
                <div className="absolute top-3 left-3 z-10">
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent text-white px-3 py-1 text-xs font-bold shadow-md">
                    <Flame className="h-3.5 w-3.5" />
                    {event.badge}
                  </span>
                </div>

                {event.featured && (
                  <div className="absolute top-3 right-3 z-10">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/95 text-slate-900 px-2.5 py-0.5 text-[11px] font-bold shadow-sm">
                      <Sparkles className="h-3 w-3 text-accent" /> Featured
                    </span>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col p-5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-accent mb-1">
                  via {event.foundOn}
                </span>

                <Link href={`/hackathons/${event.slug}`} className="focus:outline-none">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-accent transition-colors">
                    {event.title}
                  </h3>
                </Link>

                <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                  {event.tagline}
                </p>

                <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100 dark:border-zinc-800">
                  <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                    Registration ends soon
                  </span>
                  <Link
                    href={`/hackathons/${event.slug}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-accent-dark transition"
                  >
                    <span>Register</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
