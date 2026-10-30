'use client';

import Link from 'next/link';
import { ChevronRight, Flame, MapPin, ShieldCheck, Sparkles, Trophy, Users } from 'lucide-react';
import { SmartSearchInput } from './smart-search-input';
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
    <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28">
      {/* Box lining background (Grid lines pattern) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-box-grid box-grid-mask"
      />
      
      {/* Red ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 ambient-red-glow"
      />

      <div className="container-page relative z-10">
        {/* Top Announcement Badge */}
        <div className="flex justify-center">
          <Link
            href="/hackathons?status=closing-soon"
            className="group inline-flex items-center gap-2 rounded-full border border-red-200/80 dark:border-red-900/40 bg-white/90 dark:bg-zinc-900/90 px-3.5 py-1.5 text-xs font-semibold text-accent transition hover:border-accent hover:bg-red-50/50 shadow-sm backdrop-blur-sm"
          >
            <span className="flex h-2 w-2 rounded-full bg-accent animate-ping" />
            <span className="text-slate-800 dark:text-zinc-200 font-medium">10+ Hackathons Closing This Week</span>
            <span className="text-accent group-hover:translate-x-0.5 transition-transform flex items-center font-bold">
              View events <ChevronRight className="h-3 w-3 ml-0.5" />
            </span>
          </Link>
        </div>

        {/* Hero Headline */}
        <div className="mx-auto max-w-4xl text-center mt-7">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.08]">
            Find Your Next Hackathon. <br />
            <span className="text-accent underline decoration-red-200/60 dark:decoration-red-900/40 decoration-wavy underline-offset-8">
              Build. Team Up. Win.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-600 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed">
            India&apos;s all-in-one hackathon discovery platform for college students &amp; developers. Verified events
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

          {/* Platform Live Stats Grid */}
          <div className="mt-12 sm:mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 p-4 shadow-sm backdrop-blur-sm hover:border-red-200 transition">
              <div className="flex items-center gap-2 text-accent">
                <Flame className="h-5 w-5" />
                <span className="text-2xl font-bold text-slate-900 dark:text-white">100+</span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 font-medium">Live Open Competitions</p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 p-4 shadow-sm backdrop-blur-sm hover:border-red-200 transition">
              <div className="flex items-center gap-2 text-accent">
                <Trophy className="h-5 w-5" />
                <span className="text-2xl font-bold text-slate-900 dark:text-white">₹50L+</span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 font-medium">Active Prize Pools</p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 p-4 shadow-sm backdrop-blur-sm hover:border-red-200 transition">
              <div className="flex items-center gap-2 text-accent">
                <MapPin className="h-5 w-5" />
                <span className="text-2xl font-bold text-slate-900 dark:text-white">20+</span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 font-medium">Tech Hubs &amp; Online</p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 p-4 shadow-sm backdrop-blur-sm hover:border-red-200 transition">
              <div className="flex items-center gap-2 text-accent">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-2xl font-bold text-slate-900 dark:text-white">100%</span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 font-medium">Verified &amp; Scam-Free</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
