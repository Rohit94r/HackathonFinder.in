import Link from 'next/link';
import { CITIES, THEMES } from '@hackathonfinder/shared';
import HeroScene from '@/components/art/HeroScene';
import NightSky from '@/components/art/NightSky';
import ParallaxScene from '@/components/motion/ParallaxScene';
import { Logo } from '@/components/Logo';
import { siteConfig } from '@/data/siteConfig';

const COLUMNS = [
  {
    title: 'Explore',
    links: [
      { href: '/hackathons', label: 'All hackathons' },
      { href: '/near-me', label: 'Hackathons near me' },
      { href: '/hackathons?status=closing-soon', label: 'Closing soon' },
      { href: '/hackathons?city=online', label: 'Online hackathons' },
      { href: '/calendar', label: 'Calendar' },
      { href: '/saved', label: 'My hackathons' },
    ],
  },
  {
    title: 'Cities',
    links: [...CITIES.slice(0, 6).map((c) => ({ href: `/cities/${c.slug}`, label: c.name })), { href: '/cities', label: 'All cities →' }],
  },
  {
    title: 'Themes',
    links: THEMES.slice(0, 6).map((t) => ({ href: `/themes/${t.slug}`, label: t.name })),
  },
  {
    title: 'Community',
    links: [
      { href: '/community', label: 'Discussions' },
      { href: '/teams', label: 'Team Finder' },
      { href: '/wins', label: 'Winning stories' },
      { href: '/profile', label: 'My profile' },
      { href: '/blog', label: 'Blog & guides' },
      { href: siteConfig.social.whatsapp, label: 'WhatsApp community' },
      { href: '/submit', label: 'Submit a hackathon' },
      { href: '/privacy', label: 'Privacy' },
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
  { href: siteConfig.social.facebook, label: 'Facebook' },
  { href: siteConfig.social.whatsapp, label: 'WhatsApp' },
  { href: siteConfig.social.telegram, label: 'Telegram' },
  { href: siteConfig.social.discord, label: 'Discord' },
];

export default function Footer() {
  return (
    <footer className="on-dark noir overflow-hidden bg-ink text-surface">
      <NightSky className="-z-10" />
      {/* Big closing headline */}
      <div data-reveal="zoom" className="container-page relative z-[3] flex flex-col items-center pt-24 text-center">
        <h2 className="text-5xl text-surface sm:text-7xl lg:text-8xl">Find your hackathon.</h2>
        <p className="pb-2 font-display text-5xl leading-[1.08] text-neon sm:text-7xl lg:text-8xl">
          Build something great.
        </p>
        <Link href="/hackathons" className="btn-ghost-dark mt-10">
          Start exploring
        </Link>
      </div>
      <ParallaxScene className="mt-12">
        <HeroScene />
      </ParallaxScene>

      {/* Links */}
      <div className="container-page relative z-[3] grid gap-12 py-16 lg:grid-cols-[1.2fr_3fr]">
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
                className="rounded-full border border-surface/30 px-4 py-1.5 text-sm font-medium text-surface transition hover:border-accent hover:bg-accent hover:text-white"
              >
                {s.label}
              </a>
            ))}
          </div>
          <div>
            <p className="text-sm text-surface/60">Get in touch</p>
            <a href={`mailto:${siteConfig.email}`} className="text-lg font-medium text-surface underline decoration-accent underline-offset-4 hover:text-brand-300">
              {siteConfig.email}
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-pop">{col.title}</h3>
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
  );
}
