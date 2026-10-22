'use client';

import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useSaved } from '@/lib/useSaved';
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
  const Icon = isSaved ? BookmarkCheck : Bookmark;

  const onClick = (e: React.MouseEvent) => {
    // Cards are links; keep the click on the button.
    e.preventDefault();
    e.stopPropagation();
    toggle(slug, title);
  };

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={isSaved}
        className={cn(isSaved ? 'btn-secondary border-ink text-ink' : 'btn-secondary', className)}
      >
        <Icon className="h-4 w-4" />
        {isSaved ? 'Saved to My hackathons' : 'Save'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSaved}
      aria-label={isSaved ? `Remove ${title} from My hackathons` : `Save ${title}`}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:scale-105',
        isSaved ? 'text-accent' : 'text-navy/70',
        className
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
