import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { BadgeCheck, BellRing, CalendarDays, Users } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';
import SignupForm from '@/components/auth/SignupForm';
import { safeNext } from '@/components/auth/authUtils';
import { getSessionUser } from '@/server/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Create your account',
  description: 'A free HackathonFinder account: save hackathons, follow cities, find a team and build your hackathon profile.',
  robots: { index: false, follow: false },
};

export default async function SignupPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const next = safeNext(searchParams.next) ?? safeNext(searchParams.callbackUrl);
  if (await getSessionUser()) redirect(next ?? '/profile');

  return (
    <AuthShell
      title="Join the"
      accent="builders"
      description="Free for students. Takes a minute. Find hackathons near you, team up and keep a record of everything you ship."
      sticker={{ text: 'Free', tone: 'yellow' }}
      perks={[
        { icon: BellRing, text: 'Deadline reminders for the hackathons you save' },
        { icon: Users, text: 'Team Finder: invite and join students across India' },
        { icon: CalendarDays, text: 'A LeetCode-style profile with an activity heatmap' },
        { icon: BadgeCheck, text: 'Badges for your first save, your first submission, your first win' },
      ]}
    >
      <SignupForm next={next} />
    </AuthShell>
  );
}
