import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import SubmitForm from '@/components/submit/SubmitForm';
import { PageHero } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Submit a hackathon',
  description: 'Add a hackathon to HackathonFinder for free. Organizers and students can both submit events.',
};

const POINTS = [
  'Free for every organizer',
  'Reviewed by our team before it goes live',
  'Students register on your official page',
  'Seen on Instagram or a notice board? Students can submit too',
];

export default function SubmitPage() {
  return (
    <>
      <PageHero
        title="Add a hackathon"
        accent="in two minutes"
        description="Running a hackathon, or spotted one we don’t have? Share it and help thousands of students find it."
      />
      <section className="bg-surface py-12">
        <div className="container-page grid gap-8 lg:grid-cols-[1fr_320px]">
          <SubmitForm />
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
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
            <div className="rounded-2xl bg-ink/5 p-6">
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
