import Link from 'next/link';
import { TextSticker, type StickerTone } from './art';
import { InlineStyle } from './inline-style';

const FLY_STICKERS: { label: string; tone: StickerTone; className: string }[] = [
  { label: 'Free listing', tone: 'green', className: 'sf-a' },
  { label: 'Verified ✓', tone: 'blue', className: 'sf-b' },
  { label: 'Featured ★', tone: 'yellow', className: 'sf-c' },
  { label: '+ students', tone: 'purple', className: 'sf-d' },
];

/**
 * Airmail-envelope callout for organizers: "send us your hackathon". Clean at rest;
 * on hover, stickers fly in and land around it.
 */
export function SubmitEnvelopeLink() {
  return (
    <Link
      href="/submit?as=organizer"
      className="submit-envelope"
      aria-label="Running a hackathon? Submit it to HackathonFinder for free"
      style={{ display: 'block', position: 'relative', textDecoration: 'none', containerType: 'inline-size' }}
    >
      {/* Envelope with airmail edging */}
      <div
        className="submit-envelope-body"
        aria-hidden="true"
        style={{
          position: 'relative',
          zIndex: 1,
          borderRadius: 10,
          background: 'repeating-linear-gradient(45deg, #ec3750 0 7px, #fffdf8 7px 14px, #338eda 14px 21px, #fffdf8 21px 28px)',
          padding: 8,
          aspectRatio: '10 / 6.2',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(155deg, #fffefb 0%, #fdfaf2 55%, #f9f3e6 100%)',
            borderRadius: 5,
            overflow: 'hidden',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -6px 14px rgba(23,23,29,0.035)',
          }}
        >
          {/* Return address */}
          <div
            style={{
              position: 'absolute',
              top: '7.5%',
              left: '7%',
              fontFamily: 'var(--lp-sans)',
              fontSize: 'clamp(7px, 3.5cqw, 9.5px)',
              lineHeight: 1.45,
              letterSpacing: '0.07em',
              color: 'rgba(23,23,29,0.5)',
              whiteSpace: 'nowrap',
            }}
          >
            YOUR CODING CLUB
            <br />
            YOUR COLLEGE
            <br />
            PUNE, INDIA
          </div>

          {/* Stamp: white magnifier on red */}
          <div
            style={{
              position: 'absolute',
              top: '6.5%',
              right: '5.5%',
              width: '18%',
              aspectRatio: '82 / 92',
              background: '#ffffff',
              boxShadow: '0 1.5px 4px rgba(23,23,29,0.18)',
              transform: 'rotate(3deg)',
              padding: '1.1%',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(150deg, #f04a61 0%, #ec3750 45%, #d92c44 100%)',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg viewBox="0 0 32 32" style={{ width: '62%', height: 'auto', display: 'block' }}>
                <circle cx="14" cy="14" r="7.5" fill="none" stroke="#ffffff" strokeWidth="3.2" />
                <path d="M19.5 19.5l6 6" stroke="#ffffff" strokeWidth="3.6" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Postmark */}
          <svg viewBox="0 0 120 70" style={{ position: 'absolute', top: '5%', right: '14%', width: '26%', opacity: 0.48, transform: 'rotate(-6deg)' }}>
            <circle cx="35" cy="35" r="26" fill="none" stroke="#17171d" strokeWidth="2.5" />
            <circle cx="35" cy="35" r="19" fill="none" stroke="#17171d" strokeWidth="1.2" />
            <path
              d="M64 22 Q74 18 84 22 T104 22 M64 34 Q74 30 84 34 T104 34 M64 46 Q74 42 84 46 T104 46"
              fill="none"
              stroke="#17171d"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>

          {/* Address */}
          <div
            style={{
              position: 'absolute',
              left: '11%',
              right: '11%',
              top: '41%',
              display: 'flex',
              alignItems: 'flex-start',
              fontFamily: 'var(--lp-sans)',
              fontStyle: 'italic',
              color: '#17171d',
              fontSize: 'clamp(10px, 5.6cqw, 14px)',
              lineHeight: 1.05,
            }}
          >
            <span style={{ color: 'rgba(23,23,29,0.5)', fontStyle: 'normal', marginRight: '2.5%', flexShrink: 0 }}>TO:</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ borderBottom: '1.2px solid rgba(23,23,29,0.35)' }}>every student</div>
              <div style={{ borderBottom: '1.2px solid rgba(23,23,29,0.35)', marginTop: '6.5%' }}>looking for a hackathon</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stickers: hidden at rest, fly in around the envelope on hover */}
      {FLY_STICKERS.map(({ label, tone, className }) => (
        <div key={label} className={`sticker-fly ${className}`} aria-hidden="true">
          <TextSticker tone={tone} size={12} style={{ borderWidth: 3 }}>
            {label}
          </TextSticker>
        </div>
      ))}

      {/* CTA pill: a sticker slapped over the envelope's bottom edge */}
      <span
        className="submit-envelope-pill"
        style={{
          position: 'absolute',
          left: '50%',
          bottom: -16,
          zIndex: 4,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          background: 'var(--red)',
          color: '#ffffff',
          borderRadius: 999,
          padding: '8px 18px',
          border: '2.5px solid #fffdf8',
          fontFamily: 'var(--lp-sans)',
          fontSize: 16,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          boxShadow: '0 5px 16px rgba(236,55,80,0.40), 0 2px 5px rgba(23,23,29,0.14)',
        }}
      >
        Submit a hackathon
        <svg className="submit-envelope-arrow" aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>

      <InlineStyle css={`
        .submit-envelope {
          width: clamp(210px, 16vw, 260px);
          transform: rotate(-3deg);
          transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @media (min-width: 1024px) {
          .submit-envelope { margin-top: 28px; }
        }
        @media (min-width: 1024px) and (max-height: 850px) {
          .submit-envelope { width: 200px; margin-top: 14px; }
        }
        .submit-envelope .submit-envelope-body {
          box-shadow: 0 12px 28px rgba(23, 23, 29, 0.18), 0 3px 7px rgba(23, 23, 29, 0.09);
          transition: box-shadow 0.28s ease;
        }
        .submit-envelope:hover,
        .submit-envelope:focus-visible {
          transform: rotate(-1.5deg) translateY(-5px) scale(1.03);
        }
        .submit-envelope:hover .submit-envelope-body,
        .submit-envelope:focus-visible .submit-envelope-body {
          box-shadow: 0 20px 40px rgba(23, 23, 29, 0.24), 0 5px 12px rgba(23, 23, 29, 0.11);
        }
        .submit-envelope-pill {
          transform: translateX(-50%) rotate(1.5deg);
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .submit-envelope:hover .submit-envelope-pill,
        .submit-envelope:focus-visible .submit-envelope-pill {
          transform: translateX(-50%) rotate(0deg) scale(1.05);
        }
        .submit-envelope-arrow { transition: transform 0.2s ease; }
        .submit-envelope:hover .submit-envelope-arrow,
        .submit-envelope:focus-visible .submit-envelope-arrow {
          transform: translateX(4px);
        }

        /* ── Fly-in stickers ── */
        .sticker-fly {
          position: absolute;
          z-index: 3;
          pointer-events: none;
          opacity: 0;
          transition: transform 0.22s ease-in, opacity 0.16s ease-in;
        }
        .submit-envelope:hover .sticker-fly,
        .submit-envelope:focus-visible .sticker-fly { opacity: 1; }
        .sf-a { left: -16%;  top: -14%;   transform: translate(-70px, -55px) scale(0.3) rotate(-24deg); }
        .sf-b { right: -14%; top: -16%;   transform: translate(60px, -60px)  scale(0.3) rotate(22deg); }
        .sf-c { right: -18%; bottom: 22%; transform: translate(75px, 30px)   scale(0.3) rotate(24deg); }
        .sf-d { left: -18%;  bottom: 6%;  transform: translate(-65px, 45px)  scale(0.3) rotate(-26deg); }

        .submit-envelope:hover .sf-a, .submit-envelope:focus-visible .sf-a {
          transform: translate(0, 0) scale(1) rotate(-9deg);
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0ms, opacity 0.18s ease 0ms;
        }
        .submit-envelope:hover .sf-b, .submit-envelope:focus-visible .sf-b {
          transform: translate(0, 0) scale(1) rotate(8deg);
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 50ms, opacity 0.18s ease 50ms;
        }
        .submit-envelope:hover .sf-c, .submit-envelope:focus-visible .sf-c {
          transform: translate(0, 0) scale(1) rotate(7deg);
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 100ms, opacity 0.18s ease 100ms;
        }
        .submit-envelope:hover .sf-d, .submit-envelope:focus-visible .sf-d {
          transform: translate(0, 0) scale(1) rotate(-8deg);
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 150ms, opacity 0.18s ease 150ms;
        }

        /* Touch devices and small screens never see the hover, so show the stickers landed */
        @media (hover: none), (max-width: 1023px) {
          .sticker-fly { opacity: 1; transition: none; }
          .sf-a { transform: translate(0, 0) scale(1) rotate(-9deg); }
          .sf-b { transform: translate(0, 0) scale(1) rotate(8deg); }
          .sf-c { transform: translate(0, 0) scale(1) rotate(7deg); }
          .sf-d { transform: translate(0, 0) scale(1) rotate(-8deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .submit-envelope,
          .submit-envelope:hover,
          .submit-envelope:focus-visible { transform: rotate(-3deg); transition: none; }
          .submit-envelope-pill,
          .submit-envelope:hover .submit-envelope-pill { transform: translateX(-50%) rotate(1.5deg); transition: none; }
          .sticker-fly,
          .submit-envelope:hover .sticker-fly,
          .submit-envelope:focus-visible .sticker-fly { transition: none; }
        }
      `} />
    </Link>
  );
}
