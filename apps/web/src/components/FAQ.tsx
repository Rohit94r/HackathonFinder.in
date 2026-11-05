'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { FaqItem } from '@/data/faqData';
import { cn } from '@/lib/cn';

export default function FAQ({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-ink/15 rounded-lg border border-ink/15 bg-card">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <h3 className="font-sans">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={`faq-${i}`}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-ink hover:bg-surface"
              >
                {item.q}
                <ChevronDown className={cn('h-5 w-5 shrink-0 text-ink/45 transition', isOpen && 'rotate-180 text-ink')} />
              </button>
            </h3>
            <div id={`faq-${i}`} hidden={!isOpen} className="px-5 pb-5 text-sm leading-6 text-ink/70">
              {item.a}
            </div>
          </div>
        );
      })}
    </div>
  );
}
