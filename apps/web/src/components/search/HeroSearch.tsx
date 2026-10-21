'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Sparkles } from 'lucide-react';
import { parseSmartQuery } from '@/lib/smartSearch';
import { toQueryString } from '@/lib/filters';

const EXAMPLES = [
  'Free AI hackathon in Pune for students',
  'Online web3 hackathon with big prizes',
  'Beginner hackathon this month, team of 3',
  'Women-only hackathon in Pune',
  'Solo coding contest this week',
];

const QUICK = [
  { label: 'Closing soon', query: 'closing soon' },
  { label: 'Online', query: 'online' },
  { label: 'Pune', query: 'pune' },
  { label: 'AI / ML', query: 'ai' },
  { label: 'Beginner-friendly', query: 'beginner' },
  { label: 'Free', query: 'free' },
  { label: 'Web3', query: 'web3' },
];

export default function HeroSearch() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [exampleIndex, setExampleIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setExampleIndex((i) => (i + 1) % EXAMPLES.length), 3500);
    return () => clearInterval(id);
  }, []);

  const parsed = useMemo(() => (value.trim() ? parseSmartQuery(value) : null), [value]);

  const go = (text: string) => {
    const { filters } = parseSmartQuery(text);
    router.push(`/hackathons${toQueryString(filters)}`);
  };

  return (
    <div className="w-full max-w-3xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(value || EXAMPLES[exampleIndex]);
        }}
        className="flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-glow sm:flex-row sm:items-center"
        role="search"
      >
        <label htmlFor="hero-search" className="sr-only">
          Describe the hackathon you want
        </label>
        <div className="flex flex-1 items-center gap-3 px-3">
          <Sparkles className="h-5 w-5 shrink-0 text-ink" />
          <input
            id="hero-search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`Try: "${EXAMPLES[exampleIndex]}"`}
            className="w-full bg-transparent py-3 text-base text-ink placeholder:text-ink/45 focus:outline-none"
            autoComplete="off"
          />
        </div>
        <button type="submit" className="btn-primary h-12 px-6 text-base">
          <Search className="h-5 w-5" />
          Find hackathons
        </button>
      </form>

      <div className="mt-3 min-h-[28px]">
        {parsed && parsed.understood.length > 0 ? (
          <p className="flex flex-wrap items-center justify-center gap-1.5 text-sm text-surface/80">
            <span className="text-surface/60">We understood:</span>
            {parsed.understood.map((u) => (
              <span key={u} className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-lime">
                {u}
              </span>
            ))}
            {parsed.filters.q && (
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white">
                “{parsed.filters.q}”
              </span>
            )}
          </p>
        ) : (
          <div className="flex flex-wrap justify-center gap-2">
            {QUICK.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => go(q.query)}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-medium text-surface/90 transition hover:border-white hover:text-white"
              >
                {q.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
