'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bookmark, ChevronDown, Menu, Plus, Search, X } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { MobileAccountLinks, NavAccount } from '@/components/auth/AccountMenu';
import { NAV_COMMUNITY, NAV_HACKATHONS, type NavGroup } from '@/data/navigation';
import { useSaved } from '@/lib/useSaved';
import { cn } from '@/lib/cn';

const iconBtn =
  'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ink/10 bg-card text-ink/65 transition hover:border-ink/20 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

function linkClass(active: boolean) {
  return cn(
    'relative inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[14px] font-medium transition',
    active ? 'bg-accent/[0.07] text-brand-700' : 'text-ink/65 hover:bg-ink/[0.04] hover:text-ink'
  );
}

function isActive(pathname: string, href: string) {
  if (href.includes('?')) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Dropdown({ group, pathname, onNavigate }: { group: NavGroup; pathname: string; onNavigate: () => void }) {
  return (
    <div
      id={`nav-${group.label.toLowerCase()}`}
      className="hf-dd-in absolute left-1/2 top-full z-50 w-[380px] -translate-x-1/2 pt-2"
    >
      <ul className="rounded-xl border border-ink/10 bg-card p-1.5 shadow-lift">
        {group.items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'group flex items-start gap-3 rounded-lg px-3 py-2.5 transition hover:bg-accent/[0.05]',
                isActive(pathname, item.href) && 'bg-accent/[0.05]'
              )}
            >
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ink/[0.08] bg-surface text-ink/70 transition group-hover:border-accent/20 group-hover:bg-accent group-hover:text-white">
                <item.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13.5px] font-semibold text-ink">{item.label}</span>
                <span className="mt-0.5 block text-xs leading-5 text-ink/55">{item.description}</span>
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
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenGroup(null);
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
    <header className="sticky top-0 z-50 border-b border-ink/[0.07] bg-white/90 backdrop-blur-xl">
      <nav ref={navRef} className="container-page flex h-16 items-center justify-between gap-4" aria-label="Main">
        <Logo />

        <ul className="hidden items-center gap-0.5 lg:flex">
          <GroupItem {...groupProps(NAV_HACKATHONS)} />
          <li>
            <Link href="/near-me" className={linkClass(isActive(pathname, '/near-me'))}>
              Near me
            </Link>
          </li>
          <li>
            <Link href="/teams" className={linkClass(isActive(pathname, '/teams'))}>
              Team Finder
            </Link>
          </li>
          <GroupItem {...groupProps(NAV_COMMUNITY)} />
          <li className="ml-1 border-l border-ink/10 pl-1">
            <Link href="/calendar" className={linkClass(isActive(pathname, '/calendar'))}>
              Calendar
            </Link>
          </li>
        </ul>

        <div className="flex items-center gap-1.5">
          <Link href="/hackathons" className={cn(iconBtn, 'hidden sm:inline-flex')} aria-label="Search hackathons" title="Search hackathons">
            <Search className="h-[17px] w-[17px]" />
          </Link>
          <Link
            href="/saved"
            className={cn(iconBtn, 'relative hidden sm:inline-flex')}
            aria-label={`My hackathons${ready && count ? `, ${count} saved` : ''}`}
            title="My hackathons"
          >
            <Bookmark className="h-[17px] w-[17px]" />
            {ready && count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white ring-2 ring-white">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>
          <NavAccount iconClassName={iconBtn} />
          <Link href="/submit" className="btn-primary ml-1 hidden h-9 rounded-lg px-3.5 py-0 text-[13.5px] md:inline-flex">
            <Plus className="h-4 w-4" />
            Submit
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ink/10 bg-card text-ink lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div id="mobile-menu" className="hf-dd-in max-h-[calc(100vh-65px)] overflow-y-auto border-t border-ink/10 bg-white lg:hidden">
          <div className="container-page grid gap-6 py-6">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/45">Find</p>
              <ul className="grid gap-1 sm:grid-cols-2">
                {[
                  ...NAV_HACKATHONS.items,
                  { href: '/near-me', label: 'Near me', description: 'Hackathons closest to you', icon: Search },
                  { href: '/teams', label: 'Team Finder', description: 'Find teammates for your next event', icon: Plus },
                  { href: '/calendar', label: 'Calendar', description: 'Every deadline in one view', icon: Bookmark },
                ].map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-ink/[0.04]',
                        isActive(pathname, item.href) ? 'bg-accent/[0.06] text-brand-700' : 'text-ink'
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0 text-accent" />
                      <span>
                        <span className="block text-sm font-semibold">{item.label}</span>
                        <span className="block text-xs text-ink/55">{item.description}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/45">Community</p>
              <ul className="grid gap-1 sm:grid-cols-2">
                {NAV_COMMUNITY.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-ink/[0.04]',
                        isActive(pathname, item.href) ? 'bg-accent/[0.06] text-brand-700' : 'text-ink'
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0 text-accent" />
                      <span>
                        <span className="block text-sm font-semibold">{item.label}</span>
                        <span className="block text-xs text-ink/55">{item.description}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-ink/10 pt-5">
              <MobileAccountLinks />
            </div>
            <div className="flex gap-2 border-t border-ink/10 pt-5">
              <Link href="/saved" className="btn-secondary flex-1">
                <Bookmark className="h-4 w-4" />
                Saved{ready && count > 0 ? ` (${count})` : ''}
              </Link>
              <Link href="/submit" className="btn-primary flex-1">
                <Plus className="h-4 w-4" />
                Submit
              </Link>
            </div>
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

const TOP_LEVEL = ['/near-me', '/teams'];

function GroupItem({ group, pathname, open, onEnter, onLeave, onToggle, onNavigate }: GroupItemProps) {
  const active = group.items.some((i) => !TOP_LEVEL.includes(i.href) && isActive(pathname, i.href));
  return (
    <li className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <button
        type="button"
        className={linkClass(active || open)}
        aria-expanded={open}
        aria-controls={`nav-${group.label.toLowerCase()}`}
        onClick={onToggle}
      >
        {group.label}
        <ChevronDown className={cn('h-3.5 w-3.5 text-ink/40 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <Dropdown group={group} pathname={pathname} onNavigate={onNavigate} />}
    </li>
  );
}
