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

// Cover art and tints stay inside the landing palette: red, orange and charcoal, in a few mixes
// so neighbouring cards still look different. Full class strings so Tailwind keeps them in the build.
const ART = {
  signature: 'from-[#ec3750] to-[#ff8c37]',
  deepRed: 'from-[#9b1830] via-[#ec3750] to-[#ff6b81]',
  sunset: 'from-[#ff8c37] via-[#f9663f] to-[#ec3750]',
  nightRed: 'from-[#17171d] via-[#3d1d26] to-[#ec3750]',
  nightOrange: 'from-[#17171d] via-[#a5481a] to-[#ff8c37]',
};
const TINT = {
  red: 'bg-brand-50 text-brand-700 dark:bg-brand-400/15 dark:text-brand-200',
  orange: 'bg-pop-soft text-[#a4460a] dark:bg-pop/15 dark:text-[#ffc59a]',
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
