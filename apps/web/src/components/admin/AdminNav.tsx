'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Flag, Inbox, LayoutDashboard, ListChecks, Users } from 'lucide-react';
import { cn } from '@/lib/cn';

const LINKS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/review', label: 'Review queue', icon: Inbox },
  { href: '/admin/listings', label: 'Listings', icon: ListChecks },
  { href: '/admin/reports', label: 'Reports', icon: Flag },
  { href: '/admin/sources', label: 'Sources & runs', icon: Activity },
  { href: '/admin/users', label: 'Users', icon: Users },
];

/** Tabs across the top of every admin page. Scrolls sideways on small screens instead of wrapping the page. */
export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-2">
        {LINKS.map((l) => {
          const active = l.exact ? pathname === l.href : pathname === l.href || pathname.startsWith(`${l.href}/`);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition',
                  active ? 'border-accent bg-accent text-white' : 'border-ink/15 text-ink/80 hover:border-ink/40 hover:text-ink'
                )}
              >
                <l.icon className="h-4 w-4" />
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
