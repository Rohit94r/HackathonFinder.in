import { Flame } from 'lucide-react';
import { STATUS_LABELS, type Status } from '@hackathonfinder/shared';
import { cn } from '@/lib/cn';

const STYLES: Record<Status, string> = {
  open: 'bg-white text-ink ring-ink/25',
  'closing-soon': 'bg-ink text-white ring-white/40',
  'registration-closed': 'bg-neutral-200 text-ink/70 ring-ink/10',
  'in-progress': 'bg-white text-ink ring-ink/60',
  completed: 'bg-neutral-200 text-ink/60 ring-ink/10',
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
      {status === 'in-progress' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink" />}
      {status === 'open' && <span className="h-1.5 w-1.5 rounded-full bg-ink" />}
      {STATUS_LABELS[status]}
    </span>
  );
}
