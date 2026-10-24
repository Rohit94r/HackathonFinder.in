import type { Metadata } from 'next';
import { MessagesSquare } from 'lucide-react';
import SignInPrompt from '@/components/auth/SignInPrompt';
import MessagesFrame from '@/components/messages/MessagesFrame';
import MessagesView from '@/components/messages/MessagesView';
import { getSessionUser } from '@/server/auth';
import { inboxForPage } from '@/server/chat';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Messages',
  description: 'Chats with students who joined your team or accepted your invite.',
  robots: { index: false, follow: false },
};

export default async function MessagesPage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <section className="bg-surface py-10 sm:py-16">
        <div className="container-page">
          <SignInPrompt
            next="/messages"
            icon={MessagesSquare}
            title="Your messages"
            text="Sign in to chat with students who accepted your team invite or joined your team."
          />
        </div>
      </section>
    );
  }
  return (
    <MessagesFrame>
      <MessagesView initialList={await inboxForPage(user.id)} />
    </MessagesFrame>
  );
}
