import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  Merge,
  PenLine,
  Radar,
  Rocket,
  ScanText,
  ShieldCheck,
  Tags,
  type LucideIcon,
} from 'lucide-react';
import { AGENTS, SOURCES, SOURCE_KIND_LABELS, STATUS_LABELS, type SourceKind, type Status } from '@hackathonfinder/shared';
import StatusBadge from '@/components/hackathon/StatusBadge';
import { PageHero, SectionHeading } from '@/components/ui';

export const metadata: Metadata = {
  title: 'How it works',
  description: 'How HackathonFinder finds hackathons across the internet, cleans up the details and keeps listings accurate.',
};

const AGENT_ICONS: Record<string, LucideIcon> = {
  scout: Radar,
  extractor: ScanText,
  deduper: Merge,
  verifier: ShieldCheck,
  tagger: Tags,
  writer: PenLine,
  publisher: Rocket,
  alerts: BellRing,
};

const STATUS_RULES: { status: Status; when: string }[] = [
  { status: 'open', when: 'Registration is open.' },
  { status: 'closing-soon', when: 'The deadline is within 3 days.' },
  { status: 'registration-closed', when: 'The deadline has passed, but the event hasn’t started.' },
  { status: 'in-progress', when: 'The event is happening now.' },
  { status: 'completed', when: 'The event has ended.' },
];

const RULES = [
  'We follow each website’s terms and use official APIs and feeds wherever they exist.',
  'We only collect event information that organizers share publicly.',
  'Instagram and LinkedIn events come from organizer and student submissions, partners, our browser extension and official APIs, not from scraping accounts.',
  'We always link back to the official page for registration.',
  'We write our own short summaries and never copy full descriptions or posters without permission.',
  'Organizers can claim, edit or remove their listing at any time.',
];

const KIND_ORDER: SourceKind[] = ['platform', 'search', 'social', 'events', 'college', 'community', 'people'];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        title="We do the searching"
        accent="you do the building"
        description="A team of AI agents checks the internet for hackathons, turns each one into a clear listing and keeps it up to date."
      />

      <section className="section bg-surface">
        <div className="container-page">
          <SectionHeading eyebrow="The pipeline" title="Eight agents, one listing" description="Every event goes through the same steps before you see it." />
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {AGENTS.map((agent, i) => {
              const Icon = AGENT_ICONS[agent.id] ?? Radar;
              return (
                <li key={agent.id} className="card relative p-6">
                  <span className="absolute right-5 top-5 font-display text-sm font-bold text-surface/80">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="mb-4 inline-flex rounded-xl bg-ink p-2.5 text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-lg font-bold">{agent.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/70">{agent.job}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <SectionHeading eyebrow="Sources" title="Where we look" description="From big hackathon platforms to a poster on a college Instagram page." />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {KIND_ORDER.map((kind) => {
              const list = SOURCES.filter((s) => s.kind === kind);
              if (!list.length) return null;
              return (
                <div key={kind} className="card p-6">
                  <h3 className="text-base font-bold">{SOURCE_KIND_LABELS[kind]}</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {list.map((s) => (
                      <span key={s.slug} className="rounded-lg bg-ink/5 px-2.5 py-1 text-sm font-medium text-ink/80">
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
            <div className="rounded-2xl border-2 border-ink bg-white p-6">
              <h3 className="text-base font-bold">Browser extension</h3>
              <p className="mt-2 text-sm text-ink/70">
                See a hackathon on Instagram, LinkedIn or any site? One click on “Add to
                HackathonFinder” turns it into a listing. Coming soon.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-surface">
        <div className="container-page grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Status" title="Always up to date" description="Each listing’s status updates on its own, based on its dates." />
            <ul className="card divide-y divide-ink/10">
              {STATUS_RULES.map((r) => (
                <li key={r.status} className="flex items-center justify-between gap-4 px-5 py-4">
                  <StatusBadge status={r.status} />
                  <span className="text-right text-sm text-ink/70">{r.when}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink/60">
              {STATUS_LABELS['closing-soon']} is marked with a flame icon so you never miss a deadline.
            </p>
          </div>
          <div>
            <SectionHeading eyebrow="Data rules" title="Honest, fair and linked to the source" />
            <ul className="space-y-3">
              {RULES.map((rule) => (
                <li key={rule} className="card flex items-start gap-3 p-4 text-sm text-ink/80">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-ink" />
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <div className="flex flex-col items-center rounded-3xl bg-ink px-6 py-14 text-center">
            <h2 className="text-3xl font-bold text-white">See it in action</h2>
            <p className="mt-3 max-w-lg text-surface/80">Search open hackathons by city, theme, deadline and team size.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/hackathons" className="btn-lime">
                Explore hackathons
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/submit" className="btn-ghost-dark">
                Submit a hackathon
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
