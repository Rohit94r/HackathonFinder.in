import 'server-only';
import { connectDb, isDbConfigured, Thread, User, Win } from '@hackathonfinder/db';
import { teamPostCounts } from './teams';

/**
 * Below these, a count reads as "nobody's here" rather than social proof, so the homepage
 * shows a plain invitation instead of the number. The figures are always real either way.
 */
export const SHOW_COUNT_FROM = { students: 25, teams: 3, discussions: 5, stories: 3 } as const;

/** The count when it's big enough to show (see SHOW_COUNT_FROM), else undefined. */
export function shownCount(stats: CommunityStats | null, key: keyof CommunityStats): number | undefined {
  const n = stats?.[key] ?? 0;
  return n >= SHOW_COUNT_FROM[key] ? n : undefined;
}

export interface CommunityStats {
  /** Signed-up students (no sample, banned or deleted accounts). */
  students: number;
  /** Team Finder posts still open for members. */
  teams: number;
  discussions: number;
  stories: number;
}

/**
 * Live community numbers for the homepage. Null when the database isn't configured or
 * doesn't answer, so the page hides these instead of showing made-up figures.
 */
export async function getCommunityStats(now: Date = new Date()): Promise<CommunityStats | null> {
  if (!isDbConfigured()) return null;
  try {
    await connectDb();
    const [students, teams, discussions, stories] = await Promise.all([
      User.countDocuments({ isSample: { $ne: true }, banned: { $ne: true }, deletedAt: null }),
      teamPostCounts(now).then((byCity) => Object.values(byCity).reduce((sum, n) => sum + n, 0)),
      Thread.countDocuments({ deletedAt: null }),
      Win.countDocuments({ deletedAt: null }),
    ]);
    return { students, teams, discussions, stories };
  } catch {
    return null;
  }
}
