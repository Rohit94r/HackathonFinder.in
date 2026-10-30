'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bookmark, Calendar, ChevronDown, Compass, MapPin, Menu, Plus, Sparkles, Trophy, Users, X } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useSaved } from '@/lib/useSaved';
import { useProfile } from '@/lib/useProfile';
import Avatar from '@/components/Avatar';
import ThemeToggle from '@/components/ThemeToggle';
import { cn } from '@/lib/cn';

export function LandingNavbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { count } = useSaved();
  const { me } = useProfile();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-200',
        scrolled
          ? 'bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800 shadow-sm'
          : 'bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm border-b border-transparent'
      )}
    >
      <div className="container-page flex h-16 sm:h-20 items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Logo />
          
          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 text-[14px] font-medium text-slate-700 dark:text-zinc-200">
            <Link
              href="/hackathons"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg hover:text-accent hover:bg-red-50/50 dark:hover:bg-red-950/20 transition"
            >
              <Compass className="h-4 w-4 text-accent" />
              <span>Hackathons</span>
            </Link>

            <Link
              href="/near-me"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg hover:text-accent hover:bg-red-50/50 dark:hover:bg-red-950/20 transition"
            >
              <MapPin className="h-4 w-4 text-accent" />
              <span>Near Me</span>
            </Link>

            <Link
              href="/cities"
              className="px-3 py-2 rounded-lg hover:text-accent hover:bg-red-50/50 dark:hover:bg-red-950/20 transition"
            >
              Cities
            </Link>

            <Link
              href="/teams"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg hover:text-accent hover:bg-red-50/50 dark:hover:bg-red-950/20 transition"
            >
              <Users className="h-4 w-4 text-accent" />
              <span>Find Team</span>
            </Link>

            <Link
              href="/wins"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg hover:text-accent hover:bg-red-50/50 dark:hover:bg-red-950/20 transition"
            >
              <Trophy className="h-4 w-4 text-accent" />
              <span>Wins</span>
            </Link>

            <Link
              href="/calendar"
              className="px-3 py-2 rounded-lg hover:text-accent hover:bg-red-50/50 dark:hover:bg-red-950/20 transition"
            >
              Calendar
            </Link>
          </nav>
        </div>

        {/* Right CTA cluster */}
        <div className="flex items-center gap-3">
          {/* Saved count badge */}
          <Link
            href="/saved"
            aria-label="Saved hackathons"
            className="relative hidden sm:inline-flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 hover:border-red-200 hover:text-accent transition shadow-sm"
          >
            <Bookmark className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white shadow-sm">
                {count}
              </span>
            )}
          </Link>

          <ThemeToggle />

          {/* User or Login */}
          {me ? (
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1.5 pr-3 text-xs font-semibold text-slate-800 dark:text-zinc-100 hover:border-accent transition"
            >
              <Avatar name={me.name || me.email} size="xs" />
              <span className="hidden md:inline max-w-[90px] truncate">{me.name || 'Account'}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center justify-center rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-accent transition"
            >
              Sign In
            </Link>
          )}

          {/* Post Hackathon Primary Button */}
          <Link
            href="/submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-accent-dark active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden xs:inline">Post Event</span>
            <span className="xs:hidden">Post</span>
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-5 py-6 shadow-xl animate-in slide-in-from-top-4 duration-150">
          <nav className="flex flex-col gap-2">
            <Link
              href="/hackathons"
              className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-base font-semibold text-slate-800 dark:text-zinc-100 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-accent"
            >
              <Compass className="h-5 w-5 text-accent" />
              Explore All Hackathons
            </Link>
            <Link
              href="/near-me"
              className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-base font-semibold text-slate-800 dark:text-zinc-100 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-accent"
            >
              <MapPin className="h-5 w-5 text-accent" />
              Hackathons Near Me
            </Link>
            <Link
              href="/teams"
              className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-base font-semibold text-slate-800 dark:text-zinc-100 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-accent"
            >
              <Users className="h-5 w-5 text-accent" />
              Team Finder
            </Link>
            <Link
              href="/cities"
              className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-base font-semibold text-slate-800 dark:text-zinc-100 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-accent"
            >
              Browse by City
            </Link>
            <Link
              href="/wins"
              className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-base font-semibold text-slate-800 dark:text-zinc-100 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-accent"
            >
              <Trophy className="h-5 w-5 text-accent" />
              Student Winning Stories
            </Link>
            <Link
              href="/calendar"
              className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-base font-semibold text-slate-800 dark:text-zinc-100 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-accent"
            >
              <Calendar className="h-5 w-5 text-accent" />
              Hackathon Calendar
            </Link>
            <Link
              href="/saved"
              className="flex items-center justify-between rounded-xl px-3.5 py-3 text-base font-semibold text-slate-800 dark:text-zinc-100 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-accent"
            >
              <div className="flex items-center gap-3">
                <Bookmark className="h-5 w-5 text-accent" />
                Saved Hackathons
              </div>
              {count > 0 && (
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-white">
                  {count}
                </span>
              )}
            </Link>
          </nav>

          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-zinc-800 flex flex-col gap-3">
            {!me && (
              <Link
                href="/login"
                className="w-full text-center rounded-xl border border-slate-200 dark:border-zinc-800 py-3 text-sm font-semibold text-slate-800 dark:text-zinc-100"
              >
                Sign In to Account
              </Link>
            )}
            <Link
              href="/submit"
              className="w-full text-center rounded-xl bg-accent py-3 text-sm font-semibold text-white shadow-sm hover:bg-accent-dark"
            >
              Post a Hackathon Free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
