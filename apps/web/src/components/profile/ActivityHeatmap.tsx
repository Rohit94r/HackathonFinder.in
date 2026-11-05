'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Flame, Trophy } from 'lucide-react';
import { cn } from '@/lib/cn';
import { HEATMAP_WEEKS, addDays, gridStart, heatLevel, heatmapStats, type DayCounts } from './heatmap';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

// Brand red, light to dark in light mode and dark to bright in dark mode; empty days stay neutral.
const LEVELS = [
  'bg-ink/10',
  'bg-brand-200 dark:bg-brand-900',
  'bg-brand-400 dark:bg-brand-700',
  'bg-brand-600 dark:bg-brand-500',
  'bg-brand-800 dark:bg-brand-300',
];

function dateLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

const plural = (n: number, word: string) => `${n.toLocaleString('en-US')} ${word}${n === 1 ? '' : 's'}`;

/**
 * Submissions-calendar style grid: 53 weeks by 7 days ending today. `todayKey` is passed in
 * (worked out after mount by the caller) so the grid never depends on the server's clock.
 */
export default function ActivityHeatmap({ counts, todayKey, unit = 'action' }: { counts: DayCounts; todayKey: string; unit?: string }) {
  const scroller = useRef<HTMLDivElement>(null);

  const { weeks, monthAt } = useMemo(() => {
    const start = gridStart(todayKey);
    const cols: (string | null)[][] = [];
    const labels: Record<number, string> = {};
    let lastLabelAt = -10;
    for (let w = 0; w < HEATMAP_WEEKS; w++) {
      const col: (string | null)[] = [];
      for (let d = 0; d < 7; d++) {
        const key = addDays(start, w * 7 + d);
        col.push(key <= todayKey ? key : null);
        // Label the column where a month starts, unless it would crowd the previous label.
        if (key.endsWith('-01') && key <= todayKey && w - lastLabelAt >= 3) {
          labels[w] = MONTHS[Number(key.slice(5, 7)) - 1];
          lastLabelAt = w;
        }
      }
      cols.push(col);
    }
    return { weeks: cols, monthAt: labels };
  }, [todayKey]);

  const stats = useMemo(() => heatmapStats(counts, todayKey), [counts, todayKey]);

  // On narrow screens, start scrolled to the latest weeks.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [todayKey]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-sm text-ink/70">
          <strong className="font-display text-3xl leading-none text-ink">{stats.total.toLocaleString('en-US')}</strong>{' '}
          {stats.total === 1 ? unit : `${unit}s`} in the past year
        </p>
        <dl className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink/60">
          <div className="flex gap-1">
            <dt>Active days:</dt>
            <dd className="font-semibold text-ink">{stats.activeDays}</dd>
          </div>
          <div className="flex items-center gap-1">
            <Flame className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            <dt>Current streak:</dt>
            <dd className="font-semibold text-ink">{plural(stats.currentStreak, 'day')}</dd>
          </div>
          <div className="flex items-center gap-1">
            <Trophy className="h-3.5 w-3.5 text-ink/60" aria-hidden="true" />
            <dt>Max streak:</dt>
            <dd className="font-semibold text-ink">{plural(stats.maxStreak, 'day')}</dd>
          </div>
        </dl>
      </div>

      <div ref={scroller} className="mt-4 overflow-x-auto pb-2">
        <div className="flex w-max gap-[3px]" aria-hidden="true">
          <div className="mr-1 flex flex-col gap-[3px] pt-[17px] text-[10px] text-ink/50">
            {DAY_LABELS.map((d, i) => (
              <span key={i} className="h-[11px] leading-[11px]">
                {d}
              </span>
            ))}
          </div>
          {weeks.map((week, w) => (
            <div key={w} className="flex flex-col gap-[3px]">
              <span className="relative h-[14px] text-[10px] leading-[14px] text-ink/50">
                {monthAt[w] && <span className="absolute left-0 top-0 whitespace-nowrap">{monthAt[w]}</span>}
              </span>
              {week.map((key, d) =>
                key ? (
                  <span
                    key={d}
                    title={`${plural(counts[key] ?? 0, unit)} on ${dateLabel(key)}`}
                    className={cn('h-[11px] w-[11px] rounded-[3px]', LEVELS[heatLevel(counts[key] ?? 0)])}
                  />
                ) : (
                  <span key={d} className="h-[11px] w-[11px]" />
                )
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-end gap-1.5 text-[11px] text-ink/60" aria-hidden="true">
        Less
        {LEVELS.map((c) => (
          <span key={c} className={cn('h-[11px] w-[11px] rounded-[3px]', c)} />
        ))}
        More
      </div>
      <p className="sr-only">
        {plural(stats.total, unit)} on {plural(stats.activeDays, 'day')} in the past year. Current streak{' '}
        {plural(stats.currentStreak, 'day')}, longest streak {plural(stats.maxStreak, 'day')}.
      </p>
    </div>
  );
}

/** Same footprint as the heatmap, shown until the client knows today's date. */
export function HeatmapSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading activity">
      <div className="h-8 w-48 animate-pulse rounded bg-ink/10" />
      <div className="mt-4 h-[118px] animate-pulse rounded-lg bg-ink/5" />
      <div className="mt-2 h-[11px]" />
    </div>
  );
}
