'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { BtnArrowSvg } from './btn-arrow';
import { SmartSearchInput } from './smart-search-input';
import { SubmitEnvelopeLink } from './submit-envelope';
import { DoodleField, FinderBuddy, TextSticker } from './art';
import { PHOTOS, type Photo } from './photos';
import { WaveUp } from './waves';
import { InlineStyle } from './inline-style';

/** A sticker you can pick up and drag around the hero. */
function DraggableSticker({
  children,
  initialLeft,
  initialRight,
  initialTop,
  rotate,
}: {
  children: ReactNode;
  initialLeft?: number | string;
  initialRight?: number | string;
  initialTop: number | string;
  rotate: number;
}) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragOrigin = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragOrigin.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y };
    const onMove = (e: MouseEvent) => {
      setOffset({
        x: dragOrigin.current.ox + (e.clientX - dragOrigin.current.mx),
        y: dragOrigin.current.oy + (e.clientY - dragOrigin.current.my),
      });
    };
    const onUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const lifted = isHovered || isDragging;
  const lift = isDragging ? 14 : isHovered ? 6 : 0;
  const scale = isDragging ? 1.1 : isHovered ? 1.05 : 1;
  const extraTilt = isDragging ? 4 : 0;

  return (
    <div
      role="presentation"
      aria-hidden="true"
      onMouseDown={handleMouseDown}
      onMouseEnter={() => {
        hoverTimer.current = setTimeout(() => setIsHovered(true), 150);
      }}
      onMouseLeave={() => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        if (!isDragging) setIsHovered(false);
      }}
      style={{
        position: 'absolute',
        left: initialLeft,
        right: initialRight,
        top: initialTop,
        zIndex: isDragging ? 1000 : 30,
        pointerEvents: 'auto',
        cursor: isDragging ? 'grabbing' : 'grab',
        transform: `translate(${offset.x}px, ${offset.y - lift}px) scale(${scale})`,
        transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94), filter 0.25s ease',
        filter: lifted ? `drop-shadow(0 ${lift}px ${lift + 6}px rgba(0,0,0,0.28))` : 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))',
        userSelect: 'none',
      }}
    >
      <div style={{ transform: `rotate(${rotate + extraTilt}deg)`, transition: isDragging ? 'none' : 'transform 0.25s ease' }}>{children}</div>
    </div>
  );
}

/**
 * An event photo pinned around the hero like a polaroid.
 * bbX/bbY/bbW/bbH: bounding box on a 1920px-wide canvas; w/h: the photo before rotation.
 */
