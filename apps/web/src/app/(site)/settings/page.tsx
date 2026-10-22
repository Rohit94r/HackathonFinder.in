import type { Metadata } from 'next';
import { Settings } from 'lucide-react';
import SignInPrompt from '@/components/auth/SignInPrompt';
import SettingsView from '@/components/profile/SettingsView';
import { getSessionUser } from '@/server/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Your HackathonFinder account: password, sign-in methods and email preferences.',
  robots: { index: false, follow: false },
};

export default async function SettingsPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getSessionUser();
  const connected = Array.isArray(searchParams.connected) ? searchParams.connected[0] : searchParams.connected;
  return (
    <section className="bg-surface py-8 sm:py-12">
      <div className="container-page max-w-3xl">
        {user ? (
          <SettingsView connected={connected === 'google' || connected === 'github' ? connected : null} />
        ) : (
          <SignInPrompt
            next="/settings"
            icon={Settings}
            title="Account settings"
            text="Sign in to change your password, connect Google or GitHub, and choose which emails you get."
          />
        )}
      </div>
    </section>
  );
}
