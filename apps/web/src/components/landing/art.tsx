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
import EventArt from '@/components/hackathon/EventArt';

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
  /** The event's real banner, when it has one. */
  imageUrl?: string;
}

/** A poster tile: the event's own banner (or a real event photo), with where we found it. */
export function PosterArt({ poster, compact = false }: { poster: PosterData; compact?: boolean }) {
  return (
    <div
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
      <EventArt title={poster.title} imageUrl={poster.imageUrl} className="!absolute inset-0" />
      {/* Without a banner the photo gets the title; a real banner already carries its own. */}
      {!poster.imageUrl && <span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 60%)' }} />}
      <span
        style={{
          position: 'relative',
          background: 'rgba(0,0,0,0.6)',
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
      {!poster.imageUrl && (
        <div style={{ position: 'relative' }}>
          <p style={{ fontFamily: 'var(--lp-serif)', fontSize: compact ? 22 : 34, lineHeight: 1, margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.18)' }}>
            {poster.title}
          </p>
          <p style={{ fontFamily: 'var(--lp-sans)', fontSize: compact ? 13 : 17, fontWeight: 600, margin: '8px 0 0', opacity: 0.95 }}>
            {poster.when} · {poster.where}
          </p>
        </div>
      )}
    </div>
  );
}

// Red and white only: the old tone names stay so callers don't change.
const STICKER_TONES = {
  red: { bg: '#ec3750', fg: '#ffffff' },
  orange: { bg: '#ffffff', fg: '#be1e3a' },
  yellow: { bg: '#ffffff', fg: '#17171d' },
  green: { bg: '#17171d', fg: '#ffffff' },
  blue: { bg: '#ec3750', fg: '#ffffff' },
  purple: { bg: '#ffffff', fg: '#be1e3a' },
  ink: { bg: '#17171d', fg: '#ffffff' },
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
