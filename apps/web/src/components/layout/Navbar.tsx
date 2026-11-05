'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bookmark, CalendarCheck, ChevronDown, Menu, Plus, X } from 'lucide-react';
import { Logo } from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import { MobileAccountLinks, NavAccount } from '@/components/auth/AccountMenu';
import { NAV_COMMUNITY, NAV_HACKATHONS, type NavGroup } from '@/data/navigation';
import { useSaved } from '@/lib/useSaved';
import { localZone, stationClock } from '@/lib/clock';
import { cn } from '@/lib/cn';

const iconBtn =
  'inline-flex h-9 w-9 items-center justify-center rounded-md text-ink/70 transition-colors hover:bg-ink/[0.07] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-board';

// Signage links: condensed caps; the current page is lit in signboard yellow.
function navLink(active: boolean) {
  return cn(
    'inline-flex h-9 items-center gap-1 whitespace-nowrap rounded-md px-3 font-display text-[15px] font-semibold uppercase tracking-[0.06em] transition-colors',
    active ? 'bg-ink/[0.08] text-board' : 'text-ink/75 hover:bg-ink/[0.06] hover:text-ink'
  );
}

/** The station clock, in the visitor's own time zone. Renders after mount so server and browser agree. */
function StationClock() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const clock = now === null ? null : stationClock(now, localZone());
  return (
    <span className="hidden items-center gap-1.5 rounded-md border border-ink/15 px-2 py-1 font-mono text-[11px] tabular-nums text-ink/60 2xl:inline-flex" aria-hidden="true">
      <span className="h-1.5 w-1.5 rounded-full bg-board" />
      {clock ? `${clock.time} ${clock.zone}` : '--:--:--'}
    </span>
  );
}

