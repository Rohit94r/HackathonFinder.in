import { PosterArt, type PosterData } from './art';
import { SmartSearchInput } from './smart-search-input';
import { InlineStyle } from './inline-style';

const TILE_COUNT = 36;

/**
 * "Imagine typing what you need and getting it": smart search, floating on a wall of
 * hackathon posters. `example` is a real query run against today's listings.
 */
export function SmartSearchShowcase({
  posters,
  example,
}: {
  posters: PosterData[];
  example: { query: string; understood: string[]; matches: number };
}) {
  const tiles = Array.from({ length: TILE_COUNT }, (_, i) => posters[i % posters.length]);

  return (
    <section style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Fade in from the section above */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 180,
          background: 'linear-gradient(180deg, var(--background) 0%, transparent 100%)',
          zIndex: 3,
          pointerEvents: 'none',
        }}
      />

      {/* Poster wall */}
      <div
        aria-hidden="true"
        className="poster-wall"
        style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gridAutoRows: 230, gap: 6, zIndex: 0 }}
      >
        {tiles.map((poster, i) => (
          <div key={i} style={{ overflow: 'hidden', borderRadius: 4 }}>
            <PosterArt poster={poster} compact />
          </div>
        ))}
      </div>

      {/* Card floating over the wall */}
      <div
        style={{
          position: 'relative',
          zIndex: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          paddingTop: 'clamp(160px, 20vw, 320px)',
          paddingBottom: 'clamp(160px, 20vw, 320px)',
          paddingLeft: 24,
          paddingRight: 24,
        }}
      >
        <div
          style={{
            background: 'var(--elevated)',
            borderRadius: 24,
            padding: 'clamp(32px, 5vw, 60px) clamp(24px, 5vw, 60px)',
            width: 'min(640px, calc(100vw - 48px))',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: 'var(--float-shadow)',
          }}
        >
          <h2 style={{ fontFamily: 'var(--lp-serif)', fontWeight: 'normal', fontSize: 40, lineHeight: 1.05, color: 'var(--foreground)', margin: '0 auto 28px', maxWidth: 640 }}>
            Imagine typing what you need
            <span className="video-headline-break" style={{ display: 'inline' }}>
              {' '}
            </span>
            <span
              style={{
                background: 'linear-gradient(90deg, #ec3750 0%, #ff6b81 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              and getting it:
            </span>
          </h2>

          {/* Worked example */}
          <div
            style={{
              width: '100%',
              borderRadius: 16,
              background: 'var(--example-bg)',
              color: '#fff6eb',
              padding: '22px 24px',
              marginBottom: 28,
              textAlign: 'left',
              fontFamily: 'var(--lp-sans)',
            }}
          >
            <p style={{ margin: 0, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.6 }}>You type</p>
            <p style={{ margin: '6px 0 16px', fontSize: 21, lineHeight: 1.3 }}>
              “{example.query}”<span className="caret" aria-hidden="true" />
            </p>
            <p style={{ margin: 0, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.6 }}>We understand</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {example.understood.map((u) => (
                <span key={u} style={{ background: '#ec3750', color: '#ffffff', borderRadius: 999, padding: '4px 12px', fontSize: 15, fontWeight: 700 }}>
                  {u}
                </span>
              ))}
              <span style={{ background: 'rgba(255,246,235,0.14)', borderRadius: 999, padding: '4px 12px', fontSize: 15, fontWeight: 700 }}>
                → {example.matches} {example.matches === 1 ? 'match' : 'matches'} today
              </span>
            </div>
          </div>

          <div style={{ marginBottom: 12, width: '100%', display: 'flex', justifyContent: 'center' }}>
            <SmartSearchInput variant="showcase" showParsed />
          </div>

          <p style={{ fontFamily: 'var(--lp-sans)', fontStyle: 'italic', fontSize: 16, color: 'var(--muted)', margin: 0 }}>
            Coming soon: save a search and get an alert when new matches appear.
          </p>
        </div>
      </div>

      {/* Fade out into the next section */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 280,
          background: 'linear-gradient(0deg, var(--background) 40%, transparent 100%)',
          zIndex: 3,
          pointerEvents: 'none',
        }}
      />

      <InlineStyle css={`
        .caret {
          display: inline-block;
          width: 2px;
          height: 1.05em;
          margin-left: 3px;
          vertical-align: -0.15em;
          background: #ec3750;
          animation: lp-caret 1s steps(1) infinite;
        }
        @keyframes lp-caret { 50% { opacity: 0; } }
        @media (max-width: 767px) {
          .poster-wall { grid-template-columns: repeat(3, 1fr) !important; grid-auto-rows: 180px !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .caret { animation: none; }
        }
      `} />
    </section>
  );
}
