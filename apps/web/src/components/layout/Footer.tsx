import Link from 'next/link';
import { CITIES, THEMES } from '@hackathonfinder/shared';
import { Logo } from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import { activeSocials, siteConfig } from '@/data/siteConfig';

const COLUMNS = [
  {
    title: 'Explore',
    links: [
      { href: '/hackathons', label: 'All hackathons' },
      { href: '/near-me', label: 'Hackathons near me' },
      { href: '/hackathons?status=closing-soon', label: 'Closing soon' },
      { href: '/hackathons?city=online', label: 'Online hackathons' },
      { href: '/calendar', label: 'Calendar' },
      { href: '/saved', label: 'Saved' },
    ],
  },
  {
    title: 'Cities',
    links: [...CITIES.slice(0, 6).map((c) => ({ href: `/cities/${c.slug}`, label: c.name })), { href: '/cities', label: 'All cities' }],
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
      { href: '/profile', label: 'My events' },
      { href: '/blog', label: 'Blog & guides' },
      { href: siteConfig.social.whatsapp, label: 'WhatsApp community' },
      { href: '/submit', label: 'Submit a hackathon' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/how-it-works', label: 'How it works' },
      { href: '/organizers', label: 'For organizers' },
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
    ],
  },
];

const SOCIALS = activeSocials([
  { href: siteConfig.social.instagram, label: 'Instagram' },
  { href: siteConfig.social.linkedin, label: 'LinkedIn' },
  { href: siteConfig.social.github, label: 'GitHub' },
  { href: siteConfig.social.facebook, label: 'Facebook' },
  { href: siteConfig.social.whatsapp, label: 'WhatsApp' },
  { href: siteConfig.social.telegram, label: 'Telegram' },
  { href: siteConfig.social.discord, label: 'Discord' },
]);

export default function Footer() {
  return (
    <footer className="border-t border-line bg-card">
      <div className="container-page grid gap-10 py-14 lg:grid-cols-[1.1fr_3fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm leading-6 text-muted">
            {siteConfig.tagline} We find hackathons across the internet so you can spend your time building, not searching.
          </p>
          <a href={`mailto:${siteConfig.email}`} className="inline-block text-sm font-medium text-ink hover:text-accent">
            {siteConfig.email}
          </a>
          {SOCIALS.length > 0 && (
            <ul className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
              {SOCIALS.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-sm text-muted transition-colors hover:text-ink">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 text-sm font-semibold text-ink">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted transition-colors hover:text-ink">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-3 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.domain}. Founded by{' '}
            <Link href="/about#founder" className="underline-offset-2 hover:text-ink hover:underline">
              {siteConfig.founder.name}
            </Link>{' '}
            and{' '}
            <Link href="/about#co-founder" className="underline-offset-2 hover:text-ink hover:underline">
              {siteConfig.coFounder.name}
            </Link>
            . We link to official organizer pages; always check details before you register.
          </p>
          <div className="flex items-center gap-2">
            <span>Theme</span>
            <ThemeToggle
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink/70 transition-colors hover:bg-ink/[0.04] hover:text-ink"
              iconClassName="h-4 w-4"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
