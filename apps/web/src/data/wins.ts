import type { ThemeSlug } from '@hackathonfinder/shared';
import { RESULT_LABELS, type ResultKind } from '@/data/people';

// Winning stories: labels and helpers shared by the wins pages. Stories live in the
// database (/api/wins).

export type WinResult = Exclude<ResultKind, 'participant'>;

export const WIN_RESULTS: WinResult[] = ['winner', 'runner-up', 'finalist'];

export interface WinSections {
  problem: string;
  /** What we built. */
  built: string;
  /** What the judges liked, or how we won. */
  won: string;
  /** Tips for other students. */
  lessons: string;
}

/** A sample story (see WINS). Live stories use WinItem from components/wins/model. */
export const SECTION_TITLES: { key: keyof WinSections; title: string }[] = [
  { key: 'problem', title: 'The problem' },
  { key: 'built', title: 'What we built' },
  { key: 'won', title: 'How we won' },
  { key: 'lessons', title: 'Tips for your next hackathon' },
];

export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function postedLabel(daysAgo: number): string {
  if (daysAgo <= 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  if (daysAgo < 14) return `${daysAgo} days ago`;
  if (daysAgo < 60) return `${Math.round(daysAgo / 7)} weeks ago`;
  return `${Math.round(daysAgo / 30)} months ago`;
}

/** e.g. "Winner at Capital Hack 2026" */
export function resultLine(story: { result: WinResult; hackathon: string }): string {
  return `${RESULT_LABELS[story.result]} at ${story.hackathon}`;
}
