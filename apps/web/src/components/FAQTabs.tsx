'use client';

import { useState } from 'react';
import { ChevronRight, GraduationCap, Megaphone, type LucideIcon } from 'lucide-react';
import type { FaqItem } from '@/data/faqData';
import { cn } from '@/lib/cn';

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
  items: FaqItem[];
}

export default function FAQTabs({ students, organizers }: { students: FaqItem[]; organizers: FaqItem[] }) {
  const tabs: Tab[] = [
    { id: 'students', label: 'Students', icon: GraduationCap, items: students },
    { id: 'organizers', label: 'Organizers', icon: Megaphone, items: organizers },
  ];
  const [active, setActive] = useState(tabs[0].id);
  const [open, setOpen] = useState<string | null>(`${tabs[0].id}-0`);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
      <div>
        <h2 className="mb-8 text-6xl sm:text-7xl">FAQs</h2>
        <div role="tablist" aria-label="FAQ topics" className="flex flex-col gap-3">
          {tabs.map((tab) => {
            const isActive = tab.id === active;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setActive(tab.id);
                  setOpen(`${tab.id}-0`);
                }}
                className={cn(
                  'flex items-center gap-3 rounded-[14px] border-2 px-5 py-4 text-left text-lg font-semibold uppercase transition',
                  isActive ? 'border-ink bg-ink text-surface' : 'border-ink/15 bg-white text-ink hover:border-ink'
                )}
              >
                <tab.icon className="h-6 w-6" />
                <span className="flex-1">{tab.label}</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            );
          })}
        </div>
      </div>

      <div role="tabpanel" className="divide-y divide-ink/15 border-y border-ink/15">
        {current.items.map((item, i) => {
          const key = `${current.id}-${i}`;
          const isOpen = open === key;
          return (
            <div key={key}>
              <h3>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : key)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${key}`}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left text-lg font-semibold text-ink"
                >
                  {item.q}
                  <span className="relative h-5 w-5 shrink-0" aria-hidden="true">
                    <span className="absolute left-0 top-1/2 h-[3px] w-5 -translate-y-1/2 rounded bg-ink" />
                    <span
                      className={cn(
                        'absolute left-1/2 top-0 h-5 w-[3px] -translate-x-1/2 rounded bg-ink transition-transform',
                        isOpen && 'scale-y-0'
                      )}
                    />
                  </span>
                </button>
              </h3>
              <div id={`faq-panel-${key}`} hidden={!isOpen} className="pb-6 pr-10 text-base leading-7 text-ink/75">
                {item.a}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
