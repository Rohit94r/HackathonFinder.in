import Link from 'next/link';
import { CITIES, THEMES } from '@hackathonfinder/shared';
import NewsletterForm from '@/components/NewsletterForm';
import { Logo } from '@/components/Logo';
import { activeSocials, siteConfig } from '@/data/siteConfig';

const COLUMNS = [
  {
    title: 'Explore',
    links: [
      { href: '/hackathons', label: 'All hackathons' },
      { href: '/near-me', label: 'Near me' },
      { href: '/hackathons?status=closing-soon', label: 'Closing soon' },
      { href: '/hackathons?city=online', label: 'Online' },
      { href: '/calendar', label: 'Calendar' },
      { href: '/saved', label: 'My hackathons' },
    ],
  },
  {
    title: 'Cities',
    links: [...CITIES.slice(0, 5).map((c) => ({ href: `/cities/${c.slug}`, label: c.name })), { href: '/cities', label: 'All cities' }],
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
      { href: '/blog', label: 'Guides & blog' },
      { href: siteConfig.social.whatsapp, label: 'WhatsApp' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/how-it-works', label: 'How it works' },
      { href: '/organizers', label: 'For organizers' },
      { href: '/submit', label: 'Submit an event' },
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
    ],
  },
];

const SOCIALS = activeSocials([
  { href: siteConfig.social.instagram, label: 'Instagram' },
  { href: siteConfig.social.linkedin, label: 'LinkedIn' },
  { href: siteConfig.social.github, label: 'GitHub' },
  { href: siteConfig.social.whatsapp, label: 'WhatsApp' },
]);

export default function Footer() {
  return (
    <footer className="border-t border-ink/[0.08] bg-white">
      <div className="h-[3px] w-full bg-accent" aria-hidden="true" />
      <div className="container-page py-12 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_2.4fr]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-6 text-ink/60">
              Every hackathon. One place. We search the internet twice a day so students can spend time building, not searching.
            </p>
            <div className="mt-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/45">The weekly digest</p>
              <p className="mt-1.5 text-sm text-ink/60">The best open hackathons, every Monday.</p>
              <div className="mt-3">
                <NewsletterForm dark={false} />
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] font-semibold text-ink/60 underline-offset-4 transition hover:text-accent hover:underline"
                >
                  {s.label}
                </a>
              ))}
              <a href={`mailto:${siteConfig.email}`} className="text-[13px] font-semibold text-ink/60 underline-offset-4 transition hover:text-accent hover:underline">
                Email
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/45">{col.title}</h3>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={`${col.title}-${link.href}`}>
                      <Link href={link.href} className="text-[13.5px] text-ink/65 transition hover:text-accent">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-ink/[0.08] pt-6 text-[12px] text-ink/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.domain}. Built by{' '}
            <Link href="/about" className="font-medium text-ink/70 underline-offset-2 hover:text-accent hover:underline">
              {siteConfig.founder.name}
            </Link>{' '}
            for students who build.
          </p>
          <p>Official organizer links only. Always check the details before registering.</p>
        </div>
      </div>
    </footer>
  );
}
