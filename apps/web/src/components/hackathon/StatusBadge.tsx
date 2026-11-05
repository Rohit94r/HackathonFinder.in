import { STATUS_LABELS, type Status } from '@hackathonfinder/shared';
import { cn } from '@/lib/cn';

// Status colours mean the same thing everywhere, like railway signals: green is open, amber is
// last call, red is running now, grey is over. Solid fills, so badges stay readable on top of cover art.
const STYLES: Record<Status, { badge: string; dot: string }> = {
  open: { badge: 'bg-[#e1f3e7] text-[#14532d] ring-[#14532d]/25', dot: 'bg-[#22a35a]' },
  'closing-soon': { badge: 'bg-board text-navy ring-navy/30', dot: 'bg-[#e05a00]' },
  'in-progress': { badge: 'bg-[#c8261d] text-white ring-black/20', dot: 'bg-white' },
  'registration-closed': { badge: 'bg-[#ece6da] text-[#4a443b] ring-black/10', dot: 'bg-[#9c9486]' },
  completed: { badge: 'bg-[#ece6da] text-[#4a443b] ring-black/10', dot: 'bg-[#9c9486]' },
};

export default function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const style = STYLES[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[4px] px-2 py-[3px] font-display text-[12.5px] font-bold uppercase leading-none tracking-[0.07em] ring-1 ring-inset',
        style.badge,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dot, status === 'in-progress' && 'animate-pulse motion-reduce:animate-none')} aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}
