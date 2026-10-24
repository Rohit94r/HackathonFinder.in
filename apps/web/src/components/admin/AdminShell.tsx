'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import useSWR from 'swr';
import { BarChart3, ExternalLink, Flag, Inbox, LayoutDashboard, ListChecks, LogOut, Menu, MessagesSquare, Radar, Settings, Users, X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Counts {
  review: number;
  openReports: number;
  scraping: boolean;
}

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/hackathons', label: 'Hackathons', icon: ListChecks },
  { href: '/admin/scraper', label: 'Scraper', icon: Radar, badge: 'scraping' as const },
  { href: '/admin/review', label: 'Review', icon: Inbox, badge: 'review' as const },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/community', label: 'Community', icon: MessagesSquare },
  { href: '/admin/reports', label: 'Reports', icon: Flag, badge: 'openReports' as const },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

/** The admin frame: a sidebar on wide screens, a top bar with a menu on phones. */
export default function AdminShell({ admin, children }: { admin: { handle: string; name: string }; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: counts } = useSWR<Counts>('/api/admin/counts', { refreshInterval: 60_000 });
  useEffect(() => setOpen(false), [pathname]);

  const badge = (key?: 'review' | 'openReports' | 'scraping') => {
    if (!key || !counts) return null;
    if (key === 'scraping') return counts.scraping ? <span className="text-[10px] font-semibold uppercase tracking-wide">running</span> : null;
    const n = counts[key];
    return n ? <span className="min-w-[20px] rounded-[2px] border border-current px-1 text-center text-[11px] tabular-nums leading-4">{n > 99 ? '99+' : n}</span> : null;
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="border-b border-neutral-300 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-56 lg:shrink-0 lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="flex h-14 items-center justify-between px-4 lg:h-auto lg:py-5">
          <Link href="/admin" className="leading-tight">
            <span className="block text-sm font-semibold">HackathonFinder</span>
            <span className="block text-[11px] uppercase tracking-[0.2em] text-neutral-500">Admin</span>
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[3px] border border-neutral-400 lg:hidden"
            aria-expanded={open}
            aria-controls="admin-nav"
            aria-label={open ? 'Close the menu' : 'Open the menu'}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
        <nav id="admin-nav" aria-label="Admin" className={cn('border-t border-neutral-200 lg:flex lg:flex-1 lg:flex-col lg:border-0', open ? 'block' : 'hidden')}>
          <ul className="py-1 lg:py-0">
            {NAV.map((item) => {
              const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn('flex items-center gap-2.5 px-4 py-2 text-sm', active ? 'bg-black text-white' : 'text-black hover:bg-neutral-100')}
                  >
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="flex-1">{item.label}</span>
                    {badge(item.badge)}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-auto space-y-2 border-t border-neutral-200 px-4 py-4 text-xs">
            <p className="truncate text-neutral-500" title={admin.name}>
              Signed in as <span className="text-black">@{admin.handle}</span>
            </p>
            <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:underline">
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              Open the public site
            </a>
            <button type="button" className="flex items-center gap-1.5 hover:underline" onClick={() => void signOut({ callbackUrl: '/admin/login' })}>
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </nav>
      </aside>
      <main id="main" className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        {children}
      </main>
    </div>
  );
}
