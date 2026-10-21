import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Award, BookOpen, Megaphone, MessageCircle, Send, Trophy, Users } from 'lucide-react';
import NewsletterForm from '@/components/NewsletterForm';
import { PageHero, SectionHeading } from '@/components/ui';
import { siteConfig } from '@/data/siteConfig';

export const metadata: Metadata = {
  title: 'Community',
  description: 'Join the HackathonFinder community: channels, Team Finder, campus ambassadors, guides and the weekly digest.',
};

const CHANNELS = [
  { name: 'Telegram channel', text: 'New hackathons the moment we find them.', href: siteConfig.social.telegram, icon: Send },
  { name: 'WhatsApp community', text: 'City groups for Pune and more, plus deadline nudges.', href: siteConfig.social.whatsapp, icon: MessageCircle },
  { name: 'Instagram', text: 'Weekly roundups, winner stories and quick tips.', href: siteConfig.social.instagram, icon: Megaphone },
  { name: 'Discord', text: 'Find teammates, ask questions and share what you build.', href: siteConfig.social.discord, icon: Users },
];

const WAYS = [
  {
    icon: Users,
    title: 'Team Finder',
    text: 'Post the skills you have and need, and team up for your next hackathon.',
    href: '/teams',
    cta: 'Find teammates',
  },
  {
    icon: BookOpen,
    title: 'Guides & blog',
    text: 'Practical guides on picking events, building fast and pitching well.',
    href: '/blog',
    cta: 'Read the blog',
  },
  {
    icon: Megaphone,
    title: 'Share a hackathon',
    text: 'Spotted an event on Instagram or a college notice board? Add it for everyone.',
    href: '/submit',
    cta: 'Submit an event',
  },
];

const AMBASSADOR_PERKS = [
  'Get new hackathons for your college before anyone else',
  'Certificate and LinkedIn recommendation',
  'Goodies, and a say in what we build next',
  'Run hackathon prep sessions with our help',
];

export default function CommunityPage() {
  return (
    <>
      <PageHero
        title="Build with people"
        accent="who love building"
        description="Hackathons are better together. Join our channels, find teammates, learn from guides and help other students discover events."
      />

      <section className="section bg-surface">
        <div className="container-page">
          <SectionHeading eyebrow="Join a channel" title="Never miss a new hackathon" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {CHANNELS.map((c) => (
              <a key={c.name} href={c.href} className="card group flex flex-col p-6 transition hover:-translate-y-1 hover:shadow-lift">
                <span className="mb-4 inline-flex w-fit rounded-xl bg-ink p-2.5 text-white">
                  <c.icon className="h-5 w-5" />
                </span>
                <h3 className="text-lg font-bold">{c.name}</h3>
                <p className="mt-1 flex-1 text-sm text-ink/70">{c.text}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ink">
                  Join
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </a>
            ))}
          </div>
          <p className="mt-4 text-xs text-ink/60">Channel links go live at launch.</p>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <SectionHeading eyebrow="Get involved" title="Ways to take part" />
          <div className="grid gap-5 md:grid-cols-3">
            {WAYS.map((w) => (
              <Link key={w.title} href={w.href} className="card group p-7 transition hover:-translate-y-1 hover:shadow-lift">
                <span className="mb-4 inline-flex rounded-xl bg-ink p-2.5 text-white">
                  <w.icon className="h-5 w-5" />
                </span>
                <h3 className="text-xl font-bold">{w.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/70">{w.text}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-ink">
                  {w.cta}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-surface">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="eyebrow mb-4">
              <Award className="h-3.5 w-3.5" />
              Campus Ambassadors
            </span>
            <h2 className="text-3xl font-bold sm:text-4xl">Bring HackathonFinder to your college</h2>
            <p className="mt-4 text-lg leading-8 text-ink/70">
              Help your classmates find the right hackathons, share events from your college clubs
              and grow a hacker community on your campus.
            </p>
            <ul className="mt-6 space-y-3">
              {AMBASSADOR_PERKS.map((perk) => (
                <li key={perk} className="flex items-start gap-3 text-ink/80">
                  <Trophy className="mt-0.5 h-5 w-5 shrink-0 text-ink" />
                  {perk}
                </li>
              ))}
            </ul>
            <a
              href={`mailto:${siteConfig.email}?subject=Campus%20Ambassador%20application`}
              className="btn-primary mt-8"
            >
              Apply to be an ambassador
            </a>
          </div>
          <div className="relative overflow-hidden rounded-3xl bg-ink p-10 text-white">
            <div className="hidden" aria-hidden="true" />
            <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-ink/50 blur-3xl" aria-hidden="true" />
            <div className="relative">
              <p className="font-display text-6xl font-bold text-lime">1 college</p>
              <p className="mt-2 text-xl font-semibold">is all it takes to start.</p>
              <p className="mt-4 text-surface/80">
                Ambassadors share new events in their college groups, run a prep session each
                semester and tell us what students need.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <div className="card flex flex-col gap-6 p-8 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold">The weekly digest</h2>
              <p className="mt-2 text-ink/70">Every Monday: the best open hackathons for students, in one short email.</p>
            </div>
            <NewsletterForm dark={false} />
          </div>
        </div>
      </section>
    </>
  );
}
