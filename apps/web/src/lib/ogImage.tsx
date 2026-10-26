import { ImageResponse } from 'next/og';

export const OG_SIZE = { width: 1200, height: 630 };

/** The share card used by social sites and chat apps: brand red and white on charcoal. */
export function ogCard({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#121217', padding: 72, color: '#ffffff', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 14, background: '#ec3750', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 800 }}>H</div>
          <div style={{ fontSize: 34, fontWeight: 700 }}>HackathonFinder</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#ec3750', textTransform: 'uppercase', letterSpacing: 3 }}>{eyebrow}</div>
          <div style={{ fontSize: title.length > 60 ? 56 : 68, fontWeight: 800, lineHeight: 1.08 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 28, color: '#c9c9d1', lineHeight: 1.35 }}>{subtitle}</div>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 26, color: '#c9c9d1' }}>
          <span>hackathonfinder.in</span>
          <span>Every hackathon. One place.</span>
        </div>
      </div>
    ),
    OG_SIZE
  );
}
