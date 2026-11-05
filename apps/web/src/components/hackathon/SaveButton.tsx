'use client';

import { Bookmark } from 'lucide-react';
import { useSaved } from '@/lib/useSaved';
import { toast } from '@/components/Toaster';
import { cn } from '@/lib/cn';

interface SaveButtonProps {
  slug: string;
  title: string;
  variant?: 'icon' | 'full';
  className?: string;
}

export default function SaveButton({ slug, title, variant = 'icon', className }: SaveButtonProps) {
  const { saved, toggle } = useSaved();
  const isSaved = Boolean(saved[slug]);

  const onClick = (e: React.MouseEvent) => {
    // Cards are links; keep the click on the button.
    e.preventDefault();
    e.stopPropagation();
    toggle(slug, title);
    if (isSaved) toast('Removed from Saved', { tone: 'info' });
    else toast('Saved to My hackathons', { action: { label: 'View', href: '/saved' } });
  };

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={isSaved}
        className={cn('btn-secondary', isSaved && 'border-accent/40 bg-accent-soft text-brand-700 hover:bg-accent-soft dark:bg-accent/15 dark:text-brand-200', className)}
      >
        <Bookmark className={cn('h-4 w-4', isSaved && 'fill-current')} />
        {isSaved ? 'Saved' : 'Save for later'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSaved}
      aria-label={isSaved ? `Remove ${title} from Saved` : `Save ${title}`}
      title={isSaved ? 'Saved' : 'Save'}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-black/5 bg-white/95 shadow-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        isSaved ? 'text-accent' : 'text-navy/70 hover:text-navy',
        className
      )}
    >
      <Bookmark className={cn('h-4 w-4', isSaved && 'fill-current')} />
    </button>
  );
}
