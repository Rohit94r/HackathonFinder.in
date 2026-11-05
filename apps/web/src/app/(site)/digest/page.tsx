import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, MailX, TriangleAlert } from 'lucide-react';
import NewsletterForm from '@/components/NewsletterForm';
import { PageHero } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Weekly digest',
  description: 'The best open hackathons for students, picked for your cities and themes, every Monday.',
  robots: { index: false },
};

const STATES = {
  confirmed: { icon: CheckCircle2, title: 'You’re subscribed', text: 'Your first digest arrives next Monday morning. You can unsubscribe from any email in one click.' },
  unsubscribed: { icon: MailX, title: 'You’re unsubscribed', text: 'You won’t get the weekly digest any more. Changed your mind? Sign up again below.' },
  invalid: { icon: TriangleAlert, title: 'That link didn’t work', text: 'It may be old or already used. Sign up again below and we’ll send a fresh confirmation email.' },
} as const;

export default function DigestPage({ searchParams }: { searchParams: { status?: string } }) {
  const state = STATES[searchParams.status as keyof typeof STATES];

  return (
    <>
      <PageHero title="The weekly"
        accent="digest"
        description="Every Monday: open hackathons near your cities, new events and deadlines closing soon. Free, short and easy to leave."
      />
      <section className="bg-surface py-14">
        <div className="container-page max-w-2xl">
          {state && (
            <div className="card mb-8 flex items-start gap-4 p-6">
              <state.icon className="mt-0.5 h-6 w-6 shrink-0 text-ink" />
              <div>
                <h2 className="font-sans text-xl font-bold normal-case tracking-normal">{state.title}</h2>
                <p className="mt-1 text-ink/70">{state.text}</p>
              </div>
            </div>
          )}
          <div className="card p-6 sm:p-8">
            <h2 className="font-sans text-xl font-bold normal-case tracking-normal">Get the digest</h2>
            <p className="mb-5 mt-1 text-sm text-ink/70">We’ll send one confirmation email first.</p>
            <NewsletterForm dark={false} />
          </div>
          <p className="mt-6 text-sm text-ink/60">
            Prefer to browse? <Link href="/near-me" className="font-semibold text-ink underline">See hackathons near you</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
