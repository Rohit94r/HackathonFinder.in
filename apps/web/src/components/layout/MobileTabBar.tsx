'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bookmark, Navigation, Search, TrainFront, Users } from 'lucide-react';
import { useSaved } from '@/lib/useSaved';
import { cn } from '@/lib/cn';

const TABS = [
  { href: '/', label: 'Home', icon: TrainFront },
  { href: '/hackathons', label: 'Explore', icon: Search },
  { href: '/near-me', label: 'Near me', icon: Navigation },
  { href: '/saved', label: 'Saved', icon: Bookmark },
  { href: '/teams', label: 'Teams', icon: Users },
];

// Pages with their own bottom bar (a hackathon's Register bar, the chat composer) or none at all (admin).
const HIDDEN = [/^\/hackathons\/[^/]+$/, /^\/messages\/.+/, /^\/admin/];

/**
 * Phones: the main sections as an app-style tab bar along the bottom, out of the hamburger and
 * under the thumb. The lit tab gets the yellow platform edge. Hidden from lg up.
 */
export default function MobileTabBar() {
  const pathname = usePathname() ?? '/';
  const { count, ready } = useSaved();
  const hidden = HIDDEN.some((r) => r.test(pathname));

  // The page keeps clear of the bar and toasts sit above it (--hf-dock, see globals.css and Toaster).
  useEffect(() => {
    if (hidden) return;
    const root = document.documentElement;
    root.style.setProperty('--hf-dock', 'calc(60px + env(safe-area-inset-bottom))');
    return () => {
      root.style.removeProperty('--hf-dock');
    };
  }, [hidden]);

  if (hidden) return null;

  const active = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <>
      <nav
        data-theme="dark"
        aria-label="Sections"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-surface/95 pb-[env(safe-area-inset-bottom)] text-ink backdrop-blur supports-[backdrop-filter]:bg-surface/85 lg:hidden"
      >
        <ul className="mx-auto grid h-[60px] max-w-lg grid-cols-5">
          {TABS.map((t) => {
            const on = active(t.href);
            return (
              <li key={t.href} className="relative">
                {on && <span className="platform-edge absolute inset-x-3 top-0 h-[3px] rounded-b" aria-hidden="true" />}
                <Link
                  href={t.href}
                  aria-current={on ? 'page' : undefined}
                  className={cn(
                    'flex h-full flex-col items-center justify-center gap-1 font-display text-[11.5px] font-bold uppercase tracking-[0.06em] transition-colors',
                    on ? 'text-board' : 'text-ink/60 active:text-ink'
                  )}
                >
                  <span className="relative">
                    <t.icon className="h-[21px] w-[21px]" aria-hidden="true" />
                    {t.href === '/saved' && ready && count > 0 && (
                      <span className="absolute -right-2.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-[3px] bg-board px-1 font-mono text-[9.5px] font-bold leading-none text-navy">
                        {count}
                      </span>
                    )}
                  </span>
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
