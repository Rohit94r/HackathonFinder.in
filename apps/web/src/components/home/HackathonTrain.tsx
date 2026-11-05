import Link from 'next/link';
import { placeName } from '@hackathonfinder/shared';
import BannerImage from '@/components/hackathon/BannerImage';
import { fallbackPhoto, sizedImage } from '@/components/hackathon/EventArt';
import { formatDay } from '@/lib/format';
import type { HackathonView } from '@/lib/hackathons';
import { cn } from '@/lib/cn';

/** Every fifth coach is an AC first (red); the rest are sleeper blue. Codes count up like a real rake. */
function coachCode(i: number): { code: string; ac: boolean } {
  const ac = i % 5 === 0;
  return { code: ac ? `A${Math.floor(i / 5) + 1}` : `B${i - Math.floor(i / 5)}`, ac };
}

function Wheels() {
  return (
    <>
      <span className="wheel left-5" />
      <span className="wheel left-[46px]" />
      <span className="wheel right-[46px]" />
      <span className="wheel right-5" />
    </>
  );
}

/** One coach: the event's banner through the windows, its route board below. */
function Coach({ h, i, hidden }: { h: HackathonView; i: number; hidden?: boolean }) {
  const { code, ac } = coachCode(i);
  return (
    <Link
      href={`/hackathons/${h.slug}`}
      prefetch={false}
      tabIndex={hidden ? -1 : undefined}
      aria-hidden={hidden || undefined}
      aria-label={hidden ? undefined : `${h.title}, ${placeName(h)}, registration closes ${formatDay(h.registrationDeadline)}`}
      className={cn(
        'coach group/coach relative mr-2 block h-[164px] w-[244px] shrink-0 rounded-[10px] px-2.5 pt-2 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-board sm:w-[268px]',
        ac && 'coach-ac'
      )}
    >
      <span className="flex items-center justify-between font-mono text-[9px] font-bold tracking-[0.16em] text-white/75">
        <span className="rounded-[2px] bg-board px-1 text-navy">{code}</span>
        <span>HF-JN</span>
      </span>
      {/* The windows: one banner seen through a row of window frames. */}
      <span className="relative mt-1.5 block h-[72px] overflow-hidden rounded-[5px] bg-[#0b0f17] ring-2 ring-black/40">
        <BannerImage
          src={sizedImage(h.imageUrl ?? fallbackPhoto(h.title), 480)}
          fallback={fallbackPhoto(h.title)}
          alt=""
          className="object-cover opacity-90 transition-[opacity,transform] duration-500 group-hover/coach:scale-105 group-hover/coach:opacity-100"
        />
        <span
          className="absolute inset-0 [background:repeating-linear-gradient(90deg,transparent_0_44px,rgb(20_24_33)_44px_50px),linear-gradient(180deg,rgb(255_255_255/0.18),transparent_40%)]"
          aria-hidden="true"
        />
      </span>
      {/* The route board on the coach side. */}
      <span className="mt-2 block rounded-[3px] bg-[#f6efdc] px-2 py-1 text-navy shadow-[inset_0_0_0_1px_rgb(0_0_0/0.25)]">
        <span className="block truncate font-display text-[13px] font-bold uppercase leading-tight tracking-[0.04em]">{h.title}</span>
        <span className="block truncate font-mono text-[9px] uppercase tracking-[0.12em] text-navy/65">
          {placeName(h)} · closes {formatDay(h.registrationDeadline)}
        </span>
      </span>
      <Wheels />
    </Link>
  );
}

/** The engine at the front, nose pointing the way the train runs. */
function Locomotive({ hidden }: { hidden?: boolean }) {
  return (
    <span aria-hidden="true" className={cn('relative mr-2 block h-[164px] w-[210px] shrink-0', hidden && 'pointer-events-none')}>
      {/* Pantograph on the roof. */}
      <svg className="absolute -top-7 left-[92px] h-8 w-16 text-[#4a443b]" viewBox="0 0 64 32" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M6 31 L32 12 L58 31 M14 2 H50 M32 12 L32 2" />
      </svg>
      <span
        className="absolute inset-0 rounded-r-[10px] [clip-path:polygon(18%_0,100%_0,100%_100%,0_100%,0_42%)]"
        style={{ background: 'linear-gradient(180deg, #d93a2b 0 58%, #f3e7c9 58% 66%, #c8261d 66% 100%)' }}
      />
      {/* Cab windows. */}
      <span className="absolute left-[26px] top-[16px] h-[40px] w-[58px] -skew-x-[22deg] rounded-[4px] bg-[#0b0f17] ring-2 ring-black/40 [background-image:linear-gradient(135deg,rgb(255_255_255/0.22),transparent_45%)]" />
      <span className="absolute left-[104px] top-[16px] h-[40px] w-[78px] rounded-[4px] bg-[#0b0f17] ring-2 ring-black/40 [background-image:linear-gradient(135deg,rgb(255_255_255/0.18),transparent_45%)]" />
      {/* Headlight. */}
      <span className="absolute left-[4px] top-[70px] h-3 w-3 rounded-full bg-[#fff6d0] shadow-[0_0_14px_6px_rgb(255_214_102/0.75)]" />
      {/* Name plate. */}
      <span className="absolute bottom-[26px] left-[64px] rounded-[2px] bg-board px-2 py-0.5 font-display text-[13px] font-extrabold uppercase tracking-[0.1em] text-navy">
        Junction Exp.
      </span>
      <Wheels />
    </span>
  );
}

/**
 * A train of open hackathons running along the bottom of the hero: the engine, then one coach
 * per event with its banner through the windows. Hovering stops the train; every coach opens
 * its event. With reduced motion it stands at the platform and scrolls sideways instead.
 */
export default function HackathonTrain({ items }: { items: HackathonView[] }) {
  if (items.length < 4) return null;
  const rake = (hidden?: boolean) => (
    <div className="flex items-end pr-24">
      <Locomotive hidden={hidden} />
      {items.map((h, i) => (
        <Coach key={hidden ? `${h.slug}-again` : h.slug} h={h} i={i} hidden={hidden} />
      ))}
    </div>
  );

  return (
    <div role="region" aria-label="Hackathons open right now" className="group relative">
      <div className="no-scrollbar overflow-x-auto pb-[9px] pt-9 motion-safe:overflow-hidden">
        <div
          className="flex w-max group-hover:[animation-play-state:paused] motion-safe:animate-marquee"
          style={{ animationDuration: `${(items.length + 2) * 5}s` }}
        >
          {rake()}
          <div className="hidden motion-safe:block">{rake(true)}</div>
        </div>
      </div>
      {/* The wheels hang 9px below the coaches; the rails start 2px into the track. */}
      <div className="rail-track -mt-[2px]" aria-hidden="true" />
      {/* Ballast under the sleepers. */}
      <div className="h-3 bg-[radial-gradient(circle_1.5px,rgb(255_255_255/0.12)_90%,transparent)] bg-[length:6px_5px]" aria-hidden="true" />
    </div>
  );
}
