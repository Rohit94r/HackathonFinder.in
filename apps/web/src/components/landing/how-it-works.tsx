import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { cityName, modeLabel, sourceBySlug } from '@hackathonfinder/shared';
import { formatDateRange, formatDay, formatPrizeShort, formatTeamSize } from '@/lib/format';
import type { HackathonView } from '@/lib/hackathons';
import { InlineStyle } from './inline-style';

const chip: CSSProperties = {
  position: 'absolute',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: '#ffffff',
  border: '1px solid rgba(23,23,29,0.12)',
  borderRadius: 999,
  padding: '5px 12px',
  fontFamily: 'var(--lp-sans)',
  fontSize: 14,
  fontWeight: 600,
  color: '#17171d',
  boxShadow: '0 4px 12px rgba(23,23,29,0.08)',
  whiteSpace: 'nowrap',
};

function Panel({ children, background }: { children: ReactNode; background: string }) {
  return (
    <div
      aria-hidden="true"
      style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '16 / 9', marginBottom: 18, background, containerType: 'inline-size' }}
    >
      {children}
    </div>
  );
}

/** Step 1: sources scattered around a radar. */
function EverywherePanel() {
  const sources = [
    ['Unstop', 8, 14, -6],
    ['Devfolio', 62, 10, 5],
    ['Instagram', 4, 44, 4],
    ['LinkedIn', 70, 40, -5],
    ['Google', 12, 74, -3],
    ['College sites', 58, 72, 4],
    ['Devpost', 36, 6, -2],
    ['Luma', 40, 82, 3],
  ] as const;
  return (
    <Panel background="var(--panel-warm)">
      {[18, 30, 42].map((r) => (
        <span
          key={r}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: `${r * 2}%`,
            aspectRatio: '1',
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            border: '2px dashed rgba(236,55,80,0.35)',
          }}
        />
      ))}
      <span
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '15%',
          aspectRatio: '1',
          borderRadius: '50%',
          background: '#ec3750',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 0 8px rgba(236,55,80,0.18)',
        }}
      >
        <svg viewBox="0 0 32 32" style={{ width: '55%' }}>
          <circle cx="14" cy="14" r="7.5" fill="none" stroke="#ffffff" strokeWidth="3.2" />
          <path d="M19.5 19.5l6 6" stroke="#ffffff" strokeWidth="3.6" strokeLinecap="round" />
        </svg>
      </span>
      {sources.map(([name, left, top, rotate]) => (
        <span key={name} style={{ ...chip, left: `${left}%`, top: `${top}%`, transform: `rotate(${rotate}deg)` }}>
          {name}
        </span>
      ))}
    </Panel>
  );
}

/** Step 2: one clean card, merged from several sources. */
function CleanCardPanel({ h }: { h: HackathonView }) {
  const sourceNames = h.sources.map((s) => sourceBySlug(s)?.name ?? s);
  const rows = [
    ['When', formatDateRange(h.startDate, h.endDate)],
    ['Deadline', formatDay(h.registrationDeadline)],
    ['Where', h.mode === 'online' ? 'Online' : `${cityName(h.city)} · ${modeLabel(h.mode)}`],
    ['Team', formatTeamSize(h.teamMin, h.teamMax, h.teamSizeKnown !== false)],
    ['Prizes', formatPrizeShort(h.prizePool, h.prizeCurrency)],
  ];
  return (
    <Panel background="var(--panel-cool)">
      {/* The mock card follows the theme, like the real listing cards do. */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '44%',
          transform: 'translate(-50%, -50%) rotate(-2deg)',
          width: '74%',
          background: 'var(--mock-card)',
          borderRadius: 12,
          boxShadow: 'var(--mock-card-shadow)',
          padding: '4.5cqw 5cqw',
          fontFamily: 'var(--lp-sans)',
          color: 'var(--foreground)',
        }}
      >
        <p style={{ margin: 0, fontFamily: 'var(--lp-serif)', fontSize: '5.6cqw', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {h.title}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '3cqw', rowGap: '0.8cqw', marginTop: '2.2cqw', fontSize: '3.4cqw' }}>
          {rows.map(([label, value]) => (
            <span key={label} style={{ display: 'contents' }}>
              <span style={{ color: 'var(--mock-label)' }}>{label}</span>
              <span style={{ fontWeight: 600 }}>{value}</span>
            </span>
          ))}
        </div>
      </div>
      <span style={{ ...chip, right: '3%', bottom: '5%', background: '#ec3750', color: '#ffffff', border: 'none', transform: 'rotate(4deg)' }}>
        {sourceNames.length} sources → 1 listing
      </span>
    </Panel>
  );
}

