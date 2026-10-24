import { cn } from '@/lib/cn';

type Tone = 'green' | 'yellow' | 'turquoise' | 'cream' | 'dark';
type Shape = 'pill' | 'circle' | 'burst';

// The landing page's red and orange, plus its cream and charcoal. Tone names are kept from older markup.
const TONES: Record<Tone, { bg: string; text: string }> = {
  green: { bg: '#ec3750', text: '#FFFFFF' },
  yellow: { bg: '#ffffff', text: '#17171d' },
  turquoise: { bg: '#fff6eb', text: '#be1e3a' },
  cream: { bg: '#fff6eb', text: '#17171d' },
  dark: { bg: '#17171d', text: '#FFFFFF' },
};
const edge = (tone: Tone) => (tone === 'dark' ? '#ec3750' : '#17171d');

function burstPoints(spikes: number, outer: number, inner: number, c: number): string {
  return Array.from({ length: spikes * 2 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    return `${(c + r * Math.cos(a)).toFixed(1)},${(c + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}

/** Decorative sticker badge, e.g. "SHIP IT" or "TEAM UP". */
export default function Sticker({
  text,
  tone = 'green',
  shape = 'pill',
  parallax,
  className,
}: {
  text: string;
  tone?: Tone;
  shape?: Shape;
  /** Scroll drift speed (e.g. 0.15 or -0.1). */
  parallax?: number;
  className?: string;
}) {
  const { bg, text: fg } = TONES[tone];

  if (shape === 'burst') {
    return (
      <span className={cn('pointer-events-none absolute inline-flex select-none', className)} aria-hidden="true" data-parallax={parallax}>
        <svg viewBox="0 0 120 120" className="h-28 w-28 drop-shadow-md">
          <polygon points={burstPoints(14, 58, 48, 60)} fill={bg} stroke={edge(tone)} strokeWidth="3" />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center px-5 text-center font-display text-[14px] leading-tight"
          style={{ color: fg }}
        >
          {text}
        </span>
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      data-parallax={parallax}
      className={cn(
        'pointer-events-none absolute inline-flex select-none items-center justify-center border-[3px] border-ink text-center font-display leading-tight shadow-md',
        shape === 'circle' ? 'h-28 w-28 rounded-full px-3 text-[13px]' : 'rounded-full px-5 py-2.5 text-sm',
        className
      )}
      style={{ backgroundColor: bg, color: fg, borderColor: edge(tone) }}
    >
      {text}
    </span>
  );
}
