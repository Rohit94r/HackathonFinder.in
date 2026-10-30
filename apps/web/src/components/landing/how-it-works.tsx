'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Compass, Search, Trophy, Users, Zap } from 'lucide-react';
import type { HackathonView } from '@/lib/hackathons';
import { cn } from '@/lib/cn';

interface HowItWorksProps {
  example?: HackathonView;
}

export function HowItWorksSection({ example }: HowItWorksProps) {
  const steps = [
    {
      num: '01',
      title: 'Discover Every Event',
      desc: 'We monitor 10+ developer portals—including Devfolio, Unstop, Devpost, Luma, and college tech societies—so you find every verified hackathon in one clean feed.',
      icon: Search,
      cta: 'Explore Listings',
      href: '/hackathons',
    },
    {
      num: '02',
      title: 'Match With Teammates',
      desc: 'No team? No problem. Browse student profiles and form your squad. Connect with AI engineers, frontend developers, UI designers, and pitch leaders.',
      icon: Users,
      cta: 'Find Teammates',
      href: '/teams',
    },
    {
      num: '03',
      title: 'Compete & Win Prizes',
      desc: 'Track deadlines with email and WhatsApp reminders. Submit your project, get real mentor feedback, win cash prizes, and showcase verified wins on your profile.',
      icon: Trophy,
      cta: 'View Past Wins',
      href: '/wins',
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-white dark:bg-zinc-950">
      <div className="container-page">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-950/30 px-3 py-1 text-xs font-semibold text-accent border border-red-200/60 dark:border-red-900/30 mb-3">
            <Zap className="h-3.5 w-3.5" />
            <span>Built for Student Builders</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            How HackathonFinder Works
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-zinc-400">
            Spend less time searching multiple websites and more time building prototypes that win.
          </p>
        </div>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 p-8 transition duration-200 hover:-translate-y-1 hover:border-red-200 hover:bg-white dark:hover:bg-zinc-900 hover:shadow-xl hover:shadow-red-500/5"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/40 text-accent transition group-hover:bg-accent group-hover:text-white">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="text-2xl font-black text-slate-300 dark:text-zinc-700">
                      {step.num}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    {step.title}
                  </h3>

                  <p className="text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-200/60 dark:border-zinc-800">
                  <Link
                    href={step.href}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent-dark transition"
                  >
                    <span>{step.cta}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
