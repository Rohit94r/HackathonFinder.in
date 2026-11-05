import Link from 'next/link';
import { CITIES, THEMES } from '@hackathonfinder/shared';
import { Logo } from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import CopyrightYear from './CopyrightYear';
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
    // End of the line: a dark band under the canopy, with the track running across the top.
    <footer data-theme="dark" className="relative bg-surface text-ink">
      <div className="rail-track opacity-80" aria-hidden="true" />
      <div className="container-page grid gap-10 pb-12 pt-12 lg:grid-cols-[1.1fr_3fr]">
        <div className="space-y-5">
          <Logo size="lg" />
          <p className="max-w-xs text-[15px] leading-6 text-muted">
            {siteConfig.tagline} We find hackathons across the internet so you can spend your time building, not searching.
          </p>
          <a href={`mailto:${siteConfig.email}`} className="inline-block font-mono text-sm text-board hover:underline">
            {siteConfig.email}
          </a>
          {SOCIALS.length > 0 && (
            <ul className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
              {SOCIALS.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-display text-[15px] font-semibold uppercase tracking-[0.06em] text-muted transition-colors hover:text-board"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {COLUMNS.map((col, i) => (
            <div key={col.title}>
              <h3 className="mb-3 flex items-center gap-2 font-display text-[15px] font-bold uppercase tracking-[0.08em] text-ink">
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-[3px] bg-board px-1 font-display text-[13px] font-extrabold text-navy" aria-hidden="true">
                  {i + 1}
                </span>
                {col.title}
              </h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted transition-colors hover:text-board">
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
            © <CopyrightYear initial={new Date().getFullYear()} /> {siteConfig.domain}. Founded by{' '}
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
            <span className="font-mono uppercase tracking-[0.14em]">Day / night</span>
            <ThemeToggle
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line text-ink/70 transition-colors hover:border-board hover:text-board"
              iconClassName="h-4 w-4"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
