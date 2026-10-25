'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Bookmark, UserRound } from 'lucide-react';
import Avatar from '@/components/Avatar';
import ThemeToggle from '@/components/ThemeToggle';
import { NAV_COMMUNITY, NAV_HACKATHONS } from '@/data/navigation';
import { isAdminAccessEmail } from '@/lib/adminAccess';
import { useProfile } from '@/lib/useProfile';
import { useSaved } from '@/lib/useSaved';
import { InlineStyle } from './inline-style';

const F = 'var(--lp-sans)';
const ddId = (l: string) => `dropdown-${l.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
const ease = 'cubic-bezier(0.23, 1, 0.32, 1)';

type Item = { label: string; href: string };

const LINKS: Array<{ label: string; href?: string; dropdown?: Item[] }> = [
  { label: NAV_HACKATHONS.label, dropdown: NAV_HACKATHONS.items },
  { label: 'Near me', href: '/near-me' },
  { label: 'Team Finder', href: '/teams' },
  { label: NAV_COMMUNITY.label, dropdown: NAV_COMMUNITY.items },
];

/** Wordmark: just "HackathonFinder" in the landing serif, one colour, no icon. */
export function LandingLogo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" aria-label="HackathonFinder home" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
      <span className="lp-wordmark" style={{ fontFamily: 'var(--lp-serif)', fontSize: 26, lineHeight: 1, color: light ? 'var(--paper)' : 'var(--foreground)', whiteSpace: 'nowrap' }}>
        HackathonFinder
      </span>
    </Link>
  );
}

function DropdownMenu({ items, menuId }: { items: Item[]; menuId: string }) {
  return (
    <div className="lp-dropdown-menu" id={menuId} role="menu">
      {items.map((i) => (
        <Link key={i.label} href={i.href} role="menuitem" className="lp-dd-link">
          {i.label}
        </Link>
      ))}
    </div>
  );
}

export function LandingNavbar() {
  const [menuState, setMenuState] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed');
  const [openDd, setOpenDd] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openFrame = useRef<number | null>(null);
  const path = usePathname();
  const { count, ready } = useSaved();
  const { profile, me } = useProfile();
  const isAdmin = isAdminAccessEmail(me?.email);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const enter = (l: string) => {
    if (timer.current) clearTimeout(timer.current);
    setOpenDd(l);
  };
  const leave = () => {
    timer.current = setTimeout(() => setOpenDd(null), 120);
  };
  const active = (h?: string) => (h ? path.startsWith(h) : false);
  const mounted = menuState !== 'closed';
  const isOpen = menuState === 'opening' || menuState === 'open';

  const clearHandles = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (openFrame.current) cancelAnimationFrame(openFrame.current);
    closeTimer.current = null;
    openFrame.current = null;
  }, []);

  const openMenu = useCallback(() => {
    clearHandles();
    if (menuState === 'open' || menuState === 'opening') return;
    setMenuState('opening');
    openFrame.current = requestAnimationFrame(() => {
      setMenuState('open');
      openFrame.current = null;
    });
  }, [clearHandles, menuState]);

  const closeMenu = useCallback(() => {
    clearHandles();
    if (menuState === 'closed' || menuState === 'closing') return;
    setMenuState('closing');
    closeTimer.current = setTimeout(() => {
      setMenuState('closed');
      closeTimer.current = null;
    }, 240);
  }, [clearHandles, menuState]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [closeMenu, mounted]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      clearHandles();
    },
    [clearHandles]
  );

  const savedLabel = `My hackathons${ready && count ? ` (${count})` : ''}`;

  return (
    <>
      <nav className="lp-navbar" data-scrolled={scrolled} aria-label="Main">
        <div className="lp-nav-logo">
          <LandingLogo />
        </div>

        <div className="lp-nav-links">
          {LINKS.map(({ label, href, dropdown }) => {
            if (dropdown) {
              const id = ddId(label);
              return (
                <div
                  key={label}
                  style={{ position: 'relative' }}
                  onMouseEnter={() => enter(label)}
                  onMouseLeave={leave}
                  onFocus={() => enter(label)}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) leave();
                  }}
                >
                  <button
                    type="button"
                    className="lp-nav-link"
                    aria-haspopup="menu"
                    aria-expanded={openDd === label}
                    aria-controls={id}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', opacity: openDd === label ? 0.6 : 1 }}
                  >
                    {label}
                    <svg className="lp-nav-arrow" width="12" height="8" viewBox="0 0 12 8" aria-hidden="true" focusable="false">
                      <path d="M1 1.5L6 6.5L11 1.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {openDd === label && <DropdownMenu items={dropdown} menuId={id} />}
                </div>
              );
            }
            return (
              <Link key={label} href={href!} className="lp-nav-link" data-active={active(href)}>
                {label}
              </Link>
            );
          })}
        </div>

        <div className="lp-nav-actions">
          <Link href="/saved" className="lp-theme-toggle lp-icon-link" aria-label={savedLabel} title="My hackathons">
            <Bookmark size={18} aria-hidden="true" />
            {ready && count > 0 && <span className="lp-count">{count}</span>}
          </Link>

          <Link
            href="/profile"
            className={profile ? 'lp-avatar-link' : 'lp-theme-toggle lp-icon-link'}
            aria-label={profile ? `Your profile, ${profile.name}` : 'Create your profile'}
            title={profile ? 'Your profile' : 'Create your profile'}
          >
            {profile ? <Avatar name={profile.name} size="sm" className="h-11 w-11 ring-0" /> : <UserRound size={18} aria-hidden="true" />}
          </Link>

          {isAdmin && (
            <Link href="/admin" className="lp-nav-cta dark-btn">
              Admin
            </Link>
          )}

          <ThemeToggle className="lp-theme-toggle" />

          <Link href="/submit" className="lp-nav-cta dark-btn">
            Submit a hackathon
          </Link>
        </div>

        <ThemeToggle className="lp-theme-toggle lp-theme-toggle-mobile" />

        <button
          type="button"
          className="lp-nav-burger"
          onClick={() => (isOpen ? closeMenu() : openMenu())}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
          aria-controls="lp-mobile-nav"
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                display: 'block',
                width: 26,
                height: 3,
                background: 'var(--foreground)',
                borderRadius: 2,
                transform:
                  i === 0 && isOpen
                    ? 'translateY(8px) rotate(45deg)'
                    : i === 1 && isOpen
                      ? 'scaleX(0)'
                      : i === 2 && isOpen
                        ? 'translateY(-8px) rotate(-45deg)'
                        : 'none',
                opacity: i === 1 && isOpen ? 0 : 1,
                transition: `transform 220ms ${ease}, opacity 220ms ${ease}`,
              }}
            />
          ))}
        </button>
      </nav>

      {/* Keeps content clear of the fixed bar on small screens */}
      <div className="lp-nav-spacer" aria-hidden="true" />

      {mounted && (
        <div className="lp-mobile-nav" id="lp-mobile-nav" data-state={menuState} aria-hidden={!isOpen}>
          <div className="lp-mobile-panel">
            {LINKS.map(({ label, href, dropdown }) => (
              <div key={label} className="lp-mobile-item">
                {href ? (
                  <Link href={href} className="lp-mobile-link" data-active={active(href)} onClick={closeMenu}>
                    {label}
                  </Link>
                ) : (
                  <span className="lp-mobile-link">{label}</span>
                )}
                {dropdown && (
                  <div style={{ paddingLeft: 16, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {dropdown.map((d) => (
                      <Link key={d.label} href={d.href} onClick={closeMenu} style={{ fontFamily: F, fontSize: 17, color: 'var(--muted)', textDecoration: 'none' }}>
                        {d.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="lp-mobile-item">
              <Link href="/saved" className="lp-mobile-link" onClick={closeMenu}>
                {savedLabel}
              </Link>
            </div>
            <div className="lp-mobile-item">
              <Link href="/profile" className="lp-mobile-link" onClick={closeMenu}>
                Profile
              </Link>
            </div>
            <Link
              href="/submit"
              className="dark-btn lp-mobile-item"
              onClick={closeMenu}
              style={{
                fontFamily: F,
                fontSize: 20,
                color: 'var(--background)',
                textDecoration: 'none',
                background: 'var(--foreground)',
                borderRadius: 9999,
                padding: '10px 24px',
                textAlign: 'center',
                marginTop: 4,
                display: 'block',
              }}
            >
              Submit a hackathon
            </Link>
          </div>
        </div>
      )}

      <InlineStyle css={`
        .lp-navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 80px;
          z-index: 1100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-left: clamp(16px, 2.2vw, 32px);
          padding-right: clamp(16px, 4vw, 55px);
          border-bottom: 1px solid transparent;
          transition: background 300ms ease, border-color 300ms ease, backdrop-filter 300ms ease;
        }
        .lp-navbar[data-scrolled="true"] {
          background: var(--nav-bg);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom-color: var(--border);
        }
        .lp-nav-links, .lp-nav-actions { display: none; align-items: center; }
        .lp-nav-links { gap: 26px; }
        .lp-nav-actions { gap: 10px; }
        .lp-nav-burger {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 40px;
          height: 40px;
          gap: 5px;
          background: none;
          border: none;
          cursor: pointer;
        }
        .lp-nav-spacer { height: 80px; flex-shrink: 0; }
        @media (min-width: 1360px) {
          /* On wide screens the bar sits over the hero and scrolls away with it. */
          .lp-navbar,
          .lp-navbar[data-scrolled="true"] {
            position: absolute;
            background: transparent;
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            border-bottom-color: transparent;
          }
          /* Equal side columns keep the links exactly centred, whatever the logo and actions measure. */
          .lp-navbar { display: grid; grid-template-columns: 1fr auto 1fr; column-gap: 24px; }
          .lp-nav-logo { justify-self: start; }
          .lp-nav-links { display: flex; justify-self: center; }
          .lp-nav-actions { display: flex; justify-self: end; }
          .lp-nav-burger, .lp-nav-spacer, .lp-mobile-nav { display: none !important; }
        }
        .lp-nav-link {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: ${F};
          font-size: 18px;
          color: var(--foreground);
          text-decoration: none;
          white-space: nowrap;
          transition: opacity 0.15s;
        }
        .lp-nav-link:hover { opacity: 0.6; }
        .lp-nav-link[data-active="true"] { font-weight: 700; }
        .lp-nav-arrow { transition: transform 160ms ease, opacity 160ms ease; opacity: 0.8; }
        .lp-nav-link:hover .lp-nav-arrow { opacity: 1; transform: translateY(1px); }
        .lp-nav-cta {
          font-family: ${F};
          font-size: 19px;
          text-decoration: none;
          border-radius: 9999px;
          height: 44px;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          flex-shrink: 0;
          color: var(--background);
          background: var(--foreground);
        }
        .lp-nav-cta:active { transform: scale(0.98); }
        .lp-theme-toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          border-radius: 9999px;
          border: 1.5px solid var(--border);
          background: var(--surface);
          color: var(--foreground);
          cursor: pointer;
          transition: border-color 0.2s ease, transform 0.2s ease;
        }
        .lp-theme-toggle:hover { border-color: var(--foreground); transform: rotate(-12deg); }
        .lp-icon-link { position: relative; text-decoration: none; }
        .lp-icon-link:hover { transform: none; }
        .lp-count {
          position: absolute;
          top: -4px;
          right: -4px;
          min-width: 20px;
          height: 20px;
          padding: 0 5px;
          border-radius: 9999px;
          background: var(--red);
          color: #ffffff;
          font-family: ${F};
          font-size: 11px;
          font-weight: 700;
          line-height: 20px;
          text-align: center;
        }
        .lp-avatar-link { display: inline-flex; border-radius: 9999px; transition: box-shadow 0.2s ease; }
        .lp-avatar-link:hover { box-shadow: 0 0 0 2px var(--foreground); }
        .lp-theme-toggle-mobile { margin-left: auto; margin-right: 12px; }
        /* Phones: room for the wordmark, the toggle and the menu button on one line. */
        @media (max-width: 420px) {
          .lp-navbar .lp-wordmark { font-size: 21px !important; }
          .lp-theme-toggle-mobile { width: 40px; height: 40px; margin-right: 8px; }
        }
        @media (min-width: 1360px) {
          .lp-theme-toggle-mobile { display: none; }
        }

        .lp-dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 50%;
          background: var(--surface);
          border-radius: 12px;
          box-shadow: var(--shadow-dd);
          padding: 8px;
          min-width: 220px;
          z-index: 100;
          transform: translate3d(-50%, 0, 0);
          animation: lp-dd-in 180ms ${ease};
        }
        .lp-dd-link {
          display: block;
          padding: 10px 20px;
          font-family: ${F};
          font-size: 18px;
          color: var(--foreground);
          text-decoration: none;
          white-space: nowrap;
          border-radius: 8px;
          transition: background-color 200ms ease, color 200ms ease, padding-left 200ms ease, box-shadow 200ms ease;
        }
        .lp-dd-link:hover {
          background-color: var(--surface-hover);
          color: var(--red-text);
          padding-left: 26px;
          box-shadow: 0 4px 12px rgba(236, 55, 80, 0.12);
        }
        @keyframes lp-dd-in {
          from { opacity: 0; transform: translate3d(-50%, 6px, 0); }
          to { opacity: 1; transform: translate3d(-50%, 0, 0); }
        }

        .lp-mobile-nav {
          position: fixed;
          inset: 0;
          z-index: 1090;
          display: flex;
          background: var(--nav-bg);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: opacity 220ms ${ease}, visibility 0ms linear 220ms;
        }
        .lp-mobile-nav[data-state="opening"],
        .lp-mobile-nav[data-state="open"],
        .lp-mobile-nav[data-state="closing"] { visibility: visible; }
        .lp-mobile-nav[data-state="open"] {
          opacity: 1;
          pointer-events: auto;
          transition: opacity 240ms ${ease}, visibility 0ms linear 0ms;
        }
        .lp-mobile-panel {
          width: 100%;
          min-height: 100%;
          padding: 104px 32px 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          overflow-y: auto;
          border-top: 1px solid var(--border);
          transform: translate3d(0, -14px, 0);
          transition: transform 240ms ${ease};
        }
        .lp-mobile-nav[data-state="open"] .lp-mobile-panel { transform: translate3d(0, 0, 0); }
        .lp-mobile-link { font-family: ${F}; font-size: 20px; color: var(--foreground); text-decoration: none; }
        .lp-mobile-link[data-active="true"] { font-weight: 700; }
        .lp-mobile-item {
          opacity: 0;
          transform: translate3d(0, 12px, 0);
          transition: transform 240ms ${ease}, opacity 180ms ease-out;
        }
        .lp-mobile-nav[data-state="open"] .lp-mobile-item { opacity: 1; transform: translate3d(0, 0, 0); }
        .lp-mobile-nav[data-state="open"] .lp-mobile-item:nth-child(1) { transition-delay: 40ms; }
        .lp-mobile-nav[data-state="open"] .lp-mobile-item:nth-child(2) { transition-delay: 65ms; }
        .lp-mobile-nav[data-state="open"] .lp-mobile-item:nth-child(3) { transition-delay: 90ms; }
        .lp-mobile-nav[data-state="open"] .lp-mobile-item:nth-child(4) { transition-delay: 115ms; }
        .lp-mobile-nav[data-state="open"] .lp-mobile-item:nth-child(5) { transition-delay: 140ms; }

        @media (prefers-reduced-motion: reduce) {
          .lp-nav-arrow, .lp-mobile-nav, .lp-mobile-panel, .lp-mobile-item, .lp-dd-link { transition: none; }
          .lp-dropdown-menu { animation: none; }
          .lp-mobile-panel, .lp-mobile-item { transform: none; }
        }
      `} />
    </>
  );
}
