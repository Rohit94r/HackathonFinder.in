'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Flame, Sparkles, Trophy, Users, Zap } from 'lucide-react';
import { PHOTOS } from './photos';
import { cn } from '@/lib/cn';

export function StudentGallerySection() {
  const cards = [
    {
      photo: PHOTOS.teamLaptops,
      tag: 'Collaborative Sprints',
      title: 'Form Your Dream Squad',
      desc: 'Connect with frontend, AI engineers and designers to build full-stack projects in 24–48 hours.',
      badge: '450+ Teams Formed',
      icon: Users,
    },
    {
      photo: PHOTOS.demoHall,
      tag: 'Demo Day & Pitching',
      title: 'Pitch to VCs & Tech Leads',
      desc: 'Present your working prototype directly to industry judges, investors, and hiring recruiters.',
      badge: '₹50L+ Total Prizes',
      icon: Trophy,
    },
    {
      photo: PHOTOS.codingContest,
      tag: 'Focused Building',
      title: 'Learn by Shipping Real Code',
      desc: 'Build practical applications, integrate modern APIs, and solve actual industry problem statements.',
      badge: '100% Student-Friendly',
      icon: Flame,
    },
    {
      photo: PHOTOS.collegeGroupProject,
      tag: 'Campus Communities',
      title: 'Represent Your University',
      desc: 'Compete in national college tech fests from IITs, NITs, BITS, and premier engineering institutes.',
      badge: '20+ Tech Hubs',
      icon: Zap,
    },
  ];

  return (
    <section className="relative overflow-hidden py-16 sm:py-24 bg-slate-50/70 dark:bg-zinc-900/40 border-y border-slate-200/70 dark:border-zinc-800">
      {/* Box lining in background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-box-grid opacity-60"
      />

      <div className="container-page relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-950/40 px-3.5 py-1 text-xs font-semibold text-accent border border-red-200 dark:border-red-900/40 mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>The Student Experience</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            From Sleepless Sprints to Demo Day Wins
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-zinc-400">
            Hackathons are where college developers build real projects, gain mentorship, and land fast-track interview opportunities.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:border-red-200 hover:shadow-xl hover:shadow-red-500/5 transition duration-200"
              >
                {/* Photo with gradient backdrop */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-zinc-800">
                  <Image
                    src={item.photo.src}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                  
                  {/* Floating badge */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/90 backdrop-blur-md px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                      <Icon className="h-3 w-3" />
                      {item.badge}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-red-200">
                      {item.tag}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-accent transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed flex-1">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Squad CTA */}
        <div className="mt-10 text-center">
          <Link
            href="/teams"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-100 hover:border-accent hover:text-accent shadow-sm transition"
          >
            <Users className="h-4 w-4 text-accent" />
            <span>Find Teammates on the Team Finder</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
