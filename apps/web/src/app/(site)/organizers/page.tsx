import type { Metadata } from 'next';
import { faqJsonLd, JsonLd, pageMetadata } from '@/lib/seo';
import Link from 'next/link';
import { BadgeCheck, Check, Eye, Megaphone, PenLine, Rocket, Sparkles, Target } from 'lucide-react';
import FAQ from '@/components/FAQ';
import { PageHero, SectionHeading } from '@/components/ui';
import { organizerFaqs } from '@/data/faqData';
import { siteConfig } from '@/data/siteConfig';
import { cn } from '@/lib/cn';

export const metadata: Metadata = pageMetadata({
  title: 'List Your Hackathon for Free: For Organizers',
  description: 'List your hackathon on HackathonFinder for free and reach students everywhere who are actively looking. Featured placement available.',
  path: '/organizers',
  keywords: ['promote hackathon', 'list hackathon', 'hackathon marketing', 'hackathon organizers'],
});

const BENEFITS = [
  { icon: Target, title: 'The right students', text: 'Reach students filtering for your city, theme, team size and eligibility.' },
  { icon: Eye, title: 'More visibility', text: 'Your event appears in search, city and theme pages, the calendar and our channels.' },
  { icon: BadgeCheck, title: 'Verified badge', text: 'Claim your listing to keep details correct and show students it’s official.' },
];

const STEPS = [
  { icon: PenLine, title: 'Submit', text: 'Fill in the form in about two minutes.' },
  { icon: Check, title: 'We review', text: 'Our team checks the details and the registration link.' },
  { icon: Rocket, title: 'Go live', text: 'Students find your event and register on your page.' },
];

const PLANS = [
  {
    name: 'Free listing',
    price: 'Free',
    note: 'Always',
    highlight: false,
    features: ['Listing with all event details', 'Search, city and theme pages', 'Calendar and digest eligibility', 'Link to your registration page'],
    cta: { href: '/submit?as=organizer', label: 'Submit for free' },
  },
  {
    name: 'Featured',
    price: 'Contact us',
    note: 'Per event',
    highlight: true,
    features: ['Everything in Free', 'Featured badge and top placement', 'Spot in the weekly digest', 'Shared on our social channels'],
    cta: { href: `mailto:${siteConfig.email}?subject=Featured%20listing`, label: 'Get featured' },
  },
  {
    name: 'Partner',
    price: 'Contact us',
    note: 'Colleges & communities',
    highlight: false,
    features: ['For clubs running several events', 'Verified organizer page', 'Campus ambassador support', 'Priority review for every event'],
    cta: { href: `mailto:${siteConfig.email}?subject=Partner%20plan`, label: 'Talk to us' },
  },
];

export default function OrganizersPage() {
  return (
    <>
      <JsonLd data={faqJsonLd(organizerFaqs)} />
      <PageHero title="Get your hackathon"
        accent="in front of students"
        description="Students come to HackathonFinder to decide what to join next. List your event for free and we’ll send them to your registration page."
      >
        <div className="flex flex-wrap gap-3">
          <Link href="/submit?as=organizer" className="btn-lime">
            Submit your hackathon
          </Link>
          <a href={`mailto:${siteConfig.email}`} className="btn-secondary">
            Contact us
          </a>
        </div>
      </PageHero>

      <section className="section bg-surface">
        <div className="container-page">
          <SectionHeading center eyebrow="Why list here" title="Built to fill your seats" />
          <div data-reveal-stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <div key={b.title} className="card p-6">
                <span className="mb-4 inline-flex rounded-lg bg-brand-600 p-2.5 text-white">
                  <b.icon className="h-5 w-5" />
                </span>
                <h3 className="text-lg font-bold">{b.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/70">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <SectionHeading center eyebrow="How listing works" title="Live in three steps" />
          <ol data-reveal-stagger className="grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="card p-7 text-center">
                <span className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent font-display text-lg text-white">
                  {i + 1}
                </span>
                <s.icon className="mx-auto mb-2 h-6 w-6 text-ink" />
                <h3 className="text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-ink/70">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section bg-surface">
        <div className="container-page">
          <SectionHeading center eyebrow="Plans" title="Free to list. Boost when you need it." />
          <div data-reveal-stagger className="grid gap-6 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  'relative flex flex-col rounded-lg p-8',
                  plan.highlight ? 'on-dark bg-ink text-white shadow-lift' : 'card'
                )}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-8 inline-flex items-center gap-1 rounded-md bg-lime px-3 py-1 text-xs font-bold text-navy">
                    <Sparkles className="h-3 w-3" />
                    Most reach
                  </span>
                )}
                <h3 className={cn('text-lg font-bold', plan.highlight && 'text-white')}>{plan.name}</h3>
                <p className={cn('mt-3 font-display text-4xl font-bold', plan.highlight ? 'text-lime' : 'text-ink')}>{plan.price}</p>
                <p className={cn('text-sm', plan.highlight ? 'text-surface/60' : 'text-ink/60')}>{plan.note}</p>
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className={cn('flex items-start gap-2 text-sm', plan.highlight ? 'text-surface/90' : 'text-ink/80')}>
                      <Check className={cn('mt-0.5 h-4 w-4 shrink-0', plan.highlight ? 'text-lime' : 'text-ink')} />
                      {f}
                    </li>
                  ))}
                </ul>
                <a href={plan.cta.href} className={cn('mt-8 w-full', plan.highlight ? 'btn-lime' : 'btn-secondary')}>
                  {plan.cta.label}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <SectionHeading eyebrow="FAQ" title="Questions organizers ask" />
            <div className="card flex items-start gap-3 p-5">
              <Megaphone className="h-5 w-5 shrink-0 text-ink" />
              <p className="text-sm text-ink/70">
                Want to sponsor the weekly digest or a theme page? Email{' '}
                <a className="font-semibold text-ink" href={`mailto:${siteConfig.email}`}>
                  {siteConfig.email}
                </a>
                .
              </p>
            </div>
          </div>
          <FAQ items={organizerFaqs} />
        </div>
      </section>
    </>
  );
}
