// Day maths for the activity heatmap. Days are "YYYY-MM-DD" keys in India time, so the
// grid is the same wherever it renders.

const DAY_MS = 24 * 60 * 60 * 1000;
const IST_MS = 330 * 60 * 1000;

export const HEATMAP_WEEKS = 53;

export type DayCounts = Record<string, number>;

export function istDayKey(ms: number): string {
  return new Date(ms + IST_MS).toISOString().slice(0, 10);
}

const keyMs = (key: string) => Date.parse(`${key}T00:00:00Z`);

export function addDays(key: string, days: number): string {
  return new Date(keyMs(key) + days * DAY_MS).toISOString().slice(0, 10);
}

/** 0 = Sunday. */
export function weekday(key: string): number {
  return new Date(keyMs(key)).getUTCDay();
}

/** The Sunday that starts the first column, so the last column holds today. */
export function gridStart(todayKey: string): string {
  return addDays(todayKey, -((HEATMAP_WEEKS - 1) * 7 + weekday(todayKey)));
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A repeatable number from 0 to 1 for a string (no Math.random, so every render agrees). */
function noise(s: string): number {
  let t = (hash(s) + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** What the sample heatmap needs; a sample Person, or a sample student from the database. */
export interface SampleSeed {
  handle: string;
  joinedMonthsAgo: number;
  record: { event: string; monthsAgo: number }[];
}

/**
 * Made-up but stable activity for a sample student: quiet days anchored to the calendar,
 * plus a busy stretch around each hackathon in their record. Nothing before they joined.
 */
export function sampleActivityCounts(person: SampleSeed, todayKey: string): DayCounts {
  const counts: DayCounts = {};
  const windowDays = HEATMAP_WEEKS * 7;
  const activeDays = Math.min(windowDays, person.joinedMonthsAgo * 30 + 10);
  const busy = Math.min(0.5, 0.16 + person.record.length * 0.06);

  for (let i = 0; i < activeDays; i++) {
    const key = addDays(todayKey, -i);
    const wd = weekday(key);
    const chance = busy * (wd === 0 || wd === 6 ? 1.3 : 0.8);
    if (noise(`${person.handle}:${key}`) < chance) counts[key] = 1 + Math.floor(noise(`${person.handle}:${key}:n`) * 4);
  }

  for (const r of person.record) {
    // Two build days, then the week of prep before them.
    const last = r.monthsAgo * 30 + (hash(r.event) % 12);
    for (let d = 0; d < 9; d++) {
      const i = last + d;
      if (i >= windowDays) break;
      const key = addDays(todayKey, -i);
      const n = noise(`${r.event}:${d}`);
      const extra = d < 2 ? 6 + Math.floor(n * 5) : n < 0.7 ? 1 + Math.floor(noise(`${r.event}:${d}:n`) * 3) : 0;
      if (extra) counts[key] = (counts[key] ?? 0) + extra;
    }
  }
  return counts;
}

/** Counts per day from ISO timestamps (e.g. the activity log). */
export function countsFromTimestamps(timestamps: string[]): DayCounts {
  const counts: DayCounts = {};
  for (const iso of timestamps) {
    const ms = Date.parse(iso);
    if (Number.isNaN(ms)) continue;
    const key = istDayKey(ms);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function heatLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

export function heatmapStats(counts: DayCounts, todayKey: string) {
  let total = 0;
  let activeDays = 0;
  let maxStreak = 0;
  let run = 0;
  for (let key = gridStart(todayKey); key <= todayKey; key = addDays(key, 1)) {
    const n = counts[key] ?? 0;
    total += n;
    if (n > 0) {
      activeDays++;
      run++;
      maxStreak = Math.max(maxStreak, run);
    } else run = 0;
  }
  // A streak isn't broken until today is over, so an empty today counts from yesterday.
  let current = 0;
  let key = (counts[todayKey] ?? 0) > 0 ? todayKey : addDays(todayKey, -1);
  while ((counts[key] ?? 0) > 0) {
    current++;
    key = addDays(key, -1);
  }
  return { total, activeDays, maxStreak, currentStreak: current };
}
