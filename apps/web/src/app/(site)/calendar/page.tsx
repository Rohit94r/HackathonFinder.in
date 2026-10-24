import type { Metadata } from 'next';
import CalendarView from '@/components/calendar/CalendarView';
import { PageHero } from '@/components/ui';
import { getHackathons } from '@/server/hackathons';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Hackathon calendar',
  description: 'See every hackathon start date and registration deadline for the month in one calendar.',
};

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
