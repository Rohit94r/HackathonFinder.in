'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Award, CheckCircle2, ChevronRight, Compass, Flame, MapPin, Sparkles, Trophy, Users, Zap } from 'lucide-react';
import { SmartSearchInput } from './smart-search-input';
import { PHOTOS } from './photos';
import { cn } from '@/lib/cn';

const QUICK_TAGS = [
  { label: '🤖 AI & GenAI', href: '/hackathons?theme=ai-ml' },
  { label: '🌐 Web3 & Crypto', href: '/hackathons?theme=web3' },
  { label: '💻 100% Online', href: '/hackathons?mode=online' },
  { label: '📍 Bengaluru', href: '/cities/bengaluru' },
  { label: '📍 Delhi NCR', href: '/cities/delhi-ncr' },
  { label: '🆓 Free Entry', href: '/hackathons?fee=free' },
  { label: '🎓 Beginner Friendly', href: '/hackathons?beginner=true' },
];

export function HeroSection({ sourceCount = 10 }: { sourceCount?: number }) {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 lg:pt-18 lg:pb-28">
      {/* Background glow and subtle red tint mesh */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
      >
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#e11d2e] opacity-15 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
        />
      </div>

      <div className="container-page">
        {/* Top Announcement Badge */}
        <div className="flex justify-center">
          <Link
            href="/hackathons?status=closing-soon"
            className="group inline-flex items-center gap-2 rounded-full border border-red-200/80 dark:border-red-900/40 bg-red-50/70 dark:bg-red-950/30 px-3.5 py-1.5 text-xs font-semibold text-accent transition hover:border-accent hover:bg-red-50 shadow-sm"
          >
            <span className="flex h-2 w-2 rounded-full bg-accent animate-ping" />
            <span className="text-slate-800 dark:text-zinc-200">10+ Hackathons Closing This Week</span>
            <span className="text-accent group-hover:translate-x-0.5 transition-transform flex items-center">
              View events <ChevronRight className="h-3 w-3 ml-0.5" />
            </span>
          </Link>
        </div>

        {/* Hero Headline */}
        <div className="mx-auto max-w-4xl text-center mt-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.08]">
            Find Your Next Hackathon. <br />
            <span className="text-accent underline decoration-red-200/60 dark:decoration-red-900/40 decoration-wavy underline-offset-8">
              Build. Team Up. Win.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-600 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed">
            India&apos;s all-in-one hackathon platform for college students &amp; developers. Verified events
            from Devfolio, Unstop, Devpost &amp; campus fests in one clean feed.
          </p>

          {/* Interactive Smart Search Bar */}
          <div className="mt-8 sm:mt-10">
            <SmartSearchInput />

            {/* Quick Category Pills */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
              <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300 mr-1 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-accent" /> Trending:
              </span>
              {QUICK_TAGS.map((tag) => (
                <Link
                  key={tag.label}
                  href={tag.href}
                  className="rounded-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:border-red-200 hover:text-accent hover:bg-red-50/40 transition shadow-sm"
                >
                  {tag.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Key Platform Stats */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm hover:border-red-200 transition">
              <div className="flex items-center gap-2 text-accent">
                <Flame className="h-5 w-5" />
                <span className="text-2xl font-bold text-slate-900 dark:text-white">100+</span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 font-medium">Live Open Hackathons</p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm hover:border-red-200 transition">
              <div className="flex items-center gap-2 text-accent">
                <Trophy className="h-5 w-5" />
                <span className="text-2xl font-bold text-slate-900 dark:text-white">₹50L+</span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 font-medium">Active Prize Pools</p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm hover:border-red-200 transition">
              <div className="flex items-center gap-2 text-accent">
                <MapPin className="h-5 w-5" />
                <span className="text-2xl font-bold text-slate-900 dark:text-white">20+</span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 font-medium">Tech Hubs &amp; Online</p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm hover:border-red-200 transition">
              <div className="flex items-center gap-2 text-accent">
                <Users className="h-5 w-5" />
                <span className="text-2xl font-bold text-slate-900 dark:text-white">100%</span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 font-medium">Verified &amp; Student-Ready</p>
            </div>
          </div>
        </div>

        {/* Student Photo Grid Showcase */}
        <div className="mt-14 sm:mt-18">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 max-w-5xl mx-auto">
            {/* Primary Large Card */}
            <div className="group relative overflow-hidden rounded-3xl border border-slate-200 dark:border-zinc-800 bg-slate-100 md:col-span-7 h-72 sm:h-80 shadow-md">
              <Image
                src={PHOTOS.teamLaptops.src}
                alt="Students collaborating at a hackathon"
                fill
                priority
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-bold text-white shadow-sm">
                  <Flame className="h-3.5 w-3.5" /> 36h Sprint
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white">
                  College Hackathons
                </span>
              </div>
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <p className="text-xs uppercase tracking-wider text-red-200 font-bold">Team Up &amp; Code</p>
                <h3 className="text-xl font-bold mt-1 text-white leading-snug">
                  Build production prototypes with your squad in a single weekend.
                </h3>
              </div>
            </div>

            {/* Right Column Stack */}
            <div className="md:col-span-5 grid grid-rows-2 gap-4 h-72 sm:h-80">
              {/* Top Photo */}
              <div className="group relative overflow-hidden rounded-3xl border border-slate-200 dark:border-zinc-800 bg-slate-100 shadow-md">
                <Image
                  src={PHOTOS.demoHall.src}
                  alt="Pitching project to judges"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-md px-2.5 py-0.5 text-xs font-bold text-slate-900 shadow-sm">
                    <Trophy className="h-3 w-3 text-accent" /> ₹5,00,000 Prizes
                  </span>
                </div>
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <h4 className="text-sm font-bold text-white">Pitch directly to VC judges &amp; hiring leads</h4>
                </div>
              </div>

              {/* Bottom Photo */}
              <div className="group relative overflow-hidden rounded-3xl border border-slate-200 dark:border-zinc-800 bg-slate-100 shadow-md">
                <Image
                  src={PHOTOS.codingContest.src}
                  alt="Student coders solving problems"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                    <Users className="h-3 w-3" /> 450+ Teams Matched
                  </span>
                </div>
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <h4 className="text-sm font-bold text-white">Find frontend, AI &amp; designer teammates easily</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
