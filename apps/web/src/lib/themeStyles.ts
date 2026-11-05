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

// Cover art and tints stay inside the Junction palette: signal red, signboard yellow, coach blue
// and soot, in a few mixes so neighbouring cards still look different. Full class strings so Tailwind keeps them.
const ART = {
  signature: 'from-[#c8261d] to-[#e65a4a]',
  deepRed: 'from-[#5f1410] via-[#c8261d] to-[#ffc629]',
  sunset: 'from-[#e0a800] via-[#ffc629] to-[#ffdf80]',
  nightRed: 'from-[#16130f] via-[#2a251f] to-[#c8261d]',
  nightOrange: 'from-[#16130f] via-[#1d4785] to-[#2a5ba8]',
};
// Tags: signboard yellow for a few themes, plain paper for the rest.
const TINT = {
  red: 'bg-board-soft text-navy ring-1 ring-inset ring-board-dark/40 dark:bg-board/15 dark:text-board dark:ring-board/25',
  orange: 'bg-ink/[0.06] text-ink/75 dark:bg-white/[0.07] dark:text-white/80',
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
