import type { Metadata } from 'next';
import { UserRound } from 'lucide-react';
import SignInPrompt from '@/components/auth/SignInPrompt';
import { safeNext } from '@/components/auth/authUtils';
import MyProfileView from '@/components/profile/MyProfileView';
import { getSessionUser } from '@/server/auth';
import { getHackathons } from '@/server/hackathons';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'My profile',
  description: 'Your hackathon profile: activity heatmap, badges, results, tracked hackathons and winning stories.',
  robots: { index: false, follow: false },
};

type Search = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ProfilePage(props: { searchParams: Promise<Search> }) {
  const searchParams = await props.searchParams;
  const user = await getSessionUser();
  if (!user) {
    return (
      <section className="bg-surface py-10 sm:py-16">
        <div className="container-page">
          <SignInPrompt
            next="/profile"
            icon={UserRound}
            title="Your hackathon profile"
            text="Like a LeetCode profile, but for hackathons: an activity heatmap, badges, your results and your winning stories. Sign in to see yours."
          />
        </div>
      </section>
    );
  }

  // Titles for the tracker list, and suggestions when adding a hackathon to the record.
  const events = (await getHackathons()).items.map((h) => ({ slug: h.slug, title: h.title }));
  const verified = one(searchParams.verified);

  return (
    <section className="bg-surface py-8 sm:py-12">
      <div className="container-page">
        <MyProfileView
          events={events}
          welcome={one(searchParams.welcome) === '1'}
          verified={verified === '1' ? 'ok' : verified === 'expired' ? 'expired' : null}
          edit={one(searchParams.edit) === '1'}
          next={safeNext(searchParams.next)}
        />
      </div>
    </section>
  );
}
