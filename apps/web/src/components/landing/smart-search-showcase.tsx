'use client';

import Link from 'next/link';
import { ArrowRight, Check, Filter, Search, Sparkles } from 'lucide-react';
import { SmartSearchInput } from './smart-search-input';
import { cn } from '@/lib/cn';

export interface PosterData {
  slug: string;
  title: string;
  theme?: string;
  source?: string;
  when: string;
  where: string;
  imageUrl?: string;
}

interface SmartSearchShowcaseProps {
  posters?: PosterData[];
  example: {
    query: string;
    understood: string[];
    matches: number;
  };
}

export function SmartSearchShowcase({ example }: SmartSearchShowcaseProps) {
  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-white via-red-50/20 to-white dark:from-zinc-950 dark:via-zinc-900/40 dark:to-zinc-950">
      <div className="container-page">
        <div className="max-w-4xl mx-auto rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 sm:p-12 shadow-xl shadow-red-500/5">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-950/40 px-3.5 py-1 text-xs font-semibold text-accent border border-red-200 dark:border-red-900/40 mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Natural Language Search</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Type What You Want. We Parse the Rest.
            </h2>
            
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-zinc-400">
              No need to wrestle with 10 different dropdowns. Just type your criteria naturally.
            </p>
          </div>

          {/* Search Box */}
          <div className="mt-8">
            <SmartSearchInput variant="showcase" placeholderPrefix="Try searching:" />
          </div>

          {/* Understood Example breakdown */}
          <div className="mt-8 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 p-5 sm:p-6 border border-slate-200/80 dark:border-zinc-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                  Example Live Query
                </p>
                <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white mt-0.5">
                  &ldquo;{example.query}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="inline-flex items-center gap-1 rounded-full bg-accent text-white px-3 py-1 text-xs font-bold shadow-sm">
                  {example.matches} Events Matched
                </span>
              </div>
            </div>

            {example.understood && example.understood.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-zinc-700/80">
                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mb-2">
                  Recognized filters applied:
                </p>
                <div className="flex flex-wrap gap-2">
                  {example.understood.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2.5 py-1 text-xs font-medium text-slate-800 dark:text-zinc-200"
                    >
                      <Check className="h-3 w-3 text-accent" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
