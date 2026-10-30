'use client';

import Link from 'next/link';
import { Bell, Bookmark, CheckCircle2, Compass, Layers, ShieldCheck, Sparkles, Trophy, Users, Zap } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface LiveStat {
  value: number;
  label: string;
  icon: 'open' | 'closing' | 'cities' | 'sources';
}

interface FeaturesSectionProps {
  stats?: LiveStat[];
}

export function FeaturesSection({ stats }: FeaturesSectionProps) {
  const features = [
    {
      title: 'One Unified Feed',
      description: 'Stop tab-switching between Devfolio, Unstop, Devpost and college WhatsApp groups. Find all verified hackathons in one lightning-fast feed.',
      icon: Layers,
      highlight: '10+ Sources',
    },
    {
      title: 'Student Team Finder',
      description: 'Need a machine learning engineer, full-stack dev, or UI designer? Post your project or browse student profiles looking to squad up.',
      icon: Users,
      highlight: 'Squad Up',
      cta: 'Find Teammates',
      href: '/teams',
    },
    {
      title: 'Scam-Free & Verified',
      description: 'Every single hackathon listing is verified for legitimate organizers, confirmed prize pools, and authentic college or sponsor backing.',
      icon: ShieldCheck,
      highlight: '100% Legit',
    },
    {
      title: 'Deadline Reminders',
      description: 'Save hackathons to your dashboard with one click. Get notified via email and weekly digest before registration periods close.',
      icon: Bell,
      highlight: 'Zero Missed Deadlines',
      cta: 'My Saved Events',
      href: '/saved',
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-white dark:bg-zinc-950">
      <div className="container-page">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-950/40 px-3.5 py-1 text-xs font-semibold text-accent border border-red-200 dark:border-red-900/40 mb-3">
            <Zap className="h-3.5 w-3.5" />
            <span>Developer Advantage</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Everything You Need to Build, Team Up &amp; Win
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-zinc-400">
            HackathonFinder is designed by student builders for student builders. Here is why thousands of hackers rely on us.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 p-8 transition duration-200 hover:-translate-y-1 hover:border-red-200 hover:bg-white dark:hover:bg-zinc-900 hover:shadow-xl hover:shadow-red-500/5"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/40 text-accent transition group-hover:bg-accent group-hover:text-white">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="rounded-full bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 px-3 py-1 text-xs font-bold text-accent">
                      {feature.highlight}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>

                  <p className="text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                    {feature.description}
                  </p>
                </div>

                {feature.cta && feature.href && (
                  <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-zinc-800">
                    <Link
                      href={feature.href}
                      className="text-xs font-bold text-accent hover:text-accent-dark transition"
                    >
                      {feature.cta} &rarr;
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
