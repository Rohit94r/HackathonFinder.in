'use client';

import { useState } from 'react';
import { ClipboardList, Share2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import QuickShareForm from './QuickShareForm';
import SubmitForm from './SubmitForm';

export type SubmitAs = 'student' | 'organizer';

const OPTIONS = [
  {
    value: 'student' as const,
    icon: Share2,
    title: 'I spotted one',
    text: 'Saw it on Instagram, WhatsApp, Facebook or LinkedIn? Paste the link or poster. 30 seconds.',
  },
  {
    value: 'organizer' as const,
    icon: ClipboardList,
    title: 'I’m organizing one',
    text: 'Add the full details: dates, venue, team size and prizes. About two minutes.',
  },
];

/** Picks between the quick share for students and the full form for organizers. */
export default function SubmitChooser({ initial }: { initial: SubmitAs }) {
  const [as, setAs] = useState<SubmitAs>(initial);

  return (
    <div>
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={as === o.value}
            onClick={() => setAs(o.value)}
            className={cn(
              'card flex items-start gap-3 p-5 text-left transition',
              as === o.value ? 'ring-2 ring-ink' : 'opacity-75 hover:opacity-100'
            )}
          >
            <span className={cn('rounded-xl p-2.5', as === o.value ? 'bg-ink text-surface' : 'bg-ink/5 text-ink')}>
              <o.icon className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-bold text-ink">{o.title}</span>
              <span className="mt-1 block text-sm text-ink/70">{o.text}</span>
            </span>
          </button>
        ))}
      </div>
      {as === 'student' ? <QuickShareForm /> : <SubmitForm />}
    </div>
  );
}
