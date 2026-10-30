'use client';

import { CheckCircle2, Database, Globe2, RefreshCw, ShieldCheck } from 'lucide-react';
import { SOURCES } from '@hackathonfinder/shared';

export function SourcesSection() {
  const sourcesList = [
    { name: 'Devfolio', desc: 'India’s top community hackathons' },
    { name: 'Unstop', desc: 'Premier college & corporate ideathons' },
    { name: 'Devpost', desc: 'Global online tech challenges' },
    { name: 'Major League Hacking (MLH)', desc: 'Official student hackathons' },
    { name: 'Luma & Community', desc: 'Founder & builder demo days' },
    { name: 'College Tech Fests', desc: 'IITs, NITs, BITS, and campus fests' },
  ];

  return (
    <section className="py-16 bg-slate-50/70 dark:bg-zinc-900/50 border-y border-slate-200/70 dark:border-zinc-800">
      <div className="container-page">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-950/40 px-3 py-1 text-xs font-semibold text-accent border border-red-200 dark:border-red-900/40 mb-3">
            <Database className="h-3.5 w-3.5" />
            <span>Multi-Source Aggregation</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Aggregated Across India&apos;s Leading Platforms
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-zinc-400">
            Automated crawlers check each platform twice daily so you never miss an application window.
          </p>
        </div>

        {/* Source Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {sourcesList.map((src) => (
            <div
              key={src.name}
              className="flex flex-col items-center justify-center text-center p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:border-red-200 transition"
            >
              <ShieldCheck className="h-5 w-5 text-accent mb-2" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{src.name}</h3>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400 leading-tight">
                {src.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs font-medium text-slate-500 dark:text-zinc-400">
          <RefreshCw className="h-3.5 w-3.5 text-accent animate-spin" style={{ animationDuration: '6s' }} />
          <span>Synchronized every 12 hours with deduplication &amp; status verification</span>
        </div>
      </div>
    </section>
  );
}
