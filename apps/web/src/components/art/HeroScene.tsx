import { cn } from '@/lib/cn';

/*
 * Original night-city scene: a dense skyline with landmark-style towers, a
 * suspension bridge, a rooftop "hack spot" in front, and animated sky traffic
 * (twinkling stars, shooting stars, planes, a UFO, a rocket and a satellite).
 * Everything is generated from a fixed seed so server and browser match.
 */

const W = 1440;
const GROUND = 450; // top of the rooftop in front
const SKYLINE_BASE = 452;

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

interface Star {
  x: number;
  y: number;
  r: number;
  twinkle: boolean;
  delay: number;
  dur: number;
}

interface Building {
  x: number;
  w: number;
  h: number;
  setback: boolean;
  waterTower: boolean;
  antenna: boolean;
}

interface LitWindow {
  x: number;
  y: number;
  flicker: boolean;
  delay: number;
  dur: number;
}

const rand = mulberry32(20261021);

const STARS: Star[] = Array.from({ length: 80 }, () => ({
  x: r1(rand() * W),
  y: r1(rand() * 300),
  r: r1(0.7 + rand() * 1.5),
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
      setback: rand() < 0.35,
      waterTower: h < minH + (maxH - minH) * 0.45 && rand() < 0.45,
      antenna: rand() < 0.25,
    });
    x += w + Math.floor(rand() * 4);
  }
  return row;
}

// Back row: lighter and shorter, spans the full width (also behind the bridge).
const BACK = makeRow(-20, W + 20, 30, 70, 70, 210);
// Front row: darker, with windows; starts right of the bridge.
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

const FRONT_WINDOWS: LitWindow[] = FRONT.flatMap((b) => litWindowsFor(b.x, SKYLINE_BASE - b.h, b.w, b.h, 0.13));

// Landmark-style towers (generic shapes, drawn on top of the front row).
const SPIRE = { x: 512, w: 92, h: 210 };
const CROWN = { x: 798, w: 72, h: 250 };
const SLANT = { x: 1002, w: 84, h: 236 };
const PENCIL = { x: 1296, w: 34, h: 318 };
const LANDMARK_WINDOWS: LitWindow[] = [
  ...litWindowsFor(SPIRE.x, SKYLINE_BASE - SPIRE.h, SPIRE.w, SPIRE.h, 0.16),
  ...litWindowsFor(CROWN.x, SKYLINE_BASE - CROWN.h, CROWN.w, CROWN.h, 0.16),
  ...litWindowsFor(SLANT.x, SKYLINE_BASE - SLANT.h, SLANT.w, SLANT.h, 0.16),
  ...litWindowsFor(PENCIL.x, SKYLINE_BASE - PENCIL.h, PENCIL.w, PENCIL.h, 0.2),
];

// Suspension bridge (left side, over the river).
const BRIDGE_DECK = 396;
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

function Plane({ flip = false }: { flip?: boolean }) {
  return (
    <g transform={flip ? 'scale(-1 1)' : undefined}>
      {/* fuselage */}
      <path d="M-46 0 C -40 -7, 30 -7, 44 -2 C 50 0, 50 2, 44 4 C 30 7, -40 7, -46 0 Z" fill="#D4D4D4" />
      {/* wing */}
      <path d="M-6 1 L 14 1 L -4 22 L -14 22 Z" fill="#A3A3A3" />
      {/* tail */}
      <path d="M-44 -1 L -36 -1 L -48 -20 L -54 -20 Z" fill="#A3A3A3" />
      {/* windows */}
      {[-24, -16, -8, 0, 8, 16, 24].map((x) => (
        <rect key={x} x={x} y={-3} width="4" height="2.5" rx="1" fill="#0A0A0A" opacity="0.6" />
      ))}
      {/* blinking lights */}
      <circle className="hf-anim hf-blink" cx="-12" cy="22" r="2.4" fill="#FFFFFF" />
      <circle className="hf-anim hf-blink" cx="-52" cy="-20" r="2" fill="#FFFFFF" style={{ animationDelay: '0.6s' }} />
    </g>
  );
}

