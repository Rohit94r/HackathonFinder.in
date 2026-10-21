import { cn } from '@/lib/cn';

type Tone = 'green' | 'yellow' | 'turquoise' | 'cream' | 'dark';
type Shape = 'pill' | 'circle' | 'burst';

const TONES: Record<Tone, { bg: string; text: string }> = {
  green: { bg: '#FFFFFF', text: '#0A0A0A' },
  yellow: { bg: '#FFFFFF', text: '#0A0A0A' },
  turquoise: { bg: '#D4D4D4', text: '#0A0A0A' },
  cream: { bg: '#F5F5F5', text: '#0A0A0A' },
  dark: { bg: '#0A0A0A', text: '#FFFFFF' },
};

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
  className,
}: {
  text: string;
  tone?: Tone;
  shape?: Shape;
  className?: string;
}) {
  const { bg, text: fg } = TONES[tone];

  if (shape === 'burst') {
    return (
      <span className={cn('pointer-events-none absolute inline-flex select-none', className)} aria-hidden="true">
        <svg viewBox="0 0 120 120" className="h-28 w-28 drop-shadow-md">
          <polygon points={burstPoints(14, 58, 48, 60)} fill={bg} stroke={tone === 'dark' ? '#FFFFFF' : '#0A0A0A'} strokeWidth="3" />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center px-5 text-center font-display text-[13px] uppercase leading-tight"
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
      className={cn(
        'pointer-events-none absolute inline-flex select-none items-center justify-center border-[3px] border-ink text-center font-display uppercase leading-tight shadow-md',
        shape === 'circle' ? 'h-28 w-28 rounded-full px-3 text-[13px]' : 'rounded-full px-5 py-2.5 text-sm',
        className
      )}
      style={{ backgroundColor: bg, color: fg, borderColor: tone === 'dark' ? '#FFFFFF' : '#0A0A0A' }}
    >
      {text}
    </span>
  );
}
