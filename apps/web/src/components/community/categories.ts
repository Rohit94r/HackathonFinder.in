import { BookOpen, CircleHelp, Lightbulb, MapPin, MessagesSquare, Users, type LucideIcon } from 'lucide-react';
import type { ThemeSlug } from '@hackathonfinder/shared';
import type { CategoryId } from '@/data/discussions';

export const CATEGORY_ICONS: Record<CategoryId, LucideIcon> = {
  general: MessagesSquare,
  'hackathon-qa': CircleHelp,
  'team-up': Users,
  feedback: Lightbulb,
  resources: BookOpen,
  'city-talk': MapPin,
};

// Full class strings so Tailwind keeps them; each tint has a dark variant. Red, orange,
// neutral and the status colours only, to match the landing page palette.
export const CATEGORY_STYLES: Record<CategoryId, string> = {
  general: 'bg-ink/5 text-ink/80',
  'hackathon-qa': 'bg-brand-50 text-brand-700 dark:bg-brand-400/10 dark:text-brand-300',
  'team-up': 'bg-pop-soft text-pop-dark dark:bg-pop/15 dark:text-pop',
  feedback: 'bg-amber-50 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200',
  resources: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200',
  'city-talk': 'bg-ink/5 text-ink/80',
};

/** Cover art for threads without a theme tag. */
export const CATEGORY_ART: Record<CategoryId, ThemeSlug> = {
  general: 'open-innovation',
  'hackathon-qa': 'web-dev',
  'team-up': 'social-impact',
  feedback: 'gaming',
  resources: 'edtech',
  'city-talk': 'smart-cities',
};
