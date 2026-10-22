'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bookmark, ChevronDown, Menu, Navigation, Plus, X } from 'lucide-react';
import { Logo } from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import { MobileAccountLinks, NavAccount } from '@/components/auth/AccountMenu';
import { NAV_COMMUNITY, NAV_HACKATHONS, type NavGroup } from '@/data/navigation';
import { useSaved } from '@/lib/useSaved';
import { cn } from '@/lib/cn';

const iconBtn =
  'inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 text-ink/80 transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pop';

function pill(active: boolean) {
  return cn(
    'inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[15px] font-semibold transition',
    active ? 'bg-accent/10 text-brand-700 dark:text-brand-300' : 'text-ink/80 hover:bg-ink/[0.05] hover:text-ink'
  );
}

function isActive(pathname: string, href: string) {
  // Filtered views like "Closing soon" share a path with "All hackathons"; only the plain link lights up.
  if (href.includes('?')) return false;
  const path = href;
  return pathname === path || pathname.startsWith(`${path}/`);
}

function Dropdown({ group, pathname, onNavigate }: { group: NavGroup; pathname: string; onNavigate: () => void }) {
  return (
    <div
      id={`nav-${group.label.toLowerCase()}`}
      className="hf-dd-in absolute left-1/2 top-full z-50 w-[380px] -translate-x-1/2 pt-3"
    >
      <ul className="rounded-2xl border border-ink/10 bg-card p-2 shadow-lift dark:border-white/10">
        {group.items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'group flex items-start gap-3 rounded-xl px-3 py-2.5 transition hover:bg-ink/[0.05]',
                isActive(pathname, item.href) && 'bg-ink/[0.05]'
              )}
            >
              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent transition group-hover:bg-accent group-hover:text-white">
                <item.icon className="h-[18px] w-[18px]" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink">{item.label}</span>
                <span className="block text-xs text-ink/60">{item.description}</span>
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
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-surface/85 backdrop-blur-xl">
      {/* On wide screens, equal side columns keep the links exactly centred. */}
      <nav
        ref={navRef}
        className="container-page flex h-[72px] items-center justify-between gap-4 xl:grid xl:grid-cols-[1fr_auto_1fr]"
        aria-label="Main"
      >
        <div className="xl:justify-self-start">
          <Logo />
        </div>

        <ul className="hidden items-center gap-1 xl:flex xl:justify-self-center">
          <GroupItem {...groupProps(NAV_HACKATHONS)} />
          <li>
            <Link href="/near-me" className={pill(isActive(pathname, '/near-me'))}>
              <span className="relative inline-flex">
                <Navigation className="h-4 w-4 text-accent" />
                <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 animate-ping rounded-full bg-accent motion-reduce:hidden" aria-hidden="true" />
              </span>
              Near me
            </Link>
          </li>
          <li>
            <Link href="/teams" className={pill(isActive(pathname, '/teams'))}>
              Team Finder
            </Link>
          </li>
          <GroupItem {...groupProps(NAV_COMMUNITY)} />
        </ul>

        <div className="flex items-center gap-2 xl:justify-self-end">
          <ThemeToggle className={iconBtn} />
          <Link
            href="/saved"
            className={cn(iconBtn, 'relative hidden sm:inline-flex')}
            aria-label={`My hackathons${ready && count ? `, ${count} saved` : ''}`}
            title="My hackathons"
          >
            <Bookmark className="h-[18px] w-[18px]" />
            {ready && count > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-pop px-1 text-[11px] font-bold text-navy">
                {count}
              </span>
            )}
          </Link>
          {/* Bell and avatar menu when signed in, "Sign in" when not. */}
          <NavAccount iconClassName={iconBtn} />
          <Link href="/submit" className="btn-primary hidden h-10 whitespace-nowrap rounded-full px-4 py-0 text-sm md:inline-flex">
            <Plus className="h-4 w-4" />
            Submit
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white xl:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>
      {/* Red hairline under the bar */}
      <div className="h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" aria-hidden="true" />

      {mobileOpen && (
        <div id="mobile-menu" className="hf-dd-in max-h-[calc(100vh-73px)] overflow-y-auto border-t border-ink/10 bg-surface xl:hidden">
          <div className="container-page grid gap-6 py-6 sm:grid-cols-2">
            <MobileLinks
              title="Find"
              items={[
                { ...NAV_HACKATHONS.items[1], label: 'Hackathons near me' },
                ...NAV_HACKATHONS.items.filter((i) => i.href !== '/near-me'),
              ]}
              pathname={pathname}
            />
            <MobileLinks title="Community" items={NAV_COMMUNITY.items} pathname={pathname} />
          </div>
          <div className="container-page border-t border-ink/10 py-6">
            <MobileAccountLinks />
          </div>
          <div className="container-page flex gap-3 pb-6">
            <Link href="/saved" className="btn-secondary flex-1 px-3 text-sm">
              <Bookmark className="h-4 w-4" />
              Saved{ready && count > 0 ? ` (${count})` : ''}
            </Link>
            <Link href="/submit" className="btn-primary flex-1 px-3 text-sm">
              Submit
            </Link>
          </div>
        </div>
      )}
    </header>
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
        className={pill(active || open)}
        aria-expanded={open}
        aria-controls={`nav-${group.label.toLowerCase()}`}
        onClick={onToggle}
      >
        {group.label}
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <Dropdown group={group} pathname={pathname} onNavigate={onNavigate} />}
    </li>
  );
}

function MobileLinks({ title, items, pathname }: { title: string; items: NavGroup['items']; pathname: string }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/50">{title}</p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-ink/[0.05]',
                isActive(pathname, item.href) ? 'bg-accent/10 text-brand-700 dark:text-brand-300' : 'text-ink'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0 text-accent" />
              <span>
                <span className="block font-semibold">{item.label}</span>
                <span className="block text-xs text-ink/60">{item.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
