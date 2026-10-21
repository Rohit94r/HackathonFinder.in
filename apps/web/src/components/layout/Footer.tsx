import Link from 'next/link';
import { ChevronDown, Search } from 'lucide-react';
import { CITIES, THEMES } from '@hackathonfinder/shared';
import HeroScene from '@/components/art/HeroScene';
import { Logo } from '@/components/Logo';
import { siteConfig } from '@/data/siteConfig';

const COLUMNS = [
  {
    title: 'Explore',
    links: [
      { href: '/hackathons', label: 'All hackathons' },
      { href: '/hackathons?status=closing-soon', label: 'Closing soon' },
      { href: '/hackathons?city=online', label: 'Online hackathons' },
      { href: '/calendar', label: 'Calendar' },
      { href: '/saved', label: 'My hackathons' },
    ],
  },
  {
    title: 'Cities',
    links: CITIES.map((c) => ({ href: `/cities/${c.slug}`, label: c.name })),
  },
  {
    title: 'Themes',
    links: THEMES.slice(0, 6).map((t) => ({ href: `/themes/${t.slug}`, label: t.name })),
  },
  {
    title: 'Community',
    links: [
      { href: '/teams', label: 'Team Finder' },
      { href: '/community', label: 'Community' },
      { href: '/blog', label: 'Blog & guides' },
      { href: '/submit', label: 'Submit a hackathon' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/how-it-works', label: 'How it works' },
      { href: '/organizers', label: 'For organizers' },
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
    ],
  },
];

const SOCIALS = [
  { href: siteConfig.social.instagram, label: 'Instagram' },
  { href: siteConfig.social.linkedin, label: 'LinkedIn' },
  { href: siteConfig.social.telegram, label: 'Telegram' },
  { href: siteConfig.social.discord, label: 'Discord' },
];

export default function Footer() {
  return (
    <>
      <footer className="on-dark bg-ink text-surface">
        {/* Big closing headline */}
        <div className="container-page flex flex-col items-center pt-24 text-center">
          <h2 className="text-5xl text-surface sm:text-7xl lg:text-8xl">Find your hackathon.</h2>
          <p className="font-display text-5xl uppercase leading-[0.9] tracking-tight text-outline sm:text-7xl lg:text-8xl">
            Build something great.
          </p>
          <Link href="/hackathons" className="btn-ghost-dark mt-10">
            Start exploring
          </Link>
        </div>
        <HeroScene className="mt-12" />

        {/* Links */}
        <div className="container-page grid gap-12 py-16 lg:grid-cols-[1.2fr_3fr]">
          <div className="space-y-5">
            <Logo dark />
            <p className="max-w-xs text-sm leading-6 text-surface/70">
              {siteConfig.tagline} We find hackathons across the internet so you can spend your time
              building, not searching.
            </p>
            <div className="flex flex-wrap gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="rounded-full border-2 border-surface/40 px-4 py-1.5 text-sm font-medium text-surface hover:border-white hover:text-white"
                >
                  {s.label}
                </a>
              ))}
            </div>
            <div>
              <p className="text-sm text-surface/60">Get in touch</p>
              <a href={`mailto:${siteConfig.email}`} className="text-lg font-medium text-surface underline underline-offset-4 hover:text-white">
                {siteConfig.email}
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white">{col.title}</h3>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-surface/80 transition hover:text-surface">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-surface/15">
          <div className="container-page flex flex-col gap-2 py-6 pb-24 text-xs text-surface/50 sm:flex-row sm:items-center sm:justify-between md:pb-6">
            <p>© 2026 {siteConfig.domain}. Made for students who build.</p>
            <p>We link to official organizer pages. Always check details before you register.</p>
          </div>
        </div>
      </footer>

      {/* Floating pill */}
      <Link
        href="/hackathons"
        className="fixed bottom-5 left-1/2 z-40 hidden -translate-x-1/2 items-center gap-3 rounded-[14px] border-2 border-ink bg-surface px-5 py-3 font-display text-sm uppercase text-ink shadow-lift transition hover:bg-ink hover:text-white md:inline-flex"
      >
        <Search className="h-4 w-4" />
        Find your hackathon
        <ChevronDown className="h-4 w-4" />
      </Link>
    </>
  );
}
