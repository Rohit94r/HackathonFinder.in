import Image from 'next/image';
import Link from 'next/link';
import { BtnArrowSvg } from './btn-arrow';
import { InlineStyle } from './inline-style';
import { PHOTOS, type Photo } from './photos';
import { WaveUp } from './waves';

export interface CityCount {
  slug: string;
  name: string;
  open: number;
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

const LEFT_TILES = [PHOTOS.crowdStairs, PHOTOS.computerLab, PHOTOS.classroomDesks, PHOTOS.sharedDesk];
const RIGHT_TILES = [PHOTOS.purpleCrowd, PHOTOS.demoHall, PHOTOS.confetti, PHOTOS.stageTalk];

function Mosaic({ photos, className }: { photos: Photo[]; className: string }) {
  return (
    <div className={`ny-mosaic ${className}`} aria-hidden="true">
      {photos.map((photo) => (
        <div key={photo.src} className="ny-tile">
          <Image src={photo.src} alt="" fill sizes="(max-width: 899px) 50vw, 22vw" style={{ objectFit: 'cover' }} />
        </div>
      ))}
    </div>
  );
}

/**
 * "Near you": a big event photo fading in from the section above, with a photo
 * mosaic either side of the near-me call to action.
 */
export function NearYouSection({ cities, totalCities }: { cities: CityCount[]; totalCities: number }) {
  return (
    <section style={{ position: 'relative', background: 'var(--background)' }}>
      <InlineStyle css={`
        .ny-banner { position: relative; height: clamp(280px, 34vw, 520px); }
        .ny-banner::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, var(--background) 0%, transparent 45%);
        }
        .ny-body { display: grid; grid-template-columns: 1fr minmax(0, 660px) 1fr; }
        .ny-card {
          position: relative;
          z-index: 2;
          margin-top: -130px;
          padding: 56px 48px 64px;
          background: var(--background);
          border-radius: 24px 24px 0 0;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .ny-mosaic { display: grid; grid-template-rows: 2fr 3fr; }
        .ny-left { grid-template-columns: 3fr 2fr; }
        .ny-right { grid-template-columns: 2fr 3fr; }
        .ny-tile { position: relative; overflow: hidden; min-height: 150px; }
        .ny-primary { background: var(--foreground); color: var(--background); }
        .ny-outline { border: 2px solid var(--foreground); color: var(--foreground); transition: background 0.3s ease, color 0.3s ease; }
        .ny-outline:hover { background: var(--foreground); color: var(--background); }
        .ny-city { border: 1px solid var(--border); background: var(--surface); color: var(--foreground); transition: border-color 0.2s ease; }
        .ny-city:hover { border-color: var(--red); }
        @media (max-width: 899px) {
          .ny-body { grid-template-columns: 1fr; }
          .ny-card { margin-top: -70px; padding: 40px 20px 32px; border-radius: 20px 20px 0 0; }
          .ny-left { order: 1; grid-template-rows: 150px 150px; grid-template-columns: 1fr 1fr; }
          .ny-right { display: none; }
        }
      `} />

      <div className="ny-banner" aria-hidden="true">
        <Image src={PHOTOS.eventGroup.src} alt="" fill sizes="100vw" style={{ objectFit: 'cover', objectPosition: 'center 35%' }} />
      </div>

      <div className="ny-body">
        <Mosaic photos={LEFT_TILES} className="ny-left" />

        <div className="ny-card">
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: 'var(--lp-sans)',
              fontSize: 18,
              color: 'var(--red-text)',
              marginBottom: 14,
            }}
          >
            <PinIcon />
            Near you
          </span>
          <h2 style={{ fontFamily: 'var(--lp-serif)', fontSize: 'clamp(36px, 4.6vw, 54px)', lineHeight: 1.05, color: 'var(--foreground)', margin: 0 }}>
            Your next hackathon{' '}
            <span
              style={{
                background: 'var(--grad-deep)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              might be next door.
            </span>
          </h2>
          <p style={{ fontFamily: 'var(--lp-sans)', fontSize: 20, lineHeight: 1.3, color: 'var(--foreground)', margin: '20px 0 0', maxWidth: 560 }}>
            Turn on location or pick your city. The closest in-person hackathons come first, with how far each one is. Online ones follow, so
            you can join from anywhere.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 28 }}>
            <Link
              href="/near-me"
              className="ny-primary dark-btn cta-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                height: 52,
                padding: '0 28px',
                borderRadius: 9999,
                fontFamily: 'var(--lp-sans)',
                fontSize: 19,
                fontWeight: 600,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              <PinIcon />
              Show hackathons near me
              <span className="btn-arrow" aria-hidden="true">
                <BtnArrowSvg />
              </span>
            </Link>
            <Link
              href="/cities"
              className="ny-outline"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 52,
                padding: '0 26px',
                borderRadius: 9999,
                fontFamily: 'var(--lp-sans)',
                fontSize: 19,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Browse {totalCities} cities
            </Link>
          </div>

          <ul style={{ listStyle: 'none', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, padding: 0, margin: '28px 0 0' }}>
            {cities.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/cities/${c.slug}`}
                  className="ny-city"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 9999,
                    fontFamily: 'var(--lp-sans)',
                    fontSize: 15,
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  {c.name}
                  {c.open > 0 && (
                    <span style={{ background: 'var(--red)', color: '#ffffff', borderRadius: 9999, padding: '0 7px', fontSize: 12, fontWeight: 700 }}>
                      {c.open}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <Mosaic photos={RIGHT_TILES} className="ny-right" />
      </div>

      <WaveUp color="var(--background)" style={{ bottom: -2, zIndex: 20 }} />
    </section>
  );
}