function Polaroid({
  photo,
  bbX,
  bbY,
  bbW,
  bbH,
  w,
  h,
  rotate,
  zIndex = 8,
  side = 'left',
  scale = 1,
  parallaxRate = 0.1,
}: {
  photo: Photo;
  bbX: number;
  bbY: number;
  bbW: number;
  bbH: number;
  w: number;
  h: number;
  rotate: number;
  zIndex?: number;
  side?: 'left' | 'right';
  scale?: number;
  parallaxRate?: number;
}) {
  const [hovered, setHovered] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const edgeStyle: React.CSSProperties = side === 'right' ? { right: -(bbX + bbW - 1920) } : { left: bbX };

  const REVEAL = 80;
  const MIN_SLIDE = 160;
  const hidden = side === 'right' ? bbX + bbW - 1920 : Math.abs(bbX);
  const magnitude = Math.max(hidden + REVEAL, MIN_SLIDE);
  const slideX = side === 'right' ? -magnitude : magnitude;
  const slideY = bbY + bbH / 2 < 450 ? 40 : -40;

  return (
    // Outer: parallax target, moved by the scroll handler via data-parallax-rate
    <div
      data-parallax-rate={parallaxRate}
      style={{ position: 'absolute', ...edgeStyle, top: bbY, width: bbW, height: bbH, zIndex, pointerEvents: 'none', willChange: 'transform' }}
    >
      {/* Middle: slides into view on hover */}
      <div
        style={{
          width: '100%',
          height: '100%',
          transform:
            hovered && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
              ? `translateX(${slideX}px) translateY(${slideY}px)`
              : 'none',
          transition: 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        {/* Inner: the photo itself */}
        <div
          aria-hidden="true"
          onMouseEnter={() => {
            if (leaveTimer.current) clearTimeout(leaveTimer.current);
            setHovered(true);
          }}
          onMouseLeave={() => {
            leaveTimer.current = setTimeout(() => setHovered(false), 200);
          }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: w,
            height: h,
            transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${scale})`,
            border: '4px solid var(--paper)',
            borderRadius: 10,
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
            pointerEvents: 'auto',
            background: 'var(--paper)',
          }}
        >
          <Image src={photo.src} alt="" fill sizes="300px" style={{ objectFit: 'cover' }} />
        </div>
      </div>
    </div>
  );
}

// Polaroid positions from the original design: left column, then right column.
const LEFT_SLOTS = [
  { bbX: -140, bbY: 65, rotate: -8, zIndex: 8, parallaxRate: 0.15 },
  { bbX: -185, bbY: 225, rotate: 16, zIndex: 7, parallaxRate: 0.12 },
  { bbX: -170, bbY: 365, rotate: -14, zIndex: 7, parallaxRate: 0.09 },
  { bbX: -140, bbY: 495, rotate: 11, zIndex: 8, parallaxRate: 0.07 },
  { bbX: -95, bbY: 610, rotate: -20, zIndex: 9, parallaxRate: 0.05 },
  { bbX: -100, bbY: 695, rotate: 22, zIndex: 8, parallaxRate: 0.04 },
  { bbX: -5, bbY: 725, rotate: -9, zIndex: 10, parallaxRate: 0.03 },
];
const RIGHT_SLOTS = [
  { bbX: 1680, bbY: 70, rotate: 10, zIndex: 8, parallaxRate: 0.15 },
  { bbX: 1710, bbY: 230, rotate: -16, zIndex: 7, parallaxRate: 0.12 },
  { bbX: 1690, bbY: 370, rotate: 13, zIndex: 7, parallaxRate: 0.09 },
  { bbX: 1665, bbY: 500, rotate: -11, zIndex: 8, parallaxRate: 0.07 },
  { bbX: 1640, bbY: 615, rotate: 20, zIndex: 8, parallaxRate: 0.05 },
  { bbX: 1555, bbY: 715, rotate: -10, zIndex: 10, parallaxRate: 0.03 },
];

const LEFT_PHOTOS = [
  PHOTOS.codingContest,
  PHOTOS.crowdAmazed,
  PHOTOS.teamLaptops,
  PHOTOS.friendsLucknow,
  PHOTOS.beanbagLaptop,
  PHOTOS.studentsLaptop,
  PHOTOS.groupSelfie,
];
const RIGHT_PHOTOS = [
  PHOTOS.tablesLaptops,
  PHOTOS.collegeGroupProject,
  PHOTOS.aroundLaptop,
  PHOTOS.expoHall,
  PHOTOS.youngCoders,
  PHOTOS.teamTable,
];

export function HeroSection({ sourceCount }: { sourceCount: number }) {
  const doodleRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const rafRef = useRef<number | null>(null);
  const parallaxElementsRef = useRef<HTMLElement[]>([]);
  const heroTopRef = useRef(0);
  const isHeroVisibleRef = useRef(true);
  const prefersReducedMotionRef = useRef(false);
  const [announceHover, setAnnounceHover] = useState<'idle' | 'in' | 'out'>('idle');
  const announceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const resetParallax = () => {
      if (doodleRef.current) doodleRef.current.style.transform = 'translate3d(-50%, 0, 0)';
      for (const el of parallaxElementsRef.current) el.style.transform = 'translate3d(0, 0, 0)';
    };

    const measureHero = () => {
      if (!sectionRef.current) return;
      heroTopRef.current = sectionRef.current.getBoundingClientRect().top + window.scrollY;
    };

    const applyParallax = () => {
      rafRef.current = null;
      if (prefersReducedMotionRef.current) {
        resetParallax();
        return;
      }
      const relativeY = Math.max(0, window.scrollY - heroTopRef.current);
      if (doodleRef.current) doodleRef.current.style.transform = `translate3d(-50%, ${relativeY * 0.4}px, 0)`;
      for (const el of parallaxElementsRef.current) {
        const rate = parseFloat(el.dataset.parallaxRate ?? '0');
        el.style.transform = `translate3d(0, ${relativeY * rate}px, 0)`;
      }
    };

    const scheduleParallax = () => {
      if (prefersReducedMotionRef.current || !isHeroVisibleRef.current || rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(applyParallax);
    };

    const handleResize = () => {
      measureHero();
      if (prefersReducedMotionRef.current) {
        resetParallax();
        return;
      }
      scheduleParallax();
    };

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleReducedMotionChange = () => {
      prefersReducedMotionRef.current = mediaQuery.matches;
      if (prefersReducedMotionRef.current) {
        resetParallax();
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        return;
      }
      measureHero();
      scheduleParallax();
    };

    parallaxElementsRef.current = Array.from(sectionRef.current?.querySelectorAll<HTMLElement>('[data-parallax-rate]') ?? []);

    measureHero();
    handleReducedMotionChange();

    const observer = new IntersectionObserver(
      ([entry]) => {
        isHeroVisibleRef.current = entry?.isIntersecting ?? false;
        if (isHeroVisibleRef.current) {
          measureHero();
          scheduleParallax();
        }
      },
      { rootMargin: '200px 0px' }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);

    window.addEventListener('scroll', scheduleParallax, { passive: true });
    window.addEventListener('resize', handleResize);
    mediaQuery.addEventListener('change', handleReducedMotionChange);

    return () => {
      window.removeEventListener('scroll', scheduleParallax);
      window.removeEventListener('resize', handleResize);
      mediaQuery.removeEventListener('change', handleReducedMotionChange);
      observer.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--hero-bg)',
      }}
    >
      <InlineStyle css={`
        @media (max-width: 1023px) { .hero-photos-left, .hero-photos-right, .hero-stickers { display: none; } }
      `} />

      {/* Doodle background, behind the photos */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div
          ref={doodleRef}
          style={{
            position: 'absolute',
            bottom: 40,
            left: '50%',
            minWidth: 900,
            width: '100%',
            transform: 'translate3d(-50%, 0, 0)',
            maskImage: 'linear-gradient(to top, black 40%, transparent 75%)',
            WebkitMaskImage: 'linear-gradient(to top, black 40%, transparent 75%)',
            opacity: 0.45,
            willChange: 'transform',
          }}
        >
          <DoodleField />
        </div>
      </div>

      {/* Photos, in front of the doodles */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
        <div className="hero-photos-left">
          {LEFT_PHOTOS.map((photo, i) => (
            <Polaroid key={photo.src} photo={photo} {...LEFT_SLOTS[i]} bbW={390} bbH={290} w={370} h={260} scale={0.78} />
          ))}
        </div>
        <div className="hero-photos-right">
          {RIGHT_PHOTOS.map((photo, i) => (
            <Polaroid key={photo.src} photo={photo} {...RIGHT_SLOTS[i]} side="right" bbW={390} bbH={290} w={370} h={260} scale={0.78} />
          ))}
        </div>
      </div>

      {/* Stickers: draggable, hidden on mobile */}
      <div className="hero-stickers">
        <DraggableSticker initialLeft="calc(75 / 1920 * 100vw)" initialTop="calc(266 / 1080 * 100vh)" rotate={-12}>
          <TextSticker tone="yellow" size={20}>
            No FOMO
          </TextSticker>
        </DraggableSticker>
        <DraggableSticker initialLeft="calc(215 / 1920 * 100vw)" initialTop="calc(663 / 1080 * 100vh)" rotate={-18}>
          <TextSticker tone="red" shape="circle" size={17}>
            36h of code
          </TextSticker>
        </DraggableSticker>
        <DraggableSticker initialLeft="calc(300 / 1920 * 100vw)" initialTop="calc(850 / 1080 * 100vh)" rotate={9}>
          <TextSticker tone="green" size={17}>
            Ship it!
          </TextSticker>
        </DraggableSticker>
        <DraggableSticker initialRight="calc(100 / 1920 * 100vw)" initialTop="calc(285 / 1080 * 100vh)" rotate={12}>
          <TextSticker tone="blue" shape="circle" size={17}>
            Free for students
          </TextSticker>
        </DraggableSticker>
        <DraggableSticker initialRight="calc(155 / 1920 * 100vw)" initialTop="calc(560 / 1080 * 100vh)" rotate={-10}>
          <TextSticker tone="purple" size={18}>
            Team up
          </TextSticker>
        </DraggableSticker>
        <DraggableSticker initialRight="calc(330 / 1920 * 100vw)" initialTop="calc(780 / 1080 * 100vh)" rotate={7}>
          <TextSticker tone="ink" size={16}>
            Closes in 2 days ⏰
          </TextSticker>
        </DraggableSticker>
      </div>

      {/* ── CENTER CONTENT ── */}
      <InlineStyle css={`.hero-center { padding-left: 0; padding-right: 0; }
        @media (max-width: 1023px) {
          .hero-center { padding-left: 24px; padding-right: 24px; }
        }
        @keyframes lp-announce-in  { from { transform: translateX(-101%); } to { transform: translateX(0%); } }
        @keyframes lp-announce-out { from { transform: translateX(0%); } to { transform: translateX(101%); } }
        .announce-link { position: relative; overflow: hidden; padding: 0 1px; transition: color 0.15s; }
        .announce-link::before {
          content: '';
          position: absolute;
          inset: 0;
          background: #ec3750;
          transform: translateX(-101%);
          z-index: -1;
        }
        .announce-link[data-state="in"]::before  { animation: lp-announce-in  0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
        .announce-link[data-state="out"]::before { animation: lp-announce-out 0.25s cubic-bezier(0.55, 0, 1, 0.45) forwards; }
        .announce-link .btn-arrow { display: inline-flex; align-items: center; }`} />
      <div
        className="hero-center"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 10,
          paddingTop: 80,
          paddingBottom: 100,
          pointerEvents: 'none',
        }}
      >
        {/* Announcement */}
        <Link
          href="/cities/pune"
          className="announce-link"
          data-state={announceHover}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 8,
            fontFamily: 'var(--lp-sans)',
            fontSize: 'clamp(16px, 4.2vw, 20px)',
            color: announceHover === 'in' ? '#ffffff' : 'var(--muted)',
            textDecoration: 'none',
            textAlign: 'center',
            marginBottom: 18,
            pointerEvents: 'auto',
            isolation: 'isolate',
          }}
          onMouseEnter={() => {
            announceTimer.current = setTimeout(() => setAnnounceHover('in'), 10);
          }}
          onMouseLeave={() => {
            if (announceTimer.current) clearTimeout(announceTimer.current);
            setAnnounceHover(announceHover === 'in' ? 'out' : 'idle');
          }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z" fill={announceHover === 'in' ? '#ffffff' : '#f1c40f'} />
          </svg>
          Now live: Pune and online hackathons
          <span className="btn-arrow" aria-hidden="true">
            <BtnArrowSvg />
          </span>
        </Link>

        {/* Headline: forced 2-line wrap */}
        <h1
          style={{
            fontFamily: 'var(--lp-serif)',
            fontSize: 'clamp(46px, 10.5vw, 86px)',
            fontWeight: 'normal',
            lineHeight: 1.06,
            color: 'var(--foreground)',
            margin: 0,
            marginBottom: 18,
            textAlign: 'center',
          }}
        >
          Every{' '}
          <span
            className="lp-rainbow"
            style={{
              background:
                'repeating-linear-gradient(105deg, #ec3750 0%, #ff8c37 16%, #f1c40f 32%, #33d6a6 48%, #338eda 64%, #a633d6 80%, #ec3750 100%)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'lp-gradient-pan 6s linear infinite',
            }}
          >
            hackathon.
          </span>
          <br />
          One place.
        </h1>

        {/* Subtext */}
        <p
          style={{
            fontFamily: 'var(--lp-sans)',
            fontSize: 20,
            color: 'var(--foreground)',
            margin: 0,
            marginBottom: 32,
            lineHeight: 1.25,
            textAlign: 'center',
            maxWidth: 'min(620px, calc(100vw - 64px))',
          }}
        >
          HackathonFinder searches Unstop, Devfolio, Google, Instagram, LinkedIn, Facebook, WhatsApp groups and {sourceCount - 7}+
          more places, so you can find every hackathon near you in one list.
        </p>

        {/* Smart search */}
        <div style={{ pointerEvents: 'auto' }}>
          <SmartSearchInput variant="hero" />
        </div>

        {/* Near me: the one-tap way in */}
        <Link
          href="/near-me"
          className="lp-near-me"
          style={{
            pointerEvents: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 14,
            padding: '0 20px',
            height: 44,
            borderRadius: 9999,
            border: '2px solid var(--foreground)',
            fontFamily: 'var(--lp-sans)',
            fontSize: 18,
            fontWeight: 600,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            transition: 'background 0.3s ease, color 0.3s ease',
          }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
            <circle cx="12" cy="9.5" r="2.5" />
          </svg>
          Show hackathons near me
        </Link>
        <InlineStyle css={`
          .lp-near-me { color: var(--foreground); background: transparent; }
          .lp-near-me:hover { background: var(--foreground); color: var(--background); }
        `} />

        {/* Italic note */}
        <p
          style={{
            fontFamily: 'var(--lp-sans)',
            fontStyle: 'italic',
            fontSize: 16,
            lineHeight: 1.35,
            color: 'var(--foreground)',
            margin: 0,
            marginTop: 10,
            padding: '10px 16px',
            maxWidth: 'min(680px, calc(100vw - 48px))',
            background: 'var(--nav-bg)',
            border: '1px solid var(--border)',
            borderRadius: 9999,
            boxShadow: '0 10px 28px rgba(23, 23, 29, 0.08)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            pointerEvents: 'auto',
            textAlign: 'center',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            columnGap: 4,
          }}
        >
          <span>Free for students, always. We send you to the official page to register.</span>
          <Link href="/how-it-works" className="lp-underline-link" style={{ whiteSpace: 'nowrap' }}>
            How it works
          </Link>
        </p>

        {/* Organizers: submit a hackathon */}
        <div style={{ pointerEvents: 'auto', marginTop: 34, display: 'flex', justifyContent: 'center' }}>
          <SubmitEnvelopeLink />
        </div>
      </div>

      {/* Mascot, sitting on the wave on the right */}
      <FinderBuddy
        style={{
          position: 'absolute',
          right: 'calc(40 / 1920 * 100vw)',
          bottom: 20,
          width: 'calc(330 / 1920 * 100vw)',
          minWidth: 110,
          height: 'auto',
          transform: 'translateY(calc(50% - 8px))',
          zIndex: 25,
          pointerEvents: 'none',
        }}
      />

      <WaveUp color="var(--background)" style={{ bottom: -2, zIndex: 20 }} />
    </section>
  );
}
