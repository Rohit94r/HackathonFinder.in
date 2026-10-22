import type { Metadata } from 'next';
import { Bell } from 'lucide-react';
import SignInPrompt from '@/components/auth/SignInPrompt';
import NotificationsList from '@/components/profile/NotificationsList';
import { getSessionUser } from '@/server/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Notifications',
  description: 'Team requests, invites, replies and deadline reminders.',
  robots: { index: false, follow: false },
};

export default async function NotificationsPage() {
  const user = await getSessionUser();
  return (
    <section className="bg-surface py-8 sm:py-12">
      <div className="container-page max-w-3xl">
        {user ? (
          <NotificationsList />
        ) : (
          <SignInPrompt
            next="/notifications"
            icon={Bell}
            title="Your notifications"
            text="Sign in to see team requests, invites, replies to your discussions and reminders before deadlines close."
          />
        )}
      </div>
    </section>
  );
}
