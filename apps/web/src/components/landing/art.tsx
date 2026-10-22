import type { CSSProperties, ReactNode } from 'react';
import {
  Award,
  CalendarDays,
  Clock,
  Code2,
  Coffee,
  Cpu,
  Gamepad2,
  Laptop,
  Lightbulb,
  MapPin,
  Megaphone,
  Rocket,
  Terminal,
  Trophy,
  Users,
  Wifi,
} from 'lucide-react';
import { themeStyle } from '@/lib/themeStyles';
import { cn } from '@/lib/cn';

// Original artwork for the landing page. It stands in for the photos, stickers and
// mascots of the design this page is based on, none of which are ours to use.

/** Soft white dot grid laid over the theme gradients. */
export function DotTexture({ opacity = 0.25 }: { opacity?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        pointerEvents: 'none',
        backgroundImage: 'radial-gradient(#ffffff 1.3px, transparent 1.5px)',
        backgroundSize: '16px 16px',
        backgroundPosition: '1px 1px',
      }}
    />
  );
}

/** A hackathon poster, as the hero's polaroids and the mosaic tiles show it. */
export interface PosterData {
  slug: string;
  title: string;
  theme: string;
  /** Where we found it, e.g. "Instagram". */
  source: string;
  /** "14–15 Nov". */
  when: string;
  /** "Pune" or "Online". */
  where: string;
}

export function PosterArt({ poster, compact = false }: { poster: PosterData; compact?: boolean }) {
  const { gradient } = themeStyle(poster.theme);
  return (
    <div
      className={cn('bg-gradient-to-br', gradient)}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        color: '#ffffff',
        padding: compact ? 14 : 20,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}
    >
      <DotTexture />
      <span
        style={{
          position: 'relative',
          background: 'rgba(0,0,0,0.28)',
          borderRadius: 999,
          padding: compact ? '3px 9px' : '4px 12px',
          fontFamily: 'var(--lp-sans)',
          fontSize: compact ? 11 : 13,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        via {poster.source}
      </span>
      <div style={{ position: 'relative' }}>
        <p style={{ fontFamily: 'var(--lp-serif)', fontSize: compact ? 22 : 34, lineHeight: 1, margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.18)' }}>
          {poster.title}
        </p>
        <p style={{ fontFamily: 'var(--lp-sans)', fontSize: compact ? 13 : 17, fontWeight: 600, margin: '8px 0 0', opacity: 0.95 }}>
          {poster.when} · {poster.where}
        </p>
      </div>
    </div>
  );
}

const STICKER_TONES = {
  red: { bg: '#ec3750', fg: '#ffffff' },
  orange: { bg: '#ff8c37', fg: '#17171d' },
  yellow: { bg: '#f1c40f', fg: '#17171d' },
  green: { bg: '#33d6a6', fg: '#17171d' },
  blue: { bg: '#338eda', fg: '#ffffff' },
  purple: { bg: '#a633d6', fg: '#ffffff' },
  ink: { bg: '#17171d', fg: '#fff6eb' },
} as const;

export type StickerTone = keyof typeof STICKER_TONES;

/** Die-cut text sticker: bold label, white edge, soft shadow. */
export function TextSticker({
  children,
  tone = 'red',
  shape = 'pill',
  size = 18,
  style,
}: {
  children: ReactNode;
  tone?: StickerTone;
  shape?: 'pill' | 'circle';
  size?: number;
  style?: CSSProperties;
}) {
  const { bg, fg } = STICKER_TONES[tone];
  const circle = shape === 'circle';
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        background: bg,
        color: fg,
        border: '4px solid #ffffff',
        borderRadius: 999,
        boxShadow: '0 3px 8px rgba(23,23,29,0.18)',
        fontFamily: 'var(--lp-sans)',
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.05,
        letterSpacing: '0.01em',
        whiteSpace: circle ? 'normal' : 'nowrap',
        padding: circle ? 10 : `${size * 0.45}px ${size * 0.95}px`,
        width: circle ? size * 6 : undefined,
        height: circle ? size * 6 : undefined,
        userSelect: 'none',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/** Tiny deterministic random numbers, so server and browser draw the same doodles. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const DOODLE_ICONS = [Laptop, Trophy, CalendarDays, MapPin, Lightbulb, Code2, Rocket, Users, Award, Cpu, Megaphone, Coffee, Gamepad2, Wifi, Terminal, Clock];

const DOODLES = (() => {
  const rand = seeded(42);
  const items: { left: number; top: number; size: number; rotate: number; icon: number }[] = [];
  const cols = 12;
  const rows = 6;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      items.push({
        left: (c + 0.15 + rand() * 0.6) * (100 / cols),
        top: (r + 0.1 + rand() * 0.6) * (100 / rows),
        size: 4 + rand() * 3.2,
        rotate: Math.round(rand() * 70 - 35),
        icon: Math.floor(rand() * DOODLE_ICONS.length),
      });
    }
  }
  return items;
})();

/** Field of hand-drawn-looking hackathon doodles: laptops, trophies, calendars, pins. */
export function DoodleField({ color = '#ec3750', style }: { color?: string; style?: CSSProperties }) {
  return (
    <div aria-hidden="true" style={{ position: 'relative', width: '100%', aspectRatio: '1920 / 840', ...style }}>
      {DOODLES.map((d, i) => {
        const Icon = DOODLE_ICONS[d.icon];
        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: `${d.left}%`,
              top: `${d.top}%`,
              width: `${d.size}%`,
              aspectRatio: '1',
              transform: `rotate(${d.rotate}deg)`,
              color,
            }}
          >
            <Icon width="100%" height="100%" strokeWidth={1.4} absoluteStrokeWidth />
          </span>
        );
      })}
    </div>
  );
}

