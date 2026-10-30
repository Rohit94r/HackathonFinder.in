'use client';

import { useState } from 'react';
import { InlineStyle } from './inline-style';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Weekly digest sign-up pill. Preview only, like the rest of the site's forms:
 * sign-ups are not stored until the database lands.
 */
export function DigestSignup({ id = 'digest-email' }: { id?: string }) {
  const [email, setEmail] = useState('');
  const [err, setErr] = useState(false);
  const [focused, setFocused] = useState(false);
  const [done, setDone] = useState(false);

  const submit = () => {
    if (!EMAIL.test(email.trim())) {
      setErr(true);
      return;
    }
    setErr(false);
    setDone(true);
  };

  if (done) {
    return (
      <p
        role="status"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 52,
          width: 'min(616px, calc(100vw - 48px))',
          margin: 0,
          padding: '0 24px',
          borderRadius: 9999,
          background: 'rgba(51, 214, 166, 0.16)',
          color: 'var(--foreground)',
          fontFamily: 'var(--lp-sans)',
          fontSize: 19,
        }}
      >
        You’re on the list. The weekly digest starts soon.
      </p>
    );
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        noValidate
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: 'var(--surface-hover)',
          borderRadius: 9999,
          width: 'min(616px, calc(100vw - 48px))',
          height: 'clamp(48px, 12vw, 52px)',
          boxShadow: err ? '0 0 0 2px var(--red)' : focused ? '0 0 0 3px rgba(236,55,80,0.25)' : 'var(--field-ring)',
          transition: 'box-shadow 0.2s ease',
        }}
      >
        <InlineStyle css={`
          #${id}::placeholder { color: var(--foreground); opacity: 0.5; }
          .lp-digest-btn { background: var(--foreground); color: var(--background); }
          .lp-digest-btn:hover { background: var(--red); color: var(--paper); }
          @keyframes lp-fade-in {
            from { opacity: 0; transform: translateX(-50%) translateY(4px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
          }
        `} />
        <input
          id={id}
          type="email"
          aria-label="Email address"
          aria-invalid={err}
          placeholder="you@college.edu"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (err) setErr(false);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            paddingLeft: 24,
            paddingRight: 150,
            fontFamily: 'var(--lp-sans)',
            fontSize: 19,
            color: 'var(--foreground)',
          }}
        />
        <button
          type="submit"
          className="lp-digest-btn"
          style={{
            position: 'absolute',
            top: '50%',
            right: 6,
            transform: 'translateY(-50%)',
            border: 'none',
            borderRadius: 9999,
            height: 40,
            padding: '0 20px',
            fontFamily: 'var(--lp-sans)',
            fontSize: 18,
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'background 0.4s ease, color 0.4s ease',
          }}
        >
          Get the digest
        </button>
      </form>

      {err && (
        <div
          role="alert"
          style={{
            position: 'absolute',
            top: -42,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--red)',
            color: 'var(--paper)',
            padding: '8px 16px',
            borderRadius: 6,
            fontFamily: 'var(--lp-sans)',
            fontSize: 14,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            animation: 'lp-fade-in 0.2s ease',
            boxShadow: '0 4px 12px rgba(236,55,80,0.3)',
          }}
        >
          Please enter a valid email address
          <span
            style={{
              position: 'absolute',
              bottom: -5,
              left: '50%',
              transform: 'translateX(-50%)',
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid var(--red)',
            }}
          />
        </div>
      )}
    </div>
  );
}
