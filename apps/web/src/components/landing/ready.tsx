'use client';

import Link from 'next/link';
import { ArrowRight, Compass, Plus, Sparkles, Users } from 'lucide-react';

export function ReadySection() {
  return (
    <section className="py-16 sm:py-24 bg-white dark:bg-zinc-950">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-3xl bg-accent px-6 py-14 sm:px-12 sm:py-20 text-center shadow-2xl">
          {/* Subtle background circles for depth */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-black/10 blur-2xl"
          />

          <div className="relative z-10 max-w-2xl mx-auto text-white">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-3.5 py-1 text-xs font-bold text-white mb-4">
              <Sparkles className="h-3.5 w-3.5" /> Start Building Today
            </span>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Ready to Win Your Next Hackathon?
            </h2>

            <p className="mt-4 text-base sm:text-lg text-white/90 leading-relaxed">
              Explore 100+ active competitions, find teammates with the skills you need, and kickstart your developer journey.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/hackathons"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-accent shadow-lg transition hover:bg-slate-50 hover:shadow-xl active:scale-[0.98]"
              >
                <Compass className="h-4 w-4" />
                <span>Explore Hackathons</span>
              </Link>

              <Link
                href="/teams"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-white/40 bg-transparent px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/15"
              >
                <Users className="h-4 w-4" />
                <span>Find Teammates</span>
              </Link>

              <Link
                href="/submit"
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/25"
              >
                <Plus className="h-4 w-4" />
                <span>Post an Event</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
