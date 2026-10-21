'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bookmark, Menu, X } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useSaved } from '@/lib/useSaved';
import { cn } from '@/lib/cn';

const LINKS = [
  { href: '/hackathons', label: 'Explore' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/teams', label: 'Team Finder' },
  { href: '/community', label: 'Community' },
  { href: '/blog', label: 'Blog' },
  { href: '/organizers', label: 'Organizers' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { count, ready } = useSaved();

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="on-dark sticky top-0 z-50 border-b border-surface/10 bg-ink">
      <nav className="container-page flex h-[72px] items-center justify-between gap-4" aria-label="Main">
        <Logo dark />

        <ul className="hidden items-center gap-6 xl:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  'whitespace-nowrap text-sm font-medium uppercase tracking-wide transition',
                  isActive(link.href) ? 'text-white' : 'text-surface/85 hover:text-white'
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <Link
            href="/saved"
            className="btn-ghost-dark hidden h-11 whitespace-nowrap px-3 py-0 text-sm sm:inline-flex"
            aria-label={`My hackathons${ready && count ? `, ${count} saved` : ''}`}
          >
            <Bookmark className="h-4 w-4" />
            <span className="2xl:inline xl:hidden">My hackathons</span>
            {ready && count > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-ink">
                {count}
              </span>
            )}
          </Link>
          <Link href="/submit" className="btn-primary hidden h-11 whitespace-nowrap px-4 py-0 text-sm md:inline-flex">
            Submit a hackathon
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink xl:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-surface/10 bg-ink xl:hidden">
          <ul className="container-page flex flex-col py-4">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    'block py-3 text-lg font-medium uppercase tracking-wide',
                    isActive(link.href) ? 'text-white' : 'text-surface'
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="flex gap-3 pt-4">
              <Link href="/saved" className="btn-ghost-dark flex-1 text-sm">
                <Bookmark className="h-4 w-4" />
                My hackathons{ready && count > 0 ? ` (${count})` : ''}
              </Link>
              <Link href="/submit" className="btn-primary flex-1 text-sm">
                Submit
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
