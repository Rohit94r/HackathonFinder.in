import { themeStyle } from '@/lib/themeStyles';
import { cn } from '@/lib/cn';

interface EventArtProps {
  theme: string;
  title: string;
  label?: string;
  className?: string;
  size?: 'card' | 'hero';
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Generated cover art: theme gradient, a soft pattern and the theme icon. */
export default function EventArt({ theme, title, label, className, size = 'card' }: EventArtProps) {
  const { icon: Icon, gradient } = themeStyle(theme);
  const seed = hash(title);
  const cx = 20 + (seed % 60);
  const cy = 10 + ((seed >> 4) % 60);
  const initials = title
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-br', gradient, className)}>
      <svg className="absolute inset-0 h-full w-full opacity-30" aria-hidden="true">
        <defs>
          <pattern id={`dots-${seed}`} width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#dots-${seed})`} />
      </svg>
      <div
        className="absolute h-56 w-56 rounded-full bg-white/20 blur-2xl"
        style={{ left: `${cx}%`, top: `${cy}%`, transform: 'translate(-50%, -50%)' }}
        aria-hidden="true"
      />
      <div className="relative flex h-full items-end justify-between p-4">
        <span
          className={cn(
            'font-display font-bold leading-none text-white/90 drop-shadow-sm',
            size === 'hero' ? 'text-7xl sm:text-8xl' : 'text-4xl'
          )}
          aria-hidden="true"
        >
          {initials}
        </span>
        <div className="flex flex-col items-end gap-2">
          {label && (
            <span className="rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur">
              {label}
            </span>
          )}
          <span className="inline-flex rounded-2xl bg-white/20 p-2.5 text-white backdrop-blur">
            <Icon className={size === 'hero' ? 'h-8 w-8' : 'h-5 w-5'} />
          </span>
        </div>
      </div>
    </div>
  );
}
