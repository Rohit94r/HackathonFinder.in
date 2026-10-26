import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import CalendarView from '@/components/calendar/CalendarView';
import { PageHero } from '@/components/ui';
import { getHackathons } from '@/server/hackathons';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = pageMetadata({
  title: 'Hackathon Calendar 2026: Dates & Registration Deadlines',
  description: 'Every hackathon start date and registration deadline in India for the month, in one calendar. Never miss a deadline again.',
  path: '/calendar',
  keywords: ['hackathon calendar', 'hackathon calendar 2026', 'hackathon deadlines', 'hackathon dates India'],
});

export default async function CalendarPage() {
  const { items, nowIso } = await getHackathons();
  return (
    <>
      <PageHero
        title="Plan your"
        accent="hackathon month"
        description="Every start date and registration deadline in one place. Click an event to see details and register."
      />
      <section className="bg-surface py-10">
        <div className="container-page">
          <CalendarView items={items} nowIso={nowIso} />
        </div>
      </section>
    </>
  );
}
