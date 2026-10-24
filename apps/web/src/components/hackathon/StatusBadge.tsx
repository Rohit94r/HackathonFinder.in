import { Flame } from 'lucide-react';
import { STATUS_LABELS, type Status } from '@hackathonfinder/shared';
import { cn } from '@/lib/cn';

// Status colours mean the same thing everywhere, in red and white: white is open, red is hurry, red outline is live.
const STYLES: Record<Status, string> = {
  // Solid fills, so badges stay readable on top of cover art.
  open: 'bg-white text-navy ring-black/10',
  'closing-soon': 'bg-accent text-white ring-accent',
  'registration-closed': 'bg-[#f1f2f5] text-ink/60 ring-ink/15 dark:bg-[#2f2e35]',
  'in-progress': 'bg-brand-50 text-brand-700 ring-accent/30 dark:bg-[#36191f] dark:text-brand-200 dark:ring-brand-400/30',
  completed: 'bg-[#f1f2f5] text-ink/50 ring-ink/10 dark:bg-[#2f2e35]',
};

export default function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        STYLES[status],
        className
      )}
    >
      {status === 'closing-soon' && <Flame className="h-3.5 w-3.5" />}
      {status === 'in-progress' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />}
      {status === 'open' && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
      {STATUS_LABELS[status]}
    </span>
  );
}
