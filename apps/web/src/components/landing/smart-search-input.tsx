'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Search } from 'lucide-react';
import { parseSmartQuery } from '@/lib/smartSearch';
import { NEAR_ME_FILTERS, toQueryString } from '@/lib/filters';
import { cn } from '@/lib/cn';

const EXAMPLES = [
  'Free online AI hackathon for students',
  'Offline hackathons in Bengaluru this month',
  'Web3 hackathon with big prizes in Delhi',
  'Beginner-friendly hackathon this weekend',
  'Hackathons in Mumbai with cash prizes',
  'Solo & student coding contests in Pune',
];

interface SmartSearchInputProps {
  className?: string;
  variant?: 'hero' | 'showcase';
  placeholderPrefix?: string;
}

export function SmartSearchInput({
  className,
  variant = 'hero',
  placeholderPrefix = 'e.g.',
}: SmartSearchInputProps) {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [exampleIndex, setExampleIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setExampleIndex((prev) => (prev + 1) % EXAMPLES.length);
    }, 3800);
    return () => clearInterval(id);
  }, []);

  const submit = () => {
    const query = value.trim() || EXAMPLES[exampleIndex];
    const { filters } = parseSmartQuery(query);
    router.push(
      filters.sort === 'nearest'
        ? `/near-me${toQueryString(filters, NEAR_ME_FILTERS)}`
        : `/hackathons${toQueryString(filters)}`
    );
  };

  return (
    <div className={cn('w-full max-w-2xl mx-auto', className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className={cn(
          'group relative flex items-center rounded-2xl bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 transition duration-200',
          'focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15',
          'shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-slate-300 dark:hover:border-zinc-700'
        )}
      >
        <div className="flex items-center pl-4 sm:pl-5 text-slate-400 dark:text-zinc-500">
          <Search className="h-5 w-5 text-accent shrink-0" />
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`${placeholderPrefix} "${EXAMPLES[exampleIndex]}"`}
          className="w-full bg-transparent px-3.5 py-4 text-sm sm:text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none"
        />

        <div className="pr-2 sm:pr-3">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-white transition hover:bg-accent-dark shadow-sm hover:shadow-md"
          >
            <span>Search</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
