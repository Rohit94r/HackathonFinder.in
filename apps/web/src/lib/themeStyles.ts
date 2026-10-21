import {
  Banknote,
  Blocks,
  Brain,
  Building2,
  Code2,
  Cpu,
  Gamepad2,
  GraduationCap,
  HandHeart,
  HeartPulse,
  Leaf,
  Lightbulb,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import type { ThemeSlug } from '@hackathonfinder/shared';

interface ThemeStyle {
  icon: LucideIcon;
  /** Gradient classes for cover art. */
  gradient: string;
  /** Soft tint for chips and tiles. */
  soft: string;
}

// Full class strings so Tailwind keeps them in the build.
export const THEME_STYLES: Record<ThemeSlug, ThemeStyle> = {
  'ai-ml': { icon: Brain, gradient: 'from-neutral-950 via-neutral-800 to-neutral-600', soft: 'bg-neutral-100 text-ink' },
  'web-dev': { icon: Code2, gradient: 'from-neutral-900 via-neutral-700 to-neutral-500', soft: 'bg-neutral-100 text-ink' },
  web3: { icon: Blocks, gradient: 'from-black via-neutral-900 to-neutral-700', soft: 'bg-neutral-100 text-ink' },
  fintech: { icon: Banknote, gradient: 'from-neutral-800 via-neutral-700 to-neutral-500', soft: 'bg-neutral-100 text-ink' },
  healthtech: { icon: HeartPulse, gradient: 'from-neutral-950 via-neutral-700 to-neutral-400', soft: 'bg-neutral-100 text-ink' },
  edtech: { icon: GraduationCap, gradient: 'from-neutral-900 via-neutral-800 to-neutral-500', soft: 'bg-neutral-100 text-ink' },
  climate: { icon: Leaf, gradient: 'from-neutral-950 via-neutral-800 to-neutral-600', soft: 'bg-neutral-100 text-ink' },
  'social-impact': { icon: HandHeart, gradient: 'from-neutral-900 via-neutral-700 to-neutral-500', soft: 'bg-neutral-100 text-ink' },
  iot: { icon: Cpu, gradient: 'from-black via-neutral-900 to-neutral-700', soft: 'bg-neutral-100 text-ink' },
  'smart-cities': { icon: Building2, gradient: 'from-neutral-800 via-neutral-700 to-neutral-500', soft: 'bg-neutral-100 text-ink' },
  cybersecurity: { icon: ShieldCheck, gradient: 'from-neutral-950 via-neutral-700 to-neutral-400', soft: 'bg-neutral-100 text-ink' },
  gaming: { icon: Gamepad2, gradient: 'from-neutral-900 via-neutral-800 to-neutral-500', soft: 'bg-neutral-100 text-ink' },
  'open-innovation': { icon: Lightbulb, gradient: 'from-neutral-950 via-neutral-800 to-neutral-600', soft: 'bg-neutral-100 text-ink' },
};

export function themeStyle(slug: string): ThemeStyle {
  return THEME_STYLES[slug as ThemeSlug] ?? THEME_STYLES['open-innovation'];
}