const INK = '#17171d';

/** Our mascot: a cheerful magnifying glass, always out looking for hackathons. */
export function FinderBuddy({ style, wave = true }: { style?: CSSProperties; wave?: boolean }) {
  return (
    <svg viewBox="0 0 320 300" aria-hidden="true" className="lp-mascot" style={style}>
      <rect x="-24" y="0" width="48" height="128" rx="24" transform="translate(196 196) rotate(-45)" fill="#ec3750" stroke={INK} strokeWidth="7" />
      <rect x="-30" y="-14" width="60" height="28" rx="8" transform="translate(196 196) rotate(-45)" fill={INK} />
      {wave && (
        <>
          <path d="M44 150 Q8 132 20 92" fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" />
          <circle cx="20" cy="86" r="12" fill="#fff6eb" stroke={INK} strokeWidth="6" />
        </>
      )}
      <circle cx="130" cy="125" r="96" fill="#ff8c37" stroke={INK} strokeWidth="7" />
      <circle cx="130" cy="125" r="72" fill="#e3f4ff" stroke={INK} strokeWidth="6" />
      <path d="M84 104 A52 52 0 0 1 116 72" fill="none" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" />
      <ellipse cx="108" cy="124" rx="9" ry="12" fill={INK} />
      <ellipse cx="152" cy="124" rx="9" ry="12" fill={INK} />
      <circle cx="111" cy="119" r="3" fill="#ffffff" />
      <circle cx="155" cy="119" r="3" fill="#ffffff" />
      <path d="M112 150 Q130 168 148 150" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
      <circle cx="90" cy="146" r="9" fill="#ec3750" opacity="0.35" />
      <circle cx="170" cy="146" r="9" fill="#ec3750" opacity="0.35" />
      <path d="M262 30 l6 16 l16 6 l-16 6 l-6 16 l-6 -16 l-16 -6 l16 -6 Z" fill="#f1c40f" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M292 92 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 Z" fill="#33d6a6" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
    </svg>
  );
}

/** A calendar page that just noticed the deadline is tomorrow. */
export function DeadlineBuddy({ style }: { style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 300 300" aria-hidden="true" className="lp-mascot" style={style}>
      <rect x="50" y="62" width="200" height="200" rx="28" fill="#ffffff" stroke={INK} strokeWidth="7" />
      <path d="M50 120 V90 A28 28 0 0 1 78 62 H222 A28 28 0 0 1 250 90 V120 Z" fill="#ec3750" stroke={INK} strokeWidth="7" strokeLinejoin="round" />
      <rect x="92" y="40" width="20" height="44" rx="10" fill={INK} />
      <rect x="188" y="40" width="20" height="44" rx="10" fill={INK} />
      <text x="150" y="104" textAnchor="middle" fill="#ffffff" style={{ font: '800 21px var(--lp-sans)', letterSpacing: '0.12em' }}>
        DEADLINE
      </text>
      <path d="M104 152 Q118 142 132 150" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <path d="M168 150 Q182 142 196 152" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="120" cy="174" rx="9" ry="12" fill={INK} />
      <ellipse cx="180" cy="174" rx="9" ry="12" fill={INK} />
      <circle cx="123" cy="169" r="3" fill="#ffffff" />
      <circle cx="183" cy="169" r="3" fill="#ffffff" />
      <ellipse cx="150" cy="214" rx="13" ry="15" fill={INK} />
      <circle cx="98" cy="200" r="10" fill="#ec3750" opacity="0.3" />
      <circle cx="202" cy="200" r="10" fill="#ec3750" opacity="0.3" />
      <path d="M262 46 L282 30 M268 70 L292 66 M250 30 L256 8" stroke={INK} strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
