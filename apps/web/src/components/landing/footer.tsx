import Link from 'next/link';
import { Facebook, Instagram, Linkedin, Mail, MessageCircle, Send } from 'lucide-react';
import { CITIES } from '@hackathonfinder/shared';
import { siteConfig } from '@/data/siteConfig';
import { LandingLogo } from './navbar';
import { InlineStyle } from './inline-style';

const footerLinkStyles = {
  fontWeight: 400,
  fontSize: 16,
  color: 'var(--paper)',
  textDecoration: 'none',
  opacity: 0.8,
  transition: 'opacity 0.15s',
  display: 'inline-block',
} as const;

const sectionHeadingStyles = {
  fontWeight: 700,
  fontSize: 20,
  color: 'var(--paper)',
  margin: 0,
  marginBottom: 16,
  lineHeight: 1.2,
} as const;

const socials = [
  { label: 'Instagram', href: siteConfig.social.instagram, Icon: Instagram },
  { label: 'LinkedIn', href: siteConfig.social.linkedin, Icon: Linkedin },
  { label: 'Facebook', href: siteConfig.social.facebook, Icon: Facebook },
  { label: 'WhatsApp', href: siteConfig.social.whatsapp, Icon: MessageCircle },
  { label: 'Telegram', href: siteConfig.social.telegram, Icon: Send },
  { label: 'Email', href: `mailto:${siteConfig.email}`, Icon: Mail },
];

const columns = [
  {
    title: 'Explore',
    links: [
      { label: 'All hackathons', href: '/hackathons' },
      { label: 'Hackathons near me', href: '/near-me' },
      { label: 'Closing soon', href: '/hackathons?status=closing-soon' },
      { label: 'Online hackathons', href: '/hackathons?city=online' },
      { label: 'Calendar', href: '/calendar' },
      { label: 'My hackathons', href: '/saved' },
    ],
  },
  {
    title: 'Cities',
    links: [...CITIES.slice(0, 6).map((c) => ({ label: c.name, href: `/cities/${c.slug}` })), { label: 'All cities →', href: '/cities' }],
  },
  {
    title: 'Community',
    links: [
      { label: 'Discussions', href: '/community' },
      { label: 'Team Finder', href: '/teams' },
      { label: 'Winning stories', href: '/wins' },
      { label: 'My profile', href: '/profile' },
      { label: 'Blog & guides', href: '/blog' },
    ],
  },
  {
    title: 'HackathonFinder',
    links: [
      { label: 'How it works', href: '/how-it-works' },
      { label: 'For organizers', href: '/organizers' },
      { label: 'Submit a hackathon', href: '/submit' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
];

function LinkCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div style={{ minWidth: 140 }}>
      <p style={sectionHeadingStyles}>{title}</p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="footer-link" style={footerLinkStyles}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LandingFooter() {
  return (
    <footer
      className="site-footer"
      style={{
        background: 'linear-gradient(90deg, var(--grid-line) 1px, transparent 1px), linear-gradient(var(--grid-line) 1px, transparent 1px), var(--footer-bg)',
        backgroundSize: '50px 50px',
        color: 'var(--paper)',
        paddingTop: 80,
        paddingBottom: 60,
        paddingLeft: 'clamp(24px, 6vw, 80px)',
        paddingRight: 'clamp(24px, 6vw, 80px)',
        fontFamily: 'var(--lp-sans)',
        position: 'relative',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '48px 64px', marginBottom: 64 }}>
        <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, width: 300, maxWidth: '100%' }}>
          <div style={{ marginBottom: 24 }}>
            <LandingLogo light />
          </div>
          <p style={{ fontSize: 20, color: 'var(--paper)', margin: '0 0 8px', lineHeight: 1.25 }}>{siteConfig.tagline}</p>
          <a href={`mailto:${siteConfig.email}`} style={{ fontSize: 20, color: 'var(--paper)', margin: '0 0 28px', lineHeight: 1.2, textDecoration: 'none' }}>
            {siteConfig.email}
          </a>
          <div style={{ display: 'flex', gap: 12 }}>
            {socials.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="footer-social-link"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  border: '1.5px solid rgba(255,255,255,0.3)',
                  color: 'var(--paper)',
                  opacity: 0.8,
                  transition: 'opacity 0.15s',
                }}
              >
                <Icon size={22} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
          {columns.map((col) => (
            <LinkCol key={col.title} title={col.title} links={col.links} />
          ))}
        </div>
      </div>

      <div style={{ paddingTop: 32, maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        <p style={{ fontSize: 16, color: 'var(--paper)', opacity: 0.8, margin: 0, lineHeight: 1.5 }}>
          © {new Date().getFullYear()} {siteConfig.domain}. Made for students who build.
        </p>
        <p style={{ fontSize: 16, color: 'var(--paper)', opacity: 0.8, margin: 0, lineHeight: 1.5 }}>
          We link to official organizer pages. Always check details before you register.
        </p>
      </div>

      <InlineStyle css={`
        .footer-link:hover, .footer-link:focus-visible,
        .footer-social-link:hover, .footer-social-link:focus-visible { opacity: 1 !important; }
        @media (max-width: 767px) {
          .site-footer { padding-top: 120px !important; }
        }
      `} />
    </footer>
  );
}
