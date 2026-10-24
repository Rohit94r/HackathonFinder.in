import { BookOpen, CircleHelp, Lightbulb, MapPin, MessagesSquare, Users, type LucideIcon } from 'lucide-react';
import type { CategoryId } from '@/data/discussions';

export const CATEGORY_ICONS: Record<CategoryId, LucideIcon> = {
  general: MessagesSquare,
  'hackathon-qa': CircleHelp,
  'team-up': Users,
  feedback: Lightbulb,
  resources: BookOpen,
  'city-talk': MapPin,
};

// Full class strings so Tailwind keeps them. The site palette only: brand red tints and ink
// tints; the icon tells the topics apart.
export const CATEGORY_STYLES: Record<CategoryId, string> = {
  general: 'bg-ink/[0.06] text-ink/80',
  'hackathon-qa': 'bg-accent/10 text-brand-700 dark:text-brand-300',
  'team-up': 'bg-accent/10 text-brand-700 dark:text-brand-300',
  feedback: 'bg-ink/[0.06] text-ink/80',
  resources: 'bg-ink/[0.06] text-ink/80',
  'city-talk': 'bg-ink/[0.06] text-ink/80',
};
