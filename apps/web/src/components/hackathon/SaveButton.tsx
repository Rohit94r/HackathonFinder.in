'use client';

import { Bookmark } from 'lucide-react';
import { useSaved } from '@/lib/useSaved';
import { toast } from '@/components/Toaster';
import { cn } from '@/lib/cn';

interface SaveButtonProps {
  slug: string;
  title: string;
  variant?: 'icon' | 'full';
  /** Icon button size: md is 40px on phones (an easy tap) and 36px from sm up; lg is 44px. */
  size?: 'md' | 'lg';
  className?: string;
}

export default function SaveButton({ slug, title, variant = 'icon', size = 'md', className }: SaveButtonProps) {
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
        className={cn(isSaved ? 'btn-primary' : 'btn-secondary', className)}
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
        'inline-flex items-center justify-center rounded-md border-2 border-navy shadow-hard-sm transition-[transform,box-shadow,background-color] hover:-translate-x-px hover:-translate-y-px hover:shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-board',
        size === 'lg' ? 'h-11 w-11' : 'h-10 w-10 sm:h-9 sm:w-9',
        isSaved ? 'bg-board text-navy' : 'bg-pop text-navy/75 hover:text-navy',
        className
      )}
    >
      <Bookmark className={cn('h-4 w-4', isSaved && 'fill-current')} />
    </button>
  );
}