function isActive(pathname: string, href: string) {
  // Filtered views like "Closing soon" share a path with "All hackathons"; only the plain link lights up.
  if (href.includes('?')) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Dropdown({ group, pathname, onNavigate }: { group: NavGroup; pathname: string; onNavigate: () => void }) {
  return (
    <div id={`nav-${group.label.toLowerCase()}`} className="hf-dd-in absolute left-0 top-full z-50 w-[340px] pt-2">
      <ul className="rounded-md border border-line bg-card p-1.5 shadow-lift">
        {group.items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'group flex items-start gap-3 rounded-md px-2.5 py-2 transition-colors hover:bg-ink/[0.06]',
                isActive(pathname, item.href) && 'bg-ink/[0.06]'
              )}
            >
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] bg-board text-navy transition-transform group-hover:-rotate-6">
                <item.icon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-medium text-ink">{item.label}</span>
                <span className="block text-xs text-muted">{item.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const { count, ready } = useSaved();

  useEffect(() => {
    setMobileOpen(false);
    setOpenGroup(null);
  }, [pathname]);

  // The mobile sheet covers the page; stop the page behind it from scrolling.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpenGroup(null);
      setMobileOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpenGroup(null);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, []);

  // A short delay lets the pointer cross the gap between the button and its menu.
  const openSoon = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenGroup(label);
  };
  const closeSoon = () => {
    closeTimer.current = setTimeout(() => setOpenGroup(null), 140);
  };
  const groupProps = (group: NavGroup) => ({
    group,
    pathname,
    open: openGroup === group.label,
    onEnter: () => openSoon(group.label),
    onLeave: closeSoon,
    onToggle: () => setOpenGroup(openGroup === group.label ? null : group.label),
    onNavigate: () => setOpenGroup(null),
  });

  return (
    <>
      {/* The station canopy: always dark, with the yellow platform edge along the bottom. */}
      <header data-theme="dark" className="sticky top-0 z-50 bg-surface/95 pt-[env(safe-area-inset-top)] text-ink backdrop-blur supports-[backdrop-filter]:bg-surface/85">
        <nav ref={navRef} className="container-page flex h-16 items-center gap-5" aria-label="Main">
          <Logo />

          <ul className="hidden items-center gap-0.5 lg:flex">
            <GroupItem {...groupProps(NAV_HACKATHONS)} />
            <li>
              <Link href="/near-me" className={navLink(isActive(pathname, '/near-me'))}>
                Near me
              </Link>
            </li>
            <li>
              <Link href="/teams" className={navLink(isActive(pathname, '/teams'))}>
                Team Finder
              </Link>
            </li>
            <GroupItem {...groupProps(NAV_COMMUNITY)} />
          </ul>

          <div className="ml-auto flex items-center gap-1.5">
            <StationClock />
            {/* Phones reach Saved from the bottom tab bar. */}
            <Link
              href="/saved"
              className={cn(navLink(isActive(pathname, '/saved')), 'relative hidden px-3 lg:inline-flex')}
              aria-label={`Saved hackathons${ready && count ? `, ${count} saved` : ''}`}
            >
              <Bookmark className="h-4 w-4" aria-hidden="true" />
              <span className="hidden xl:inline">Saved</span>
              {ready && count > 0 && (
                <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] bg-board px-1.5 font-mono text-[11px] font-bold text-navy">
                  {count}
                </span>
              )}
            </Link>
            <Link href="/profile" className={cn(navLink(isActive(pathname, '/profile')), 'hidden xl:inline-flex')}>
              <CalendarCheck className="h-4 w-4" aria-hidden="true" />
              My events
            </Link>
            <Link href="/submit" className="btn-primary ml-1 hidden h-9 min-h-0 whitespace-nowrap px-3.5 py-0 text-[14px] md:inline-flex">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Submit hackathon
            </Link>
            {/* Bell and avatar menu when signed in, "Sign in" when not. */}
            <NavAccount iconClassName={iconBtn} />
            <button
              type="button"
              className={cn(iconBtn, 'lg:hidden')}
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
        <div className="platform-edge h-[5px]" aria-hidden="true" />
      </header>

      {/*
        Outside the header on purpose: the header's backdrop blur makes it the containing block for
        fixed children, which squashed this menu to the header's height (2px tall on phones). Under
        the header (z-50), over the bottom tab bar (z-40).
      */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          data-theme="dark"
          className="hf-fade-in fixed inset-x-0 bottom-0 top-[calc(69px+env(safe-area-inset-top))] z-[45] overflow-y-auto overscroll-contain bg-surface pb-[env(safe-area-inset-bottom)] text-ink lg:hidden"
        >
          <div className="container-page grid gap-6 py-5 sm:grid-cols-2">
            <MobileLinks title="Explore" items={NAV_HACKATHONS.items} pathname={pathname} />
            <MobileLinks title="Community" items={NAV_COMMUNITY.items} pathname={pathname} />
          </div>
          <div className="container-page grid grid-cols-2 gap-2 pb-5">
            <Link href="/saved" className="btn-secondary">
              <Bookmark className="h-4 w-4" aria-hidden="true" />
              Saved{ready && count > 0 ? ` (${count})` : ''}
            </Link>
            <Link href="/submit" className="btn-primary">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Submit hackathon
            </Link>
          </div>
          <div className="container-page border-t border-line py-5">
            <MobileAccountLinks />
          </div>
          <div className="container-page flex items-center justify-between border-t border-line py-4 pb-8">
            <span className="text-sm text-muted">Appearance</span>
            <ThemeToggle className={cn(iconBtn, 'border border-line')} />
          </div>
        </div>
      )}
    </>
  );
}

interface GroupItemProps {
  group: NavGroup;
  pathname: string;
  open: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onToggle: () => void;
  onNavigate: () => void;
}

// These have their own top-level links, so they don't light up a menu as well.
const TOP_LEVEL = ['/near-me', '/teams'];

function GroupItem({ group, pathname, open, onEnter, onLeave, onToggle, onNavigate }: GroupItemProps) {
  const active = group.items.some((i) => !TOP_LEVEL.includes(i.href) && isActive(pathname, i.href));
  return (
    <li className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <button
        type="button"
        className={navLink(active || open)}
        aria-expanded={open}
        aria-controls={`nav-${group.label.toLowerCase()}`}
        onClick={onToggle}
      >
        {group.label}
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>
      {open && <Dropdown group={group} pathname={pathname} onNavigate={onNavigate} />}
    </li>
  );
}

function MobileLinks({ title, items, pathname }: { title: string; items: NavGroup['items']; pathname: string }) {
  return (
    <div>
      <p className="mb-1.5 px-3 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-board/80">{title}</p>
      <ul>
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                'flex min-h-[44px] items-center gap-3 rounded-md px-3 py-2 font-display text-[18px] font-semibold uppercase tracking-[0.04em] transition-colors hover:bg-ink/[0.06]',
                isActive(pathname, item.href) ? 'bg-ink/[0.08] text-board' : 'text-ink/85'
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0 text-muted" aria-hidden="true" />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
