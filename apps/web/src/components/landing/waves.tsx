import type { CSSProperties } from 'react';

/** Mountain-bump wave paths, drawn for a 1920px canvas and stretched to fit. */
const STROKE_UP =
  'M0,18 C40,18 40,2 80,2 C120,2 120,18 160,18 C200,18 200,2 240,2 C280,2 280,18 320,18 C360,18 360,2 400,2 C440,2 440,18 480,18 C520,18 520,2 560,2 C600,2 600,18 640,18 C680,18 680,2 720,2 C760,2 760,18 800,18 C840,18 840,2 880,2 C920,2 920,18 960,18 C1000,18 1000,2 1040,2 C1080,2 1080,18 1120,18 C1160,18 1160,2 1200,2 C1240,2 1240,18 1280,18 C1320,18 1320,2 1360,2 C1400,2 1400,18 1440,18 C1480,18 1480,2 1520,2 C1560,2 1560,18 1600,18 C1640,18 1640,2 1680,2 C1720,2 1720,18 1760,18 C1800,18 1800,2 1840,2 C1880,2 1880,18 1920,18';
const FILL_UP =
  'M0,40 L0,27 C40,27 40,8 80,8 C120,8 120,27 160,27 C200,27 200,8 240,8 C280,8 280,27 320,27 C360,27 360,8 400,8 C440,8 440,27 480,27 C520,27 520,8 560,8 C600,8 600,27 640,27 C680,27 680,8 720,8 C760,8 760,27 800,27 C840,27 840,8 880,8 C920,8 920,27 960,27 C1000,27 1000,8 1040,8 C1080,8 1080,27 1120,27 C1160,27 1160,8 1200,8 C1240,8 1240,27 1280,27 C1320,27 1320,8 1360,8 C1400,8 1400,27 1440,27 C1480,27 1480,8 1520,8 C1560,8 1560,27 1600,27 C1640,27 1640,8 1680,8 C1720,8 1720,27 1760,27 C1800,27 1800,8 1840,8 C1880,8 1880,27 1920,27 L1920,40 Z';
const STROKE_DOWN =
  'M0,2 C40,2 40,18 80,18 C120,18 120,2 160,2 C200,2 200,18 240,18 C280,18 280,2 320,2 C360,2 360,18 400,18 C440,18 440,2 480,2 C520,2 520,18 560,18 C600,18 600,2 640,2 C680,2 680,18 720,18 C760,18 760,2 800,2 C840,2 840,18 880,18 C920,18 920,2 960,2 C1000,2 1000,18 1040,18 C1080,18 1080,2 1120,2 C1160,2 1160,18 1200,18 C1240,18 1240,2 1280,2 C1320,2 1320,18 1360,18 C1400,18 1400,2 1440,2 C1480,2 1480,18 1520,18 C1560,18 1560,2 1600,2 C1640,2 1640,18 1680,18 C1720,18 1720,2 1760,2 C1800,2 1800,18 1840,18 C1880,18 1880,2 1920,2';
const FILL_DOWN =
  'M0,0 L0,8 C40,8 40,27 80,27 C120,27 120,8 160,8 C200,8 200,27 240,27 C280,27 280,8 320,8 C360,8 360,27 400,27 C440,27 440,8 480,8 C520,8 520,27 560,27 C600,27 600,8 640,8 C680,8 680,27 720,27 C760,27 760,8 800,8 C840,8 840,27 880,27 C920,27 920,8 960,8 C1000,8 1000,27 1040,27 C1080,27 1080,8 1120,8 C1160,8 1160,27 1200,27 C1240,27 1240,8 1280,8 C1320,8 1320,27 1360,27 C1400,27 1400,8 1440,8 C1480,8 1480,27 1520,27 C1560,27 1560,8 1600,8 C1640,8 1640,27 1680,27 C1720,27 1720,8 1760,8 C1800,8 1800,27 1840,27 C1880,27 1880,8 1920,8 L1920,0 Z';

/**
 * Wave that rises into the next section: a thin stroke on top, then a filled wave.
 * `color` is the colour of the section below.
 */
export function WaveUp({ color, style }: { color: string; style?: CSSProperties }) {
  return (
    <div className="wave-container" style={{ position: 'absolute', left: 0, right: 0, lineHeight: 0, pointerEvents: 'none', ...style }}>
      <svg viewBox="0 0 1920 22" preserveAspectRatio="none" style={{ width: '100%', height: 22, display: 'block', marginBottom: -8 }} aria-hidden="true">
        <path d={STROKE_UP} fill="none" style={{ stroke: color }} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <svg viewBox="0 0 1920 40" preserveAspectRatio="none" style={{ width: '100%', height: 40, display: 'block' }} aria-hidden="true">
        <path d={FILL_UP} style={{ fill: color }} />
      </svg>
    </div>
  );
}

/** Wave that hangs down from a section into the one below. `color` is the colour of the section above. */
export function WaveDown({ color, style }: { color: string; style?: CSSProperties }) {
  return (
    <div className="wave-container" style={{ position: 'absolute', left: 0, right: 0, lineHeight: 0, pointerEvents: 'none', ...style }}>
      <svg viewBox="0 0 1920 40" preserveAspectRatio="none" style={{ width: '100%', height: 40, display: 'block' }} aria-hidden="true">
        <path d={FILL_DOWN} style={{ fill: color }} />
      </svg>
      <svg
        viewBox="0 0 1920 22"
        preserveAspectRatio="none"
        style={{ width: '100%', height: 22, display: 'block', position: 'absolute', top: 24, left: 0 }}
        aria-hidden="true"
      >
        <path d={STROKE_DOWN} fill="none" style={{ stroke: color }} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
