import { THEMES } from '@hackathonfinder/shared';

// Discussion topics and small text helpers. The discussions themselves live in the
// database (sample ones are loaded by packages/db/src/seed).

export type CategoryId = 'general' | 'hackathon-qa' | 'team-up' | 'feedback' | 'resources' | 'city-talk';

export interface DiscussionCategory {
  id: CategoryId;
  label: string;
  description: string;
}

export const CATEGORIES: DiscussionCategory[] = [
  { id: 'general', label: 'General', description: 'Anything about hackathons, building and college tech life.' },
  { id: 'hackathon-qa', label: 'Hackathon Q&A', description: 'Ask about a specific event: rules, level, travel and prizes.' },
  { id: 'team-up', label: 'Team up', description: 'Find teammates, or a team that needs your skills.' },
  { id: 'feedback', label: 'Project feedback', description: 'Share what you built and get honest feedback.' },
  { id: 'resources', label: 'Resources', description: 'Free APIs, credits, templates and ways to find events.' },
  { id: 'city-talk', label: 'City talk', description: 'Meetups, travel and hackathons in your city.' },
];

export function categoryById(id: string): DiscussionCategory | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function isCategoryId(id: string): id is CategoryId {
  return CATEGORIES.some((c) => c.id === id);
}

export function isThemeTag(tag: string): boolean {
  return THEMES.some((t) => t.slug === tag);
}

/** Theme tags show the theme name; free tags show as #tag. */
export function tagLabel(tag: string): string {
  const theme = THEMES.find((t) => t.slug === tag);
  return theme ? theme.name : `#${tag}`;
}

/** First paragraph on one line, for previews and meta descriptions. */
export function excerpt(body: string, max = 160): string {
  const first = body.split(/\n\s*\n/)[0].replace(/\s+/g, ' ').trim();
  return first.length > max ? `${first.slice(0, max - 1).trimEnd()}…` : first;
}
