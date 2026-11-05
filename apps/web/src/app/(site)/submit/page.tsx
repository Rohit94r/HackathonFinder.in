import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import MySubmissions from '@/components/submit/MySubmissions';
import SubmitChooser from '@/components/submit/SubmitChooser';
import { PageHero } from '@/components/ui';

export const metadata: Metadata = pageMetadata({
  title: 'Submit a Hackathon',
  description: 'Add a hackathon to HackathonFinder for free. Spotted one on Instagram, WhatsApp, Facebook or LinkedIn? Paste the link. Organizers can add full details.',
  path: '/submit',
});

const POINTS = [
  'Free for every organizer and student',
  'Spotted on Instagram, WhatsApp, Facebook or LinkedIn? Just paste the link or poster',
  'Reviewed by our team before it goes live, and we tell you when it is',
  'Students register on the official page',
];

export default function SubmitPage({ searchParams }: { searchParams: { as?: string } }) {
  return (
    <>
      <PageHero title="Add a hackathon"
        accent="in 30 seconds"
        description="Spotted one we don’t have, or running one yourself? Share it and help students near you find it."
      />
      <section className="bg-surface py-12">
        <div className="container-page grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            <SubmitChooser initial={searchParams.as === 'organizer' ? 'organizer' : 'student'} />
          </div>
          <aside className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
            <MySubmissions />
            <div className="card p-6">
              <h2 className="text-lg font-bold">Good to know</h2>
              <ul className="mt-4 space-y-3">
                {POINTS.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-ink/80">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg bg-ink/5 p-6">
              <h2 className="text-lg font-bold">Want more reach?</h2>
              <p className="mt-2 text-sm text-ink/70">Featured listings get top placement and a spot in our weekly digest.</p>
              <Link href="/organizers" className="mt-4 inline-block text-sm font-semibold text-ink">
                See organizer plans →
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
