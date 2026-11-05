import Link from 'next/link';
import { placeName } from '@hackathonfinder/shared';
import BannerImage from '@/components/hackathon/BannerImage';
import { fallbackPhoto, sizedImage } from '@/components/hackathon/EventArt';
import { deadlineText } from '@/components/hackathon/HackathonCard';
import type { HackathonView } from '@/lib/hackathons';
import { cn } from '@/lib/cn';

function Poster({ h, hidden }: { h: HackathonView; hidden?: boolean }) {
  const hurry = h.status === 'closing-soon';
  return (
    <Link
      href={`/hackathons/${h.slug}`}
      prefetch={false}
      tabIndex={hidden ? -1 : undefined}
      aria-hidden={hidden || undefined}
      className="group/poster relative block h-[150px] w-[240px] shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#1b1c26] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.8)] transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-white/30 sm:h-[176px] sm:w-[280px]"
    >
      <BannerImage
        src={sizedImage(h.imageUrl ?? fallbackPhoto(h.title), 480)}
        fallback={fallbackPhoto(h.title)}
        alt={hidden ? '' : `${h.title} banner`}
        className="object-cover transition-transform duration-500 group-hover/poster:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 p-3">
        <span
          className={cn(
            'mb-1.5 inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
            hurry ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-white/90 text-[#171923]'
          )}
        >
          {deadlineText(h)}
        </span>
        <p className="line-clamp-1 text-sm font-semibold text-white">{h.title}</p>
        <p className="truncate text-xs text-white/65">{placeName(h)}</p>
      </div>
    </Link>
  );
}

/** One endless row: the list twice, sliding by half its width so the loop is seamless. */
function Row({ items, reverse = false, duration }: { items: HackathonView[]; reverse?: boolean; duration: number }) {
  return (
    <div className="flex w-max gap-4 group-hover:[animation-play-state:paused] motion-safe:animate-marquee" style={{ animationDuration: `${duration}s`, animationDirection: reverse ? 'reverse' : 'normal' }}>
      {items.map((h) => (
        <Poster key={h.slug} h={h} />
      ))}
      {items.map((h) => (
        <Poster key={`${h.slug}-again`} h={h} hidden />
      ))}
    </div>
  );
}

/**
 * A tilted wall of real hackathon posters drifting in three rows. Hovering pauses it;
 * every poster opens its event. With reduced motion the rows simply stand still.
 */
export default function PosterWall({ items }: { items: HackathonView[] }) {
  if (items.length < 6) return null;
  const third = Math.ceil(items.length / 3);
  const rows = [items.slice(0, third), items.slice(third, third * 2), items.slice(third * 2)].filter((r) => r.length > 0);

  return (
    <div
      className="group relative h-[400px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_72%,transparent),linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] [mask-composite:intersect] [-webkit-mask-composite:source-in] sm:h-[520px]"
      aria-label="Hackathons open right now"
      role="region"
    >
      <div className="absolute left-1/2 top-6 flex flex-col gap-4 [transform:translateX(-50%)_perspective(1400px)_rotateX(22deg)_rotateZ(-6deg)] sm:gap-5">
        {rows.map((row, i) => (
          <Row key={i} items={row} reverse={i % 2 === 1} duration={60 + i * 12} />
        ))}
      </div>
    </div>
  );
}
