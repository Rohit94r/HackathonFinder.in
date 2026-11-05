import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Github, Globe, Instagram, Linkedin, Mail, type LucideIcon } from 'lucide-react';
import { CITIES, SOURCES } from '@hackathonfinder/shared';
import Avatar from '@/components/Avatar';
import { PageHero, SectionHeading } from '@/components/ui';
import { siteConfig } from '@/data/siteConfig';
import { openOnly } from '@/lib/hackathons';
import { abs, breadcrumbJsonLd, coFounderJsonLd, founderJsonLd, JsonLd, ORG_ID, pageMetadata } from '@/lib/seo';
import { getHackathons } from '@/server/hackathons';

export const metadata: Metadata = pageMetadata({
  title: `About ${siteConfig.name}: Founded by ${siteConfig.founder.name} and ${siteConfig.coFounder.name}`,
  description: `${siteConfig.name} is a free hackathon aggregator for students in India, founded by ${siteConfig.founder.name} with co-founder ${siteConfig.coFounder.name}. Our mission: no student should miss a hackathon because it was posted somewhere they didn’t look.`,
  path: '/about',
  keywords: ['about HackathonFinder', 'HackathonFinder founder', siteConfig.founder.name, siteConfig.coFounder.name, 'hackathon aggregator India'],
});

// The live counts change with every scrape.
export const dynamic = 'force-dynamic';

const PRINCIPLES = [
  { title: 'Many sources, one list', text: 'We collect discoveries from public platforms, college sites, web search and community submissions, then link each listing back to its source.' },
  { title: 'Open about verification', text: 'Complete public discoveries publish automatically and stay marked unverified until checked. Confirm details with the organizer, and report scams or wrong information so an admin can remove or correct them.' },
  { title: 'Free for students', text: 'Searching, saving, reminders, Team Finder and the community are free. Organizers can list their events for free too.' },
  { title: 'Built for India', text: 'Cities, colleges, rupee prizes, IST deadlines and offline events near you come first, with online events you can join from anywhere.' },
];

interface Person {
  id: string;
  name: string;
  role: string;
  links: { href: string; label: string; Icon: LucideIcon }[];
}

export default async function AboutPage() {
  const { items } = await getHackathons();
  const open = openOnly(items).length;
  const f = siteConfig.founder;
  const c = siteConfig.coFounder;
  const team: Person[] = [
    {
      id: 'founder',
      name: f.name,
      role: f.role,
      links: [
        { href: `mailto:${f.email}`, label: f.email, Icon: Mail },
        { href: f.linkedin, label: 'LinkedIn', Icon: Linkedin },
        { href: f.github, label: 'GitHub', Icon: Github },
        { href: f.instagram, label: `@${f.instagramHandle}`, Icon: Instagram },
      ],
    },
    {
      id: 'co-founder',
      name: c.name,
      role: c.role,
      links: [
        { href: `mailto:${c.email}`, label: c.email, Icon: Mail },
        { href: c.linkedin, label: 'LinkedIn', Icon: Linkedin },
        { href: c.github, label: 'GitHub', Icon: Github },
        { href: c.website, label: 'Website', Icon: Globe },
      ],
    },
  ];

  return (
    <>
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            url: abs('/about'),
            name: `About ${siteConfig.name}`,
            about: { '@id': ORG_ID },
            mainEntity: [founderJsonLd(), coFounderJsonLd()],
          },
          breadcrumbJsonLd([{ name: 'About', path: '/about' }]),
        ]}
      />
      <PageHero
        title="About"
        accent={siteConfig.name}
        description="No student should miss a hackathon because it was posted somewhere they didn’t look. We find them all and put them in one place."
      />

      <section className="section bg-surface">
        <div className="container-page grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-5 text-lg leading-8 text-ink/80">
            <SectionHeading title="Why we built it" />
            <p>
              Hackathons in India are scattered across Unstop, Devfolio, Devpost, MLH, college websites, Instagram posters, LinkedIn posts and WhatsApp
              forwards. Students hear about the best ones a day after registration closes, or never hear about them at all.
            </p>
            <p>
              {siteConfig.name} checks {SOURCES.length} kinds of sources twice a day, cleans up the details (dates, deadline, team size, prizes, fee and
              eligibility) and lists every event in one searchable place. You can find hackathons near you, follow your city, get deadline reminders, find
              teammates and share how you won.
            </p>
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { value: open, label: 'open right now' },
                { value: CITIES.length, label: 'cities, plus online' },
                { value: SOURCES.length, label: 'sources checked' },
              ].map((s) => (
                <div key={s.label} className="card p-4 text-center">
                  <p className="text-3xl font-bold tabular-nums text-ink">{s.value}</p>
                  <p className="mt-1 text-xs text-ink/60">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="card h-fit p-6" aria-labelledby="team-title">
            <h2 id="team-title" className="text-xs font-semibold uppercase tracking-[0.08em] text-accent">
              Team
            </h2>
            <ul className="mt-4 divide-y divide-line">
              {team.map((person) => (
                <li key={person.id} id={person.id} className="scroll-mt-24 py-5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3.5">
                    <Avatar name={person.name} size="lg" />
                    <div>
                      <h3 className="text-lg">{person.name}</h3>
                      <p className="text-sm text-muted">
                        {person.role}, {siteConfig.name}
                      </p>
                    </div>
                  </div>
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    {person.links.map(({ href, label, Icon }) => (
                      <li key={href} className="min-w-0">
                        <a
                          href={href}
                          target={href.startsWith('mailto:') ? undefined : '_blank'}
                          rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer me'}
                          className="flex min-w-0 items-center gap-2 text-sm text-ink/80 hover:text-accent"
                        >
                          <Icon className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                          <span className="truncate">{label}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-line pt-5 text-sm leading-6 text-muted">
              We started {siteConfig.name} to make every hackathon in India easy to find, for every student, in every city. Questions, partnerships or a
              hackathon we missed? Get in touch.
            </p>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <SectionHeading title="What we stand for" />
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="card p-6">
                <h3 className="text-lg font-bold">{p.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/70">{p.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/hackathons" className="btn-primary">
              Find hackathons
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/how-it-works" className="btn-secondary">
              How it works
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
