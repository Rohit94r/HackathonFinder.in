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
  /** Soft tint for chips and tiles, in both colour themes. */
  soft: string;
}

// Cover art and tints stay inside the palette: indigo and cool neutrals, in a few mixes
// so neighbouring cards still look different. Full class strings so Tailwind keeps them in the build.
const ART = {
  signature: 'from-[#635bff] to-[#8580ff]',
  deepRed: 'from-[#332d8f] via-[#635bff] to-[#8580ff]',
  sunset: 'from-[#8580ff] via-[#7069ff] to-[#5047e5]',
  nightRed: 'from-[#171923] via-[#272a37] to-[#635bff]',
  nightOrange: 'from-[#171923] via-[#332d8f] to-[#635bff]',
};
// Tags are quiet: the accent tint for a few themes, neutral for the rest.
const TINT = {
  red: 'bg-accent-soft text-brand-800 dark:bg-accent/15 dark:text-brand-200',
  orange: 'bg-ink/[0.05] text-ink/75 dark:bg-white/[0.07] dark:text-white/80',
};

export const THEME_STYLES: Record<ThemeSlug, ThemeStyle> = {
  'ai-ml': { icon: Brain, gradient: ART.signature, soft: TINT.red },
  'web-dev': { icon: Code2, gradient: ART.nightRed, soft: TINT.red },
  web3: { icon: Blocks, gradient: ART.sunset, soft: TINT.orange },
  fintech: { icon: Banknote, gradient: ART.nightOrange, soft: TINT.orange },
  healthtech: { icon: HeartPulse, gradient: ART.deepRed, soft: TINT.red },
  edtech: { icon: GraduationCap, gradient: ART.sunset, soft: TINT.orange },
  climate: { icon: Leaf, gradient: ART.nightOrange, soft: TINT.orange },
  'social-impact': { icon: HandHeart, gradient: ART.signature, soft: TINT.red },
  iot: { icon: Cpu, gradient: ART.sunset, soft: TINT.orange },
  'smart-cities': { icon: Building2, gradient: ART.nightRed, soft: TINT.red },
  cybersecurity: { icon: ShieldCheck, gradient: ART.nightRed, soft: TINT.red },
  gaming: { icon: Gamepad2, gradient: ART.deepRed, soft: TINT.red },
  'open-innovation': { icon: Lightbulb, gradient: ART.signature, soft: TINT.orange },
};

export function themeStyle(slug: string): ThemeStyle {
  return THEME_STYLES[slug as ThemeSlug] ?? THEME_STYLES['open-innovation'];
}
