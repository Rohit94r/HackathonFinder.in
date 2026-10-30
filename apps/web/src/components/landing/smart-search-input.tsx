'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { parseSmartQuery } from '@/lib/smartSearch';
import { NEAR_ME_FILTERS, toQueryString } from '@/lib/filters';
import { InlineStyle } from './inline-style';

const EXAMPLES = [
  'Offline hackathon near me this month',
  'Free AI hackathon in Pune for students',
  'Online web3 hackathon with big prizes',
  'Beginner hackathon this month, team of 3',
  'Women-only hackathon in Pune',
  'Solo coding contest this week',
];

type Variant = 'hero' | 'showcase';

const cfg = {
  hero: { w: 'min(560px, calc(100vw - 48px))', inputId: 'hero-search-input' },
  showcase: { w: '100%', inputId: 'showcase-search-input' },
} as const satisfies Record<Variant, { w: string; inputId: string }>;

/**
 * Plain-words search pill. Turns "free online AI hackathon this month" into filters
 * and opens the Explore page; an empty search runs the example shown.
 */
export function SmartSearchInput({ variant = 'hero', showParsed = false }: { variant?: Variant; showParsed?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [exampleIndex, setExampleIndex] = useState(0);
  const c = cfg[variant];

  useEffect(() => {
    const id = setInterval(() => setExampleIndex((i) => (i + 1) % EXAMPLES.length), 3500);
    return () => clearInterval(id);
  }, []);

  const parsed = useMemo(() => (showParsed && value.trim() ? parseSmartQuery(value) : null), [showParsed, value]);

  const submit = () => {
    const { filters } = parseSmartQuery(value.trim() || EXAMPLES[exampleIndex]);
    router.push(
      filters.sort === 'nearest' ? `/near-me${toQueryString(filters, NEAR_ME_FILTERS)}` : `/hackathons${toQueryString(filters)}`
    );
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: c.w, maxWidth: '100%' }}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: 'var(--surface-hover)',
          borderRadius: 9999,
          width: '100%',
          height: 'clamp(48px, 12vw, 52px)',
          boxShadow: 'var(--field-ring)',
        }}
      >
        <InlineStyle css={`
          #${c.inputId}::placeholder { color: var(--foreground); opacity: 0.5; }
          .lp-search-btn { background: var(--foreground); color: var(--background); }
          .lp-search-btn:hover { background: var(--red); color: var(--paper); }
        `} />
        <label htmlFor={c.inputId} style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          Describe the hackathon you want
        </label>
        <input
          id={c.inputId}
          type="text"
          autoComplete="off"
          placeholder={`Try “${EXAMPLES[exampleIndex]}”`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            paddingLeft: 24,
            paddingRight: 'clamp(108px, 25vw, 132px)',
            fontFamily: 'var(--lp-sans)',
            fontSize: 'clamp(16px, 4.6vw, 19px)',
            color: 'var(--foreground)',
            textOverflow: 'ellipsis',
          }}
        />
        <button
          type="submit"
          className="lp-search-btn"
          style={{
            position: 'absolute',
            top: '50%',
            right: 6,
            transform: 'translateY(-50%)',
            border: 'none',
            borderRadius: 9999,
            width: 'clamp(96px, 22vw, 116px)',
            height: 'clamp(38px, 10vw, 42px)',
            fontFamily: 'var(--lp-sans)',
            fontSize: 19,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.4s ease, color 0.4s ease',
          }}
        >
          Search
        </button>
      </form>

      {parsed && (parsed.understood.length > 0 || parsed.filters.q) && (
        <p
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
            margin: '12px 0 0',
            fontFamily: 'var(--lp-sans)',
            fontSize: 15,
            color: 'var(--muted)',
          }}
        >
          We understood:
          {parsed.understood.map((u) => (
            <span key={u} style={{ background: 'rgba(236,55,80,0.1)', color: 'var(--red-text)', borderRadius: 999, padding: '2px 10px', fontWeight: 600 }}>
              {u}
            </span>
          ))}
          {parsed.filters.q && (
            <span style={{ background: 'var(--surface-hover)', borderRadius: 999, padding: '2px 10px', fontWeight: 600, color: 'var(--foreground)' }}>
              “{parsed.filters.q}”
            </span>
          )}
        </p>
      )}
    </div>
  );
}
