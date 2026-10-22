import { cn } from '@/lib/cn';

/*
 * Original noir night-city scene: a dense gothic skyline (cathedral spire, clock
 * tower, art-deco towers, water towers, a suspension bridge), drifting clouds and
 * fog, searchlights, light rain and the occasional lightning flash, plus sky
 * traffic (planes, an airship, crows, a UFO, a rocket and a satellite).
 * Layers move at different speeds when wrapped in <ParallaxScene>, which sets
 * --hf-p. Everything is generated from a fixed seed so server and browser match.
 */

const W = 1440;
const H = 520;
const GROUND = 450; // top of the rooftop in front
const BASE = 452; // skyline baseline

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const rand = mulberry32(20261021);

interface Building {
  x: number;
  w: number;
  h: number;
  setback: boolean;
  waterTower: boolean;
  antenna: boolean;
  gothic: boolean;
}

interface LitWindow {
  x: number;
  y: number;
  flicker: boolean;
  delay: number;
  dur: number;
}

const STARS = Array.from({ length: 70 }, () => ({
  x: r1(rand() * W),
  y: r1(rand() * 280),
  r: r1(0.7 + rand() * 1.4),
  twinkle: rand() < 0.5,
  delay: r1(rand() * 5),
  dur: r1(2 + rand() * 3),
}));

function makeRow(from: number, to: number, minW: number, maxW: number, minH: number, maxH: number): Building[] {
  const row: Building[] = [];
  let x = from;
  while (x < to) {
    const w = r1(minW + rand() * (maxW - minW));
    const h = r1(minH + rand() * (maxH - minH));
    row.push({
      x: r1(x),
      w,
      h,
      setback: rand() < 0.3,
      waterTower: h < minH + (maxH - minH) * 0.45 && rand() < 0.45,
      antenna: rand() < 0.25,
      gothic: rand() < 0.3,
    });
    x += w + Math.floor(rand() * 4);
  }
  return row;
}

const BACK = makeRow(-20, W + 20, 30, 70, 70, 210);
const FRONT = makeRow(400, W + 20, 34, 72, 110, 240);

function litWindowsFor(x: number, top: number, w: number, h: number, density: number): LitWindow[] {
  const out: LitWindow[] = [];
  const cols = Math.floor((w - 8) / 12);
  const rows = Math.floor((h - 20) / 18);
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      if (rand() < density) {
        out.push({
          x: r1(x + 7 + c * 12),
          y: r1(top + 12 + r * 18),
          flicker: rand() < 0.3,
          delay: r1(rand() * 12),
          dur: r1(6 + rand() * 8),
        });
      }
    }
  }
  return out;
}

// Landmark-style towers.
const SPIRE = { x: 512, w: 92, h: 210 };
const CLOCK = { x: 678, w: 60, h: 246 };
const CROWN = { x: 798, w: 72, h: 250 };
const SLANT = { x: 1002, w: 84, h: 236 };
const CATHEDRAL = { x: 1108, w: 80, h: 200 };
const PENCIL = { x: 1296, w: 34, h: 318 };

const CLOCK_FACE = { cx: CLOCK.x + CLOCK.w / 2, cy: BASE - CLOCK.h - 32, r: 17 };
const ROSE = { cx: CATHEDRAL.x + CATHEDRAL.w / 2, cy: BASE - CATHEDRAL.h + 40, r: 13 };

const WINDOWS: LitWindow[] = [
  ...FRONT.flatMap((b) => litWindowsFor(b.x, BASE - b.h, b.w, b.h, 0.13)),
  ...[SPIRE, CROWN, SLANT, PENCIL, CLOCK].flatMap((t) => litWindowsFor(t.x, BASE - t.h, t.w, t.h, 0.16)),
];

// Suspension bridge.
const DECK = 396;
const TOWER_L = 92;
const TOWER_R = 302;
const TOWER_TOP = 292;
const SAG = 384;
const SUSPENDERS = Array.from({ length: 13 }, (_, i) => {
  const t = (i + 1) / 14;
  const x = (1 - t) ** 2 * TOWER_L + 2 * (1 - t) * t * ((TOWER_L + TOWER_R) / 2) + t ** 2 * TOWER_R;
  const y = (1 - t) ** 2 * TOWER_TOP + 2 * (1 - t) * t * SAG + t ** 2 * TOWER_TOP;
  return { x: r1(x), y: r1(y) };
});

