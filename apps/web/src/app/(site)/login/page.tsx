import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { BellRing, Bookmark, Trophy, Users } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';
import LoginForm from '@/components/auth/LoginForm';
import { safeNext } from '@/components/auth/authUtils';
import { getSessionUser } from '@/server/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to HackathonFinder to keep your saved hackathons, city shortlist and profile on every device.',
  robots: { index: false, follow: false },
};

type Search = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;

export default async function LoginPage(props: { searchParams: Promise<Search> }) {
  const searchParams = await props.searchParams;
  // next-auth's own redirects use ?callbackUrl=; our links use ?next=.
  const next = safeNext(searchParams.next) ?? safeNext(searchParams.callbackUrl);
  if (await getSessionUser()) redirect(next ?? '/profile');
  const notice = one(searchParams.reason) === 'details-limit' ? 'details-limit' : one(searchParams.deleted) === '1' ? 'deleted' : one(searchParams.reset) === '1' ? 'reset' : null;

  return (
    <AuthShell
      title="Welcome"
      accent="back"
      description="Pick up where you left off: your tracker, your cities and your team."
      perks={[
        { icon: Bookmark, text: 'Your saved hackathons, on every device' },
        { icon: BellRing, text: 'Reminders before registration closes' },
        { icon: Users, text: 'Team requests and invites from students everywhere' },
        { icon: Trophy, text: 'Your hackathon record, badges and winning stories' },
      ]}
    >
      <LoginForm next={next} error={one(searchParams.error)} notice={notice} />
    </AuthShell>
  );
}