export default function HeroScene({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${W} 520`}
      preserveAspectRatio="xMidYMax slice"
      className={cn('block h-[240px] w-full sm:h-auto', className)}
      role="img"
      aria-label="Animated night city skyline with twinkling stars, planes, a UFO and a rocket, seen from a rooftop with a laptop and a flag"
    >
      <defs>
        <pattern id="hf-win" width="12" height="18" patternUnits="userSpaceOnUse">
          <rect x="7" y="12" width="5" height="8" fill="#FFFFFF" opacity="0.07" />
        </pattern>
        <linearGradient id="hf-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.55" />
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
      </defs>

      {/* Stars */}
      {STARS.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill="#F5F5F5"
          opacity={s.twinkle ? undefined : 0.55}
          className={s.twinkle ? 'hf-anim hf-twinkle' : undefined}
          style={s.twinkle ? { animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s` } : undefined}
        />
      ))}

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

      {/* Moon */}
      <circle cx="1170" cy="108" r="56" fill="#E5E5E5" />
      <circle cx="1150" cy="94" r="9" fill="#BDBDBD" />
      <circle cx="1188" cy="126" r="13" fill="#BDBDBD" />
      <circle cx="1184" cy="84" r="5" fill="#BDBDBD" />

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

      {/* Back skyline */}
      {BACK.map((b, i) => (
        <g key={`back-${i}`}>
          <rect x={b.x} y={SKYLINE_BASE - b.h} width={b.w} height={b.h} fill="#1C1C1C" />
          {b.antenna && <rect x={r1(b.x + b.w / 2 - 1)} y={SKYLINE_BASE - b.h - 18} width="2" height="18" fill="#1C1C1C" />}
        </g>
      ))}

      {/* River under the bridge */}
      <rect x="-10" y="404" width="430" height="50" fill="#101010" />
      {[20, 70, 130, 190, 250, 320, 370].map((x, i) => (
        <rect key={x} x={x} y={418 + (i % 3) * 9} width={22 + (i % 2) * 14} height="2" rx="1" fill="#FFFFFF" opacity="0.12" />
      ))}

      {/* Suspension bridge */}
      <g fill="none" stroke="#3D3D3D" strokeWidth="2">
        <path d={`M-20 ${BRIDGE_DECK - 40} Q ${(TOWER_L - 20) / 2} ${TOWER_TOP + 20} ${TOWER_L} ${TOWER_TOP}`} />
        <path d={`M${TOWER_L} ${TOWER_TOP} Q ${(TOWER_L + TOWER_R) / 2} ${SAG} ${TOWER_R} ${TOWER_TOP}`} />
        <path d={`M${TOWER_R} ${TOWER_TOP} Q ${TOWER_R + 60} ${TOWER_TOP + 30} 430 ${BRIDGE_DECK - 30}`} />
        {SUSPENDERS.map((p) => (
          <line key={p.x} x1={p.x} y1={p.y} x2={p.x} y2={BRIDGE_DECK} strokeWidth="1" />
        ))}
      </g>
      {[TOWER_L, TOWER_R].map((x) => (
        <g key={x} fill="#2A2A2A">
          <rect x={x - 9} y={TOWER_TOP - 8} width="6" height={GROUND - TOWER_TOP + 8} />
          <rect x={x + 3} y={TOWER_TOP - 8} width="6" height={GROUND - TOWER_TOP + 8} />
          <rect x={x - 9} y={TOWER_TOP + 6} width="18" height="5" />
          <rect x={x - 9} y={TOWER_TOP + 50} width="18" height="5" />
          <path d={`M${x - 9} ${TOWER_TOP - 8} L ${x} ${TOWER_TOP - 20} L ${x + 9} ${TOWER_TOP - 8} Z`} />
          <circle className="hf-anim hf-blink" cx={x} cy={TOWER_TOP - 22} r="2" fill="#FFFFFF" style={{ animationDelay: x === TOWER_R ? '0.5s' : '0s' }} />
        </g>
      ))}
      <rect x="-20" y={BRIDGE_DECK} width="450" height="7" fill="#2A2A2A" />
      {Array.from({ length: 14 }, (_, i) => (
        <circle key={i} cx={10 + i * 30} cy={BRIDGE_DECK + 3.5} r="1.4" fill="#FFFFFF" opacity="0.55" />
      ))}

      {/* Front skyline */}
      {FRONT.map((b, i) => {
        const top = SKYLINE_BASE - b.h;
        return (
          <g key={`front-${i}`}>
            <rect x={b.x} y={top} width={b.w} height={b.h} fill="#131313" />
            <rect x={b.x} y={top} width={b.w} height={b.h} fill="url(#hf-win)" />
            {b.setback && <rect x={r1(b.x + b.w * 0.18)} y={top - 22} width={r1(b.w * 0.64)} height="22" fill="#131313" />}
            {b.antenna && (
              <rect x={r1(b.x + b.w / 2 - 1)} y={top - (b.setback ? 22 : 0) - 26} width="2" height="26" fill="#131313" />
            )}
            {b.waterTower && !b.setback && (
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

      {/* Landmark-style towers */}
      <g fill="#0F0F0F">
        {/* Setback tower with a spire */}
        <rect x={SPIRE.x} y={SKYLINE_BASE - SPIRE.h} width={SPIRE.w} height={SPIRE.h} />
        <rect x={SPIRE.x + 14} y={SKYLINE_BASE - SPIRE.h - 60} width={SPIRE.w - 28} height="60" />
        <rect x={SPIRE.x + 28} y={SKYLINE_BASE - SPIRE.h - 104} width={SPIRE.w - 56} height="44" />
        <rect x={SPIRE.x + SPIRE.w / 2 - 5} y={SKYLINE_BASE - SPIRE.h - 150} width="10" height="46" />
        <rect x={SPIRE.x + SPIRE.w / 2 - 1} y={SKYLINE_BASE - SPIRE.h - 200} width="2" height="50" />

        {/* Art-deco crown tower */}
        <rect x={CROWN.x} y={SKYLINE_BASE - CROWN.h} width={CROWN.w} height={CROWN.h} />
        {[0, 1, 2, 3].map((k) => {
          const inset = 8 + k * 8;
          const y = SKYLINE_BASE - CROWN.h - (k + 1) * 18;
          return (
            <path
              key={k}
              d={`M${CROWN.x + inset} ${y + 18} L ${CROWN.x + inset} ${y + 8} Q ${CROWN.x + CROWN.w / 2} ${y - 6} ${CROWN.x + CROWN.w - inset} ${y + 8} L ${CROWN.x + CROWN.w - inset} ${y + 18} Z`}
            />
          );
        })}
        <path d={`M${CROWN.x + CROWN.w / 2 - 3} ${SKYLINE_BASE - CROWN.h - 76} L ${CROWN.x + CROWN.w / 2} ${SKYLINE_BASE - CROWN.h - 130} L ${CROWN.x + CROWN.w / 2 + 3} ${SKYLINE_BASE - CROWN.h - 76} Z`} />

        {/* Slanted-roof tower */}
        <rect x={SLANT.x} y={SKYLINE_BASE - SLANT.h} width={SLANT.w} height={SLANT.h} />
        <path d={`M${SLANT.x} ${SKYLINE_BASE - SLANT.h} L ${SLANT.x + SLANT.w} ${SKYLINE_BASE - SLANT.h - 58} L ${SLANT.x + SLANT.w} ${SKYLINE_BASE - SLANT.h} Z`} />

        {/* Pencil-thin supertall */}
        <rect x={PENCIL.x} y={SKYLINE_BASE - PENCIL.h} width={PENCIL.w} height={PENCIL.h} />
        <rect x={PENCIL.x + 6} y={SKYLINE_BASE - PENCIL.h - 14} width={PENCIL.w - 12} height="14" />
      </g>
      {/* Landmark window grids */}
      {[SPIRE, CROWN, SLANT, PENCIL].map((t, i) => (
        <rect key={i} x={t.x} y={SKYLINE_BASE - t.h} width={t.w} height={t.h} fill="url(#hf-win)" />
      ))}
      {/* Aircraft-warning lights on top of the tallest towers */}
      <circle className="hf-anim hf-blink" cx={SPIRE.x + SPIRE.w / 2} cy={SKYLINE_BASE - SPIRE.h - 202} r="2.6" fill="#FFFFFF" />
      <circle className="hf-anim hf-blink" cx={CROWN.x + CROWN.w / 2} cy={SKYLINE_BASE - CROWN.h - 132} r="2.2" fill="#FFFFFF" style={{ animationDelay: '0.4s' }} />
      <circle className="hf-anim hf-blink" cx={PENCIL.x + PENCIL.w / 2} cy={SKYLINE_BASE - PENCIL.h - 16} r="2.2" fill="#FFFFFF" style={{ animationDelay: '0.8s' }} />

      {/* Lit windows (some flicker on and off) */}
      {[...FRONT_WINDOWS, ...LANDMARK_WINDOWS].map((w, i) => (
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

      {/* Rooftop in front */}
      <rect x="0" y={GROUND - 6} width={W} height="8" fill="#E5E5E5" />
      <rect x="0" y={GROUND + 2} width={W} height={520 - GROUND} fill="#F5F5F5" />
      {Array.from({ length: 24 }, (_, i) => (
        <rect key={i} x={i * 62} y={GROUND - 6} width="2" height="8" fill="#BDBDBD" />
      ))}

      {/* Rooftop props: vents, laptop, flag, water tower */}
      <g fill="#0A0A0A">
        <rect x="140" y={GROUND - 26} width="34" height="20" rx="2" />
        <rect x="150" y={GROUND - 36} width="14" height="10" />
        <rect x="190" y={GROUND - 16} width="22" height="10" rx="2" />
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