// Rain streaks, spread over a band taller than the scene so the loop is seamless.
const RAIN = Array.from({ length: 90 }, () => ({
  x: r1(rand() * (W + 120)),
  y: r1(-120 + rand() * (H + 120)),
  len: r1(10 + rand() * 14),
}));

const CROWS = [
  { x: 0, y: 0, s: 1, d: 0 },
  { x: 22, y: -8, s: 0.8, d: 0.12 },
  { x: 40, y: 6, s: 0.9, d: 0.25 },
  { x: -20, y: 10, s: 0.7, d: 0.18 },
  { x: 60, y: -4, s: 0.65, d: 0.05 },
];

const layer = (px: number): React.CSSProperties => ({
  transform: `translateY(calc((var(--hf-p, 0.5) - 0.5) * ${px}px))`,
});

function Plane({ flip = false }: { flip?: boolean }) {
  return (
    <g transform={flip ? 'scale(-1 1)' : undefined}>
      <path d="M-46 0 C -40 -7, 30 -7, 44 -2 C 50 0, 50 2, 44 4 C 30 7, -40 7, -46 0 Z" fill="#D4D4D4" />
      <path d="M-6 1 L 14 1 L -4 22 L -14 22 Z" fill="#A3A3A3" />
      <path d="M-44 -1 L -36 -1 L -48 -20 L -54 -20 Z" fill="#A3A3A3" />
      {[-24, -16, -8, 0, 8, 16, 24].map((x) => (
        <rect key={x} x={x} y={-3} width="4" height="2.5" rx="1" fill="#0A0A0A" opacity="0.6" />
      ))}
      <circle className="hf-anim hf-blink" cx="-12" cy="22" r="2.4" fill="#FFFFFF" />
      <circle className="hf-anim hf-blink" cx="-52" cy="-20" r="2" fill="#FFFFFF" style={{ animationDelay: '0.6s' }} />
    </g>
  );
}

function Cloud({ scale = 1, shade = '#262626' }: { scale?: number; shade?: string }) {
  return (
    <g transform={`scale(${scale})`} filter="url(#hf-soft)" fill={shade}>
      <ellipse cx="0" cy="0" rx="90" ry="22" />
      <ellipse cx="-40" cy="-12" rx="46" ry="24" />
      <ellipse cx="24" cy="-18" rx="56" ry="28" />
      <ellipse cx="78" cy="-4" rx="40" ry="18" />
    </g>
  );
}

function Gargoyle({ flip = false }: { flip?: boolean }) {
  // A small, abstract crouching stone figure for building ledges.
  return (
    <g transform={flip ? 'scale(-1 1)' : undefined} fill="#0F0F0F">
      <path d="M0 0 L 4 -10 C 8 -16, 16 -16, 18 -10 L 22 -12 L 21 -6 L 16 -4 L 14 0 Z" />
      <path d="M4 -10 L -6 -22 L 2 -14 Z" />
      <circle cx="17" cy="-9" r="0.9" fill="#BDBDBD" />
    </g>
  );
}

