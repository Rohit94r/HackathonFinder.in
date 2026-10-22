import { RESULT_LABELS, type ResultKind } from '@/data/people';
import { RESULT_COLORS } from '@/components/wins/ResultBadge';

const ORDER: ResultKind[] = ['winner', 'runner-up', 'finalist', 'participant'];

const R = 50;
const C = 2 * Math.PI * R;
// Gap between segments, in viewBox units (about 2px at this size).
const GAP = 2;

/** LeetCode-style donut of results, with the total in the middle and a legend beside it. */
export default function ResultRing({
  counts,
  centerLabel = 'hackathons',
  caption,
}: {
  counts: Record<ResultKind, number>;
  centerLabel?: string;
  caption?: string;
}) {
  const total = ORDER.reduce((sum, k) => sum + counts[k], 0);
  const parts = ORDER.filter((k) => counts[k] > 0);
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="60" cy="60" r={R} fill="none" stroke="currentColor" strokeWidth="12" className="text-ink/10" />
          {parts.map((k) => {
            const len = (counts[k] / total) * C;
            const dash = parts.length > 1 ? Math.max(len - GAP, 0.5) : len;
            const el = (
              <circle
                key={k}
                cx="60"
                cy="60"
                r={R}
                fill="none"
                stroke={RESULT_COLORS[k]}
                strokeWidth="12"
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={-offset}
              >
                <title>{`${RESULT_LABELS[k]}: ${counts[k]}`}</title>
              </circle>
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl leading-none text-ink">{total}</span>
          <span className="mt-1 text-[11px] font-medium uppercase tracking-wider text-ink/60">{centerLabel}</span>
        </div>
      </div>
      <div className="w-full min-w-0">
        <ul className="space-y-2.5">
          {ORDER.map((k) => (
            <li key={k} className="flex items-center gap-2.5 text-sm">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: RESULT_COLORS[k] }} aria-hidden="true" />
              <span className="flex-1 text-ink/80">{RESULT_LABELS[k]}</span>
              <span className="font-semibold tabular-nums text-ink">{counts[k]}</span>
            </li>
          ))}
        </ul>
        {caption && <p className="mt-4 text-xs leading-5 text-ink/60">{caption}</p>}
      </div>
    </div>
  );
}
