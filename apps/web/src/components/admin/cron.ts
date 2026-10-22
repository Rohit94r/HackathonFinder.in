// Checks a cron expression the way the agents scheduler (node-cron) reads it:
// 5 fields (minute hour day-of-month month day-of-week), or 6 with seconds first.

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

interface Field {
  name: string;
  min: number;
  max: number;
  names?: string[];
  /** Offset added to a name's index (months start at 1). */
  nameBase?: number;
}

const FIELDS: Field[] = [
  { name: 'minute', min: 0, max: 59 },
  { name: 'hour', min: 0, max: 23 },
  { name: 'day of month', min: 1, max: 31 },
  { name: 'month', min: 1, max: 12, names: MONTHS, nameBase: 1 },
  { name: 'day of week', min: 0, max: 7, names: DAYS, nameBase: 0 },
];
const SECONDS: Field = { name: 'second', min: 0, max: 59 };

function value(token: string, f: Field): number | null {
  if (/^\d+$/.test(token)) return Number(token);
  const i = f.names?.indexOf(token.toLowerCase().slice(0, 3)) ?? -1;
  return i >= 0 && token.length <= 9 ? i + (f.nameBase ?? 0) : null;
}

function fieldProblem(part: string, f: Field): string | null {
  for (const item of part.split(',')) {
    const pieces = item.split('/');
    if (pieces.length > 2 || !item) return `The ${f.name} part “${part}” isn’t valid.`;
    const [range, step] = pieces;
    if (step !== undefined && (!/^\d+$/.test(step) || Number(step) === 0)) return `The step in “${item}” must be a number above 0.`;
    if (range === '*') continue;
    const ends = range.split('-');
    if (ends.length > 2) return `The ${f.name} part “${part}” isn’t valid.`;
    const nums = ends.map((t) => value(t, f));
    if (nums.some((n) => n === null || n < f.min || n > f.max)) return `The ${f.name} must be between ${f.min} and ${f.max}.`;
    if (nums.length === 2 && (nums[0] as number) > (nums[1] as number)) return `The range “${range}” goes backwards.`;
  }
  return null;
}

/** Null when the expression is valid, otherwise a short reason. */
export function cronProblem(expr: string): string | null {
  const parts = expr.trim().split(/\s+/).filter(Boolean);
  if (parts.length !== 5 && parts.length !== 6) return 'Use 5 parts: minute hour day month weekday, e.g. “0 */6 * * *”.';
  const fields = parts.length === 6 ? [SECONDS, ...FIELDS] : FIELDS;
  for (let i = 0; i < parts.length; i++) {
    const problem = fieldProblem(parts[i], fields[i]);
    if (problem) return problem;
  }
  return null;
}

/** A few common schedules for the dropdown. Times are India time. */
export const SCHEDULE_PRESETS: { value: string; label: string }[] = [
  { value: '0 * * * *', label: 'Every hour' },
  { value: '0 */3 * * *', label: 'Every 3 hours' },
  { value: '0 */6 * * *', label: 'Every 6 hours' },
  { value: '0 */12 * * *', label: 'Every 12 hours' },
  { value: '0 6 * * *', label: 'Daily at 6:00' },
  { value: '0 6 * * 1', label: 'Mondays at 6:00' },
];
