import { cn } from '@/lib/cn';

/*
 * Full-height night sky that sits behind big headlines (hero and footer):
 * a navy-to-black gradient with twinkling stars, drifting clouds, shooting
 * stars, a satellite and a distant plane. Generated from a fixed seed so
 * server and browser render the same SVG.
 */

const W = 1440;
const H = 900;

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const rand = mulberry32(19840612);

const STARS = Array.from({ length: 150 }, () => ({
  x: r1(rand() * W),
  y: r1(rand() * H * 0.85),
  r: r1(0.6 + rand() * 1.5),
  twinkle: rand() < 0.55,
  delay: r1(rand() * 6),
  dur: r1(2 + rand() * 4),
  dim: r1(0.25 + rand() * 0.45),
}));

const CLOUDS = [
  { x: 120, y: 190, s: 0.9, dur: 160, delay: -30, shade: '#2A2A2A' },
  { x: 760, y: 110, s: 0.75, dur: 200, delay: -120, shade: '#262626' },
  { x: 420, y: 420, s: 1.1, dur: 140, delay: -70, shade: '#2A2A2A' },
  { x: 1100, y: 320, s: 0.85, dur: 180, delay: -10, shade: '#242424' },
];

function Cloud({ scale, shade }: { scale: number; shade: string }) {
  return (
    <g transform={`scale(${scale})`} filter="url(#ns-soft)" fill={shade} opacity="0.45">
      <ellipse cx="0" cy="0" rx="110" ry="26" />
      <ellipse cx="-50" cy="-14" rx="56" ry="28" />
      <ellipse cx="30" cy="-22" rx="68" ry="32" />
      <ellipse cx="96" cy="-6" rx="48" ry="22" />
    </g>
  );
}

export default function NightSky({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ns-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#17171d" />
          <stop offset="0.45" stopColor="#0d0d11" />
          <stop offset="1" stopColor="#000000" />
        </linearGradient>
        <radialGradient id="ns-cityglow" cx="0.5" cy="1" r="0.75">
          <stop offset="0" stopColor="#ec3750" stopOpacity="0.14" />
          <stop offset="1" stopColor="#ec3750" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ns-trail" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <filter id="ns-soft" x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      <rect width={W} height={H} fill="url(#ns-sky)" />
      <rect width={W} height={H} fill="url(#ns-cityglow)" />

      {/* Stars */}
      {STARS.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill="#F5F5F5"
          opacity={s.twinkle ? undefined : s.dim}
          className={s.twinkle ? 'hf-anim hf-twinkle' : undefined}
          style={s.twinkle ? { animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s` } : undefined}
        />
      ))}

      {/* Slow clouds drifting behind the headline */}
      {CLOUDS.map((c) => (
        <g key={c.x} transform={`translate(${c.x} ${c.y})`}>
          <g className="hf-anim hf-cloud" style={{ animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s` }}>
            <Cloud scale={c.s} shade={c.shade} />
          </g>
        </g>
      ))}

      {/* Shooting stars */}
      {[
        { x: 1240, y: 80, delay: '1s', dur: '11s', len: 140 },
        { x: 700, y: 50, delay: '5s', dur: '14s', len: 110 },
        { x: 360, y: 140, delay: '9s', dur: '17s', len: 120 },
      ].map((s) => (
        <g key={s.x} transform={`translate(${s.x} ${s.y})`}>
          <g className="hf-anim hf-shoot" style={{ animationDelay: s.delay, animationDuration: s.dur }}>
            <line x1="0" y1="0" x2={s.len} y2={-s.len / 2} stroke="url(#ns-trail)" strokeWidth="2.2" strokeLinecap="round" />
          </g>
        </g>
      ))}

      {/* Satellite */}
      <g transform="translate(120 70)">
        <g className="hf-anim hf-satellite" style={{ animationDuration: '90s' }}>
          <rect x="-6" y="-2" width="4" height="4" fill="#BDBDBD" />
          <rect x="-1" y="-3" width="3" height="6" fill="#F5F5F5" />
          <rect x="3" y="-2" width="4" height="4" fill="#BDBDBD" />
          <circle className="hf-anim hf-blink" cx="0.5" cy="-5" r="1.4" fill="#FFFFFF" />
        </g>
      </g>

      {/* Distant plane, high up */}
      <g transform="translate(300 250) scale(0.45)">
        <g className="hf-anim hf-fly-right" style={{ animationDuration: '46s', animationDelay: '-20s' }}>
          <path d="M-46 0 C -40 -7, 30 -7, 44 -2 C 50 0, 50 2, 44 4 C 30 7, -40 7, -46 0 Z" fill="#8A8A8A" />
          <path d="M-6 1 L 14 1 L -4 22 L -14 22 Z" fill="#6B6B6B" />
          <path d="M-44 -1 L -36 -1 L -48 -20 L -54 -20 Z" fill="#6B6B6B" />
          <circle className="hf-anim hf-blink" cx="-12" cy="22" r="3" fill="#FFFFFF" />
        </g>
      </g>
    </svg>
  );
}