export default function HeroScene({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      className={cn('block h-[240px] w-full sm:h-auto', className)}
      style={{ overflow: 'visible' }}
      role="img"
      aria-label="Animated noir city at night: gothic towers, searchlights, fog, rain and passing planes, crows and an airship, seen from a rooftop with a laptop and a flag"
    >
      <defs>
        <pattern id="hf-win" width="12" height="18" patternUnits="userSpaceOnUse">
          <rect x="7" y="12" width="5" height="8" fill="#FFFFFF" opacity="0.07" />
        </pattern>
        <linearGradient id="hf-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hf-search" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.26" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hf-trail" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hf-exhaust" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.7" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="hf-moonglow">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.28" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hf-night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000000" stopOpacity="0" />
          <stop offset="0.3" stopColor="#000000" stopOpacity="0.92" />
          <stop offset="1" stopColor="#000000" stopOpacity="1" />
        </linearGradient>
        <filter id="hf-soft" x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="hf-fogblur" x="-20%" y="-200%" width="140%" height="500%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>

      <rect x="0" y="0" width={W} height={H} fill="url(#hf-night)" />

      {/* ---------- Sky (moves the most) ---------- */}
      <g style={layer(70)}>
        {STARS.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill="#F5F5F5"
            opacity={s.twinkle ? undefined : 0.5}
            className={s.twinkle ? 'hf-anim hf-twinkle' : undefined}
            style={s.twinkle ? { animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s` } : undefined}
          />
        ))}

        {/* Lightning: a faint sky flash and a bolt, every so often */}
        <rect className="hf-anim hf-flash" x="0" y="0" width={W} height="380" fill="#D4D4D4" />
        <path
          className="hf-anim hf-bolt"
          d="M270 40 L 252 110 L 272 112 L 246 196 L 270 198 L 238 300"
          fill="none"
          stroke="#E5E5E5"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Moon with glow */}
        <circle cx="1170" cy="108" r="120" fill="url(#hf-moonglow)" />
        <circle cx="1170" cy="108" r="56" fill="#E5E5E5" />
        <circle cx="1150" cy="94" r="9" fill="#BDBDBD" />
        <circle cx="1188" cy="126" r="13" fill="#BDBDBD" />
        <circle cx="1184" cy="84" r="5" fill="#BDBDBD" />

        {/* Drifting clouds (one crosses the moon) */}
        <g transform="translate(200 120)">
          <g className="hf-anim hf-cloud" style={{ animationDuration: '110s', animationDelay: '-40s' }}>
            <Cloud scale={1.2} shade="#2A2A2A" />
          </g>
        </g>
        <g transform="translate(700 70)">
          <g className="hf-anim hf-cloud" style={{ animationDuration: '150s', animationDelay: '-95s' }}>
            <Cloud scale={0.9} shade="#232323" />
          </g>
        </g>
        <g transform="translate(400 190)">
          <g className="hf-anim hf-cloud" style={{ animationDuration: '90s', animationDelay: '-10s' }}>
            <Cloud scale={0.7} shade="#1F1F1F" />
          </g>
        </g>

        {/* Shooting stars */}
        <g transform="translate(1120 40)">
          <g className="hf-anim hf-shoot">
            <line x1="0" y1="0" x2="120" y2="-60" stroke="url(#hf-trail)" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </g>
        <g transform="translate(640 24)">
          <g className="hf-anim hf-shoot" style={{ animationDelay: '6s', animationDuration: '13s' }}>
            <line x1="0" y1="0" x2="100" y2="-50" stroke="url(#hf-trail)" strokeWidth="2" strokeLinecap="round" />
          </g>
        </g>

        {/* Satellite */}
        <g transform="translate(200 52)">
          <g className="hf-anim hf-satellite">
            <rect x="-6" y="-2" width="4" height="4" fill="#BDBDBD" />
            <rect x="-1" y="-3" width="3" height="6" fill="#F5F5F5" />
            <rect x="3" y="-2" width="4" height="4" fill="#BDBDBD" />
            <circle className="hf-anim hf-blink" cx="0.5" cy="-5" r="1.4" fill="#FFFFFF" />
          </g>
        </g>

        {/* Airship with a banner */}
        <g transform="translate(980 46)">
          <g className="hf-anim hf-airship">
            <ellipse cx="0" cy="0" rx="62" ry="17" fill="#3D3D3D" />
            <path d="M-62 0 C -40 -6, 40 -6, 62 0" fill="none" stroke="#595959" strokeWidth="1.5" />
            <path d="M56 -4 L 76 -16 L 72 0 L 76 16 L 56 4 Z" fill="#2E2E2E" />
            <rect x="-14" y="15" width="28" height="7" rx="2" fill="#262626" />
            <circle className="hf-anim hf-blink" cx="-60" cy="0" r="2" fill="#FFFFFF" />
            <line x1="-10" y1="22" x2="-30" y2="40" stroke="#595959" strokeWidth="1" />
            <line x1="10" y1="22" x2="30" y2="40" stroke="#595959" strokeWidth="1" />
            <rect x="-50" y="40" width="100" height="14" fill="#E5E5E5" />
            <text x="0" y="50.5" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontSize="9" fontWeight="900" fill="#0A0A0A">
              HACK THE NIGHT
            </text>
          </g>
        </g>

        {/* Planes */}
        <g transform="translate(200 96)">
          <g className="hf-anim hf-fly-right">
            <Plane />
          </g>
        </g>
        <g transform="translate(1100 170) scale(0.62)">
          <g className="hf-anim hf-fly-left">
            <Plane flip />
          </g>
        </g>

        {/* Crows */}
        <g transform="translate(120 150)">
          <g className="hf-anim hf-flock">
            {CROWS.map((c, i) => (
              <g key={i} transform={`translate(${c.x} ${c.y}) scale(${c.s})`}>
                <path
                  className="hf-anim hf-flap"
                  d="M-9 0 Q -4.5 -6 0 0 Q 4.5 -6 9 0"
                  fill="none"
                  stroke="#BDBDBD"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  style={{ animationDelay: `${c.d}s` }}
                />
              </g>
            ))}
          </g>
        </g>

        {/* UFO */}
        <g transform="translate(330 210)">
          <g className="hf-anim hf-ufo-drift">
            <g className="hf-anim hf-bob">
              <path className="hf-anim hf-beam" d="M-18 8 L 18 8 L 46 120 L -46 120 Z" fill="url(#hf-beam)" />
              <ellipse cx="0" cy="-6" rx="15" ry="11" fill="#BDBDBD" />
              <ellipse cx="0" cy="-9" rx="7" ry="4" fill="#F5F5F5" opacity="0.7" />
              <ellipse cx="0" cy="2" rx="36" ry="9" fill="#E5E5E5" />
              <ellipse cx="0" cy="5" rx="24" ry="4" fill="#A3A3A3" />
              {[-24, -12, 0, 12, 24].map((x, i) => (
                <circle key={x} className="hf-anim hf-blink" cx={x} cy={2} r={2} fill="#0A0A0A" style={{ animationDelay: `${i * 0.25}s` }} />
              ))}
            </g>
          </g>
        </g>

        {/* Rocket (launches from behind the skyline) */}
        <g transform="translate(150 430)">
          <g className="hf-anim hf-rocket">
            <g transform="rotate(-24)">
              <rect className="hf-anim hf-flame" x="-74" y="-4" width="40" height="8" rx="4" fill="url(#hf-exhaust)" />
              <path d="M-34 -9 L 14 -9 C 28 -9, 40 -4, 46 0 C 40 4, 28 9, 14 9 L -34 9 Z" fill="#F5F5F5" />
              <circle cx="12" cy="0" r="4" fill="#0A0A0A" />
              <circle cx="12" cy="0" r="2" fill="#A3A3A3" />
              <path d="M-34 -9 L -46 -20 L -22 -9 Z" fill="#A3A3A3" />
              <path d="M-34 9 L -46 20 L -22 9 Z" fill="#A3A3A3" />
            </g>
          </g>
        </g>
      </g>

      {/* ---------- Far city ---------- */}
      <g style={layer(40)}>
        {BACK.map((b, i) => {
          const top = BASE - b.h;
          return (
            <g key={`back-${i}`} fill="#1C1C1C">
              <rect x={b.x} y={top} width={b.w} height={b.h} />
              {b.gothic && <path d={`M${b.x} ${top} L ${r1(b.x + b.w / 2)} ${top - Math.min(46, b.w * 0.8)} L ${r1(b.x + b.w)} ${top} Z`} />}
              {b.antenna && !b.gothic && <rect x={r1(b.x + b.w / 2 - 1)} y={top - 18} width="2" height="18" />}
            </g>
          );
        })}

        {/* Searchlights sweeping the sky (behind the front row) */}
        {[
          { x: 470, dur: '9s', delay: '0s' },
          { x: 960, dur: '11s', delay: '-4s' },
          { x: 1250, dur: '8s', delay: '-2s' },
        ].map((s) => (
          <polygon
            key={s.x}
            className="hf-anim hf-sweep"
            points={`${s.x - 5},${BASE} ${s.x + 5},${BASE} ${s.x + 70},${BASE - 560} ${s.x - 70},${BASE - 560}`}
            fill="url(#hf-search)"
            style={{ transformOrigin: `${s.x}px ${BASE}px`, animationDuration: s.dur, animationDelay: s.delay }}
          />
        ))}

        {/* Fog between the rows */}
        <g className="hf-anim hf-fog" filter="url(#hf-fogblur)" fill="#FFFFFF" opacity="0.07">
          <ellipse cx="300" cy="396" rx="320" ry="26" />
          <ellipse cx="900" cy="404" rx="380" ry="24" />
          <ellipse cx="1400" cy="392" rx="300" ry="26" />
        </g>
      </g>

      {/* ---------- Near city ---------- */}
      <g style={layer(20)}>
        {/* River under the bridge */}
        <rect x="-10" y="404" width="430" height="50" fill="#101010" />
        {[20, 70, 130, 190, 250, 320, 370].map((x, i) => (
          <rect key={x} x={x} y={418 + (i % 3) * 9} width={22 + (i % 2) * 14} height="2" rx="1" fill="#FFFFFF" opacity="0.12" />
        ))}

        {/* Suspension bridge */}
        <g fill="none" stroke="#3D3D3D" strokeWidth="2">
          <path d={`M-20 ${DECK - 40} Q ${(TOWER_L - 20) / 2} ${TOWER_TOP + 20} ${TOWER_L} ${TOWER_TOP}`} />
          <path d={`M${TOWER_L} ${TOWER_TOP} Q ${(TOWER_L + TOWER_R) / 2} ${SAG} ${TOWER_R} ${TOWER_TOP}`} />
          <path d={`M${TOWER_R} ${TOWER_TOP} Q ${TOWER_R + 60} ${TOWER_TOP + 30} 430 ${DECK - 30}`} />
          {SUSPENDERS.map((p) => (
            <line key={p.x} x1={p.x} y1={p.y} x2={p.x} y2={DECK} strokeWidth="1" />
          ))}
        </g>
        {[TOWER_L, TOWER_R].map((x) => (
          <g key={x} fill="#2A2A2A">
            <rect x={x - 9} y={TOWER_TOP - 8} width="6" height={GROUND - TOWER_TOP + 8} />
            <rect x={x + 3} y={TOWER_TOP - 8} width="6" height={GROUND - TOWER_TOP + 8} />
            <rect x={x - 9} y={TOWER_TOP + 6} width="18" height="5" />
            <rect x={x - 9} y={TOWER_TOP + 50} width="18" height="5" />
            <path d={`M${x - 9} ${TOWER_TOP - 8} L ${x} ${TOWER_TOP - 24} L ${x + 9} ${TOWER_TOP - 8} Z`} />
            <circle className="hf-anim hf-blink" cx={x} cy={TOWER_TOP - 26} r="2" fill="#FFFFFF" style={{ animationDelay: x === TOWER_R ? '0.5s' : '0s' }} />
          </g>
        ))}
        <rect x="-20" y={DECK} width="450" height="7" fill="#2A2A2A" />
        {Array.from({ length: 14 }, (_, i) => (
          <circle key={i} cx={10 + i * 30} cy={DECK + 3.5} r="1.4" fill="#FFFFFF" opacity="0.55" />
        ))}

        {/* Front row */}
        {FRONT.map((b, i) => {
          const top = BASE - b.h;
          return (
            <g key={`front-${i}`}>
              <rect x={b.x} y={top} width={b.w} height={b.h} fill="#131313" />
              <rect x={b.x} y={top} width={b.w} height={b.h} fill="url(#hf-win)" />
              {b.setback && <rect x={r1(b.x + b.w * 0.18)} y={top - 22} width={r1(b.w * 0.64)} height="22" fill="#131313" />}
              {b.gothic && !b.setback && (
                <path d={`M${b.x} ${top} L ${r1(b.x + b.w / 2)} ${top - 30} L ${r1(b.x + b.w)} ${top} Z`} fill="#131313" />
              )}
              {b.antenna && (
                <rect x={r1(b.x + b.w / 2 - 1)} y={top - (b.setback ? 22 : 0) - 26} width="2" height="26" fill="#131313" />
              )}
              {b.waterTower && !b.setback && !b.gothic && (
                <g fill="#131313">
                  <rect x={r1(b.x + b.w * 0.25)} y={top - 22} width="16" height="16" rx="2" />
                  <path d={`M${r1(b.x + b.w * 0.25 - 2)} ${top - 22} L ${r1(b.x + b.w * 0.25 + 8)} ${top - 32} L ${r1(b.x + b.w * 0.25 + 18)} ${top - 22} Z`} />
                  <rect x={r1(b.x + b.w * 0.25 + 2)} y={top - 6} width="2" height="6" />
                  <rect x={r1(b.x + b.w * 0.25 + 12)} y={top - 6} width="2" height="6" />
                </g>
              )}
            </g>
          );
        })}

        {/* Landmark towers */}
        <g fill="#0F0F0F">
          {/* Setback tower with a spire */}
          <rect x={SPIRE.x} y={BASE - SPIRE.h} width={SPIRE.w} height={SPIRE.h} />
          <rect x={SPIRE.x + 14} y={BASE - SPIRE.h - 60} width={SPIRE.w - 28} height="60" />
          <rect x={SPIRE.x + 28} y={BASE - SPIRE.h - 104} width={SPIRE.w - 56} height="44" />
          <rect x={SPIRE.x + SPIRE.w / 2 - 5} y={BASE - SPIRE.h - 150} width="10" height="46" />
          <rect x={SPIRE.x + SPIRE.w / 2 - 1} y={BASE - SPIRE.h - 200} width="2" height="50" />

          {/* Clock tower */}
          <rect x={CLOCK.x} y={BASE - CLOCK.h} width={CLOCK.w} height={CLOCK.h} />
          <rect x={CLOCK.x + 6} y={BASE - CLOCK.h - 58} width={CLOCK.w - 12} height="58" />
          <path d={`M${CLOCK.x + 2} ${BASE - CLOCK.h - 58} L ${CLOCK.x + CLOCK.w / 2} ${BASE - CLOCK.h - 120} L ${CLOCK.x + CLOCK.w - 2} ${BASE - CLOCK.h - 58} Z`} />
          <rect x={CLOCK.x + CLOCK.w / 2 - 1} y={BASE - CLOCK.h - 146} width="2" height="28" />

          {/* Art-deco crown tower */}
          <rect x={CROWN.x} y={BASE - CROWN.h} width={CROWN.w} height={CROWN.h} />
          {[0, 1, 2, 3].map((k) => {
            const inset = 8 + k * 8;
            const y = BASE - CROWN.h - (k + 1) * 18;
            return (
              <path
                key={k}
                d={`M${CROWN.x + inset} ${y + 18} L ${CROWN.x + inset} ${y + 8} Q ${CROWN.x + CROWN.w / 2} ${y - 6} ${CROWN.x + CROWN.w - inset} ${y + 8} L ${CROWN.x + CROWN.w - inset} ${y + 18} Z`}
              />
            );
          })}
          <path d={`M${CROWN.x + CROWN.w / 2 - 3} ${BASE - CROWN.h - 76} L ${CROWN.x + CROWN.w / 2} ${BASE - CROWN.h - 130} L ${CROWN.x + CROWN.w / 2 + 3} ${BASE - CROWN.h - 76} Z`} />

          {/* Slanted-roof tower */}
          <rect x={SLANT.x} y={BASE - SLANT.h} width={SLANT.w} height={SLANT.h} />
          <path d={`M${SLANT.x} ${BASE - SLANT.h} L ${SLANT.x + SLANT.w} ${BASE - SLANT.h - 58} L ${SLANT.x + SLANT.w} ${BASE - SLANT.h} Z`} />

          {/* Gothic cathedral tower: pinnacles and a tall spire against the moon */}
          <rect x={CATHEDRAL.x} y={BASE - CATHEDRAL.h} width={CATHEDRAL.w} height={CATHEDRAL.h} />
          {[CATHEDRAL.x, CATHEDRAL.x + CATHEDRAL.w - 10].map((px) => (
            <g key={px}>
              <rect x={px} y={BASE - CATHEDRAL.h - 40} width="10" height="40" />
              <path d={`M${px - 1} ${BASE - CATHEDRAL.h - 40} L ${px + 5} ${BASE - CATHEDRAL.h - 66} L ${px + 11} ${BASE - CATHEDRAL.h - 40} Z`} />
            </g>
          ))}
          <rect x={CATHEDRAL.x + 22} y={BASE - CATHEDRAL.h - 70} width="36" height="70" />
          <path d={`M${CATHEDRAL.x + 20} ${BASE - CATHEDRAL.h - 70} L ${CATHEDRAL.x + CATHEDRAL.w / 2} ${BASE - CATHEDRAL.h - 180} L ${CATHEDRAL.x + 60} ${BASE - CATHEDRAL.h - 70} Z`} />
          <rect x={CATHEDRAL.x + CATHEDRAL.w / 2 - 1} y={BASE - CATHEDRAL.h - 200} width="2" height="22" />

          {/* Pencil-thin supertall */}
          <rect x={PENCIL.x} y={BASE - PENCIL.h} width={PENCIL.w} height={PENCIL.h} />
          <rect x={PENCIL.x + 6} y={BASE - PENCIL.h - 14} width={PENCIL.w - 12} height="14" />
        </g>

        {/* Window grids on landmarks */}
        {[SPIRE, CLOCK, CROWN, SLANT, PENCIL].map((t, i) => (
          <rect key={i} x={t.x} y={BASE - t.h} width={t.w} height={t.h} fill="url(#hf-win)" />
        ))}

        {/* Cathedral: lit rose window and pointed-arch windows */}
        <circle cx={ROSE.cx} cy={ROSE.cy} r={ROSE.r} fill="#E5E5E5" opacity="0.85" />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (Math.PI * i) / 4;
          return (
            <line
              key={i}
              x1={ROSE.cx}
              y1={ROSE.cy}
              x2={r1(ROSE.cx + ROSE.r * Math.cos(a))}
              y2={r1(ROSE.cy + ROSE.r * Math.sin(a))}
              stroke="#0F0F0F"
              strokeWidth="1.5"
            />
          );
        })}
        <circle cx={ROSE.cx} cy={ROSE.cy} r="3" fill="#0F0F0F" />
        {[0, 1, 2].map((k) => {
          const x = CATHEDRAL.x + 12 + k * 22;
          const y = BASE - CATHEDRAL.h + 80;
          return (
            <path
              key={k}
              className={k === 1 ? 'hf-anim hf-window' : undefined}
              d={`M${x} ${y + 40} L ${x} ${y + 10} Q ${x + 6} ${y - 4} ${x + 12} ${y + 10} L ${x + 12} ${y + 40} Z`}
              fill="#FFFFFF"
              opacity={k === 1 ? undefined : 0.6}
              style={k === 1 ? { animationDuration: '9s' } : undefined}
            />
          );
        })}

        {/* Gargoyles on the cathedral and crown ledges */}
        <g transform={`translate(${CATHEDRAL.x - 14} ${BASE - CATHEDRAL.h})`}>
          <Gargoyle flip />
        </g>
        <g transform={`translate(${CATHEDRAL.x + CATHEDRAL.w + 14} ${BASE - CATHEDRAL.h})`}>
          <Gargoyle />
        </g>
        <g transform={`translate(${CROWN.x - 12} ${BASE - CROWN.h})`}>
          <Gargoyle flip />
        </g>

        {/* Clock face with moving hands */}
        <circle cx={CLOCK_FACE.cx} cy={CLOCK_FACE.cy} r={CLOCK_FACE.r + 3} fill="#0F0F0F" />
        <circle cx={CLOCK_FACE.cx} cy={CLOCK_FACE.cy} r={CLOCK_FACE.r} fill="#E5E5E5" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (Math.PI * i) / 6;
          return (
            <line
              key={i}
              x1={r1(CLOCK_FACE.cx + (CLOCK_FACE.r - 4) * Math.cos(a))}
              y1={r1(CLOCK_FACE.cy + (CLOCK_FACE.r - 4) * Math.sin(a))}
              x2={r1(CLOCK_FACE.cx + (CLOCK_FACE.r - 1.5) * Math.cos(a))}
              y2={r1(CLOCK_FACE.cy + (CLOCK_FACE.r - 1.5) * Math.sin(a))}
              stroke="#0A0A0A"
              strokeWidth="1.5"
            />
          );
        })}
        <line
          className="hf-anim hf-hand-hour"
          x1={CLOCK_FACE.cx}
          y1={CLOCK_FACE.cy}
          x2={CLOCK_FACE.cx}
          y2={CLOCK_FACE.cy - 8}
          stroke="#0A0A0A"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ transformOrigin: `${CLOCK_FACE.cx}px ${CLOCK_FACE.cy}px` }}
        />
        <line
          className="hf-anim hf-hand-minute"
          x1={CLOCK_FACE.cx}
          y1={CLOCK_FACE.cy}
          x2={CLOCK_FACE.cx}
          y2={CLOCK_FACE.cy - 13}
          stroke="#0A0A0A"
          strokeWidth="1.6"
          strokeLinecap="round"
          style={{ transformOrigin: `${CLOCK_FACE.cx}px ${CLOCK_FACE.cy}px` }}
        />
        <circle cx={CLOCK_FACE.cx} cy={CLOCK_FACE.cy} r="1.8" fill="#0A0A0A" />

        {/* Aircraft-warning lights */}
        <circle className="hf-anim hf-blink" cx={SPIRE.x + SPIRE.w / 2} cy={BASE - SPIRE.h - 202} r="2.6" fill="#FFFFFF" />
        <circle className="hf-anim hf-blink" cx={CROWN.x + CROWN.w / 2} cy={BASE - CROWN.h - 132} r="2.2" fill="#FFFFFF" style={{ animationDelay: '0.4s' }} />
        <circle className="hf-anim hf-blink" cx={PENCIL.x + PENCIL.w / 2} cy={BASE - PENCIL.h - 16} r="2.2" fill="#FFFFFF" style={{ animationDelay: '0.8s' }} />
        <circle className="hf-anim hf-blink" cx={CATHEDRAL.x + CATHEDRAL.w / 2} cy={BASE - CATHEDRAL.h - 202} r="2" fill="#FFFFFF" style={{ animationDelay: '1.1s' }} />

        {/* Lit windows (some flicker on and off) */}
        {WINDOWS.map((w, i) => (
          <rect
            key={i}
            x={w.x}
            y={w.y}
            width="5"
            height="8"
            fill="#FFFFFF"
            opacity={w.flicker ? undefined : 0.85}
            className={w.flicker ? 'hf-anim hf-window' : undefined}
            style={w.flicker ? { animationDelay: `${w.delay}s`, animationDuration: `${w.dur}s` } : undefined}
          />
        ))}

        {/* Low fog rolling through the streets */}
        <g className="hf-anim hf-fog" filter="url(#hf-fogblur)" fill="#FFFFFF" opacity="0.06" style={{ animationDuration: '38s', animationDelay: '-12s' }}>
          <ellipse cx="600" cy="440" rx="360" ry="18" />
          <ellipse cx="1200" cy="436" rx="300" ry="20" />
        </g>
      </g>

      {/* ---------- Light rain ---------- */}
      <g className="hf-anim hf-rain" stroke="#BDBDBD" strokeWidth="1" opacity="0.13" strokeLinecap="round">
        {RAIN.map((d, i) => (
          <line key={i} x1={d.x} y1={d.y} x2={r1(d.x - d.len * 0.27)} y2={r1(d.y + d.len)} />
        ))}
      </g>

      {/* ---------- Rooftop in front (fixed): charcoal with a red parapet, to sit in the dark footer ---------- */}
      <rect x="0" y={GROUND - 6} width={W} height="8" fill="#ec3750" />
      <rect x="0" y={GROUND + 2} width={W} height={H - GROUND} fill="#252429" />
      {Array.from({ length: 24 }, (_, i) => (
        <rect key={i} x={i * 62} y={GROUND - 6} width="2" height="8" fill="#9b1830" />
      ))}

      <g fill="#0A0A0A">
        <rect x="140" y={GROUND - 26} width="34" height="20" rx="2" />
        <rect x="150" y={GROUND - 36} width="14" height="10" />
        <rect x="190" y={GROUND - 16} width="22" height="10" rx="2" />
        <rect x="340" y={GROUND - 70} width="3" height="64" />
        <path
          d={`M341.5 ${GROUND - 50} L 326 ${GROUND - 64} M341.5 ${GROUND - 50} L 357 ${GROUND - 64} M341.5 ${GROUND - 36} L 332 ${GROUND - 44} M341.5 ${GROUND - 36} L 351 ${GROUND - 44}`}
          stroke="#0A0A0A"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle className="hf-anim hf-blink" cx="341.5" cy={GROUND - 72} r="2" fill="#FFFFFF" />
      </g>

      <g transform={`translate(600 ${GROUND - 78})`}>
        <rect x="0" y="0" width="110" height="68" rx="8" fill="#0A0A0A" stroke="#F5F5F5" strokeWidth="4" />
        <text x="55" y="44" textAnchor="middle" fontFamily="Consolas, monospace" fontSize="26" fontWeight="700" fill="#FFFFFF">
          {'</>'}
        </text>
        <path d="M-14 72 L124 72 L114 84 L-4 84 Z" fill="#0A0A0A" />
      </g>

      <rect x="760" y={GROUND - 120} width="5" height="120" fill="#0A0A0A" />
      <g className="hf-anim hf-wave" style={{ transformOrigin: `765px ${GROUND - 112}px` }}>
        <path d={`M765 ${GROUND - 118} L840 ${GROUND - 100} L765 ${GROUND - 80} Z`} fill="#0A0A0A" />
        <text x="784" y={GROUND - 94} fontFamily="Arial Black, Arial, sans-serif" fontSize="14" fontWeight="900" fill="#FFFFFF">
          HF
        </text>
      </g>

      <g fill="#0A0A0A" transform={`translate(1210 ${GROUND - 112})`}>
        <path d="M-4 30 L 30 10 L 64 30 Z" />
        <rect x="0" y="30" width="60" height="44" rx="4" />
        <rect x="0" y="42" width="60" height="3" fill="#F5F5F5" opacity="0.35" />
        <rect x="0" y="58" width="60" height="3" fill="#F5F5F5" opacity="0.35" />
        <rect x="6" y="74" width="4" height="38" />
        <rect x="28" y="74" width="4" height="38" />
        <rect x="50" y="74" width="4" height="38" />
        <path d="M8 84 L 52 100 M52 84 L 8 100" stroke="#0A0A0A" strokeWidth="2" />
      </g>
    </svg>
  );
}
