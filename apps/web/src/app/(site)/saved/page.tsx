import type { Metadata } from 'next';
import SavedList from '@/components/saved/SavedList';
import { PageHero } from '@/components/ui';
import { getHackathons } from '@/server/hackathons';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'My hackathons',
  description: 'Track the hackathons you saved, registered for and submitted to.',
  robots: { index: false, follow: false },
};

export default async function SavedPage() {
  const { items } = await getHackathons();
  return (
    <>
      <PageHero title="Your hackathon"
        accent="tracker"
        description="Everything you saved, in one board. Move each event from saved to registered, submitted and done. Your list is stored in this browser."
      />
      <section className="bg-surface py-10">
        <div className="container-page">
          <SavedList items={items} />
        </div>
      </section>
    </>
  );
}