/** Step 3: filters picked, one tap to the official page. */
function FindPanel() {
  const filters = ['Online', 'AI / ML', 'Free', 'Closes this month', 'Team of 3'];
  return (
    <Panel background="var(--panel-sun)">
      <div style={{ position: 'absolute', left: '7%', right: '7%', top: '12%', display: 'flex', flexWrap: 'wrap', gap: '1.6cqw' }}>
        {filters.map((f) => (
          // Picked filters use the "selected" colours: ink on light, white on dark.
          <span key={f} style={{ ...chip, position: 'static', fontSize: '3.6cqw', background: 'var(--foreground)', color: 'var(--background)', border: 'none' }}>
            ✓ {f}
          </span>
        ))}
      </div>
      <span
        style={{
          position: 'absolute',
          left: '50%',
          bottom: '13%',
          transform: 'translateX(-50%) rotate(-1.5deg)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: '#ec3750',
          color: '#ffffff',
          borderRadius: 999,
          padding: '2.4cqw 5cqw',
          fontFamily: 'var(--lp-sans)',
          fontWeight: 700,
          fontSize: '4.2cqw',
          whiteSpace: 'nowrap',
          boxShadow: '0 8px 20px rgba(236,55,80,0.35)',
        }}
      >
        Register on official site ↗
      </span>
    </Panel>
  );
}

/** The three steps from the concept: we go everywhere, we clean it up, you find what fits. */
export function HowItWorksSection({ example }: { example: HackathonView }) {
  const steps = [
    {
      panel: <EverywherePanel />,
      title: '1. We go everywhere',
      caption: 'Hackathon platforms, Google, Instagram, LinkedIn, event sites and college pages, checked every day.',
    },
    {
      panel: <CleanCardPanel h={example} />,
      title: '2. We clean it up',
      caption: 'Every event becomes one clear card with dates, deadline, mode, city, team size, prizes and who can join.',
    },
    {
      panel: <FindPanel />,
      title: '3. You find what fits',
      caption: 'Search and filter by what you need, save events, then register on the organizer’s official page.',
    },
  ];

  return (
    <section
      className="section-padded"
      style={{
        background: 'var(--background)',
        paddingTop: 48,
        paddingBottom: 80,
        paddingLeft: 'clamp(24px, 14.29%, 220px)',
        paddingRight: 'clamp(24px, 14.29%, 220px)',
      }}
    >
      <h2 style={{ fontFamily: 'var(--lp-sans)', fontSize: 20, color: 'var(--foreground)', textAlign: 'center', marginBottom: 36, marginTop: 0, lineHeight: 1.25 }}>
        We do the searching, so you can do the building.
        <br />
        Curious how?{' '}
        <Link href="/how-it-works" className="lp-underline-link">
          Meet our discovery agents
        </Link>
      </h2>

      <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'clamp(12px, 1.6vw, 24px)', marginBottom: 56 }}>
        {steps.map((step) => (
          <div key={step.title}>
            {step.panel}
            <h3 style={{ fontFamily: 'var(--lp-serif)', fontSize: 28, lineHeight: 1.1, textAlign: 'center', margin: '0 0 10px', color: 'var(--foreground)' }}>
              {step.title}
            </h3>
            <p style={{ fontFamily: 'var(--lp-sans)', fontSize: 19, color: 'var(--foreground)', margin: 0, lineHeight: 1.25, textAlign: 'center' }}>
              {step.caption}
            </p>
          </div>
        ))}
      </div>

      <InlineStyle css={`
        @media (max-width: 640px) {
          .steps-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
        }
        @media (min-width: 641px) and (max-width: 900px) {
          .steps-grid { display: flex !important; flex-wrap: wrap; justify-content: center; gap: 32px !important; }
          .steps-grid > div { flex: 0 0 calc(50% - 16px); }
        }
      `} />
    </section>
  );
}
