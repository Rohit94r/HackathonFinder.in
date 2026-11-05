import { STATUS_LABELS, type Status } from '@hackathonfinder/shared';
import { cn } from '@/lib/cn';

// Status colours mean the same thing everywhere: green is open, amber is hurry, indigo is live, grey is over.
// Solid fills, so badges stay readable on top of cover art.
const STYLES: Record<Status, { badge: string; dot: string }> = {
  open: { badge: 'bg-success-soft text-[#166534] ring-[#166534]/10', dot: 'bg-[#16a34a]' },
  'closing-soon': { badge: 'bg-warning-soft text-[#92400e] ring-[#92400e]/10', dot: 'bg-[#d97706]' },
  'in-progress': { badge: 'bg-accent-soft text-brand-800 ring-brand-800/10', dot: 'bg-accent' },
  'registration-closed': { badge: 'bg-[#f1f2f6] text-[#4b5063] ring-black/5', dot: 'bg-[#9aa0b1]' },
  completed: { badge: 'bg-[#f1f2f6] text-[#4b5063] ring-black/5', dot: 'bg-[#9aa0b1]' },
};

export default function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const style = STYLES[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        style.badge,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dot, status === 'in-progress' && 'animate-pulse motion-reduce:animate-none')} aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}
