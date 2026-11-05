import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MessagesSquare } from 'lucide-react';
import SignInPrompt from '@/components/auth/SignInPrompt';
import MessagesFrame from '@/components/messages/MessagesFrame';
import MessagesView from '@/components/messages/MessagesView';
import type { ConversationPage } from '@/components/messages/model';
import { ApiError } from '@/server/api';
import { getSessionUser } from '@/server/auth';
import { getConversationPage, inboxForPage } from '@/server/chat';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Messages',
  description: 'Your private chats with teammates on HackathonFinder.',
  robots: { index: false, follow: false },
};

export default async function ConversationPageRoute(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (!/^[a-f0-9]{24}$/i.test(params.id)) notFound();
  const user = await getSessionUser();
  if (!user) {
    return (
      <section className="bg-surface py-10 sm:py-16">
        <div className="container-page">
          <SignInPrompt
            next={`/messages/${params.id}`}
            icon={MessagesSquare}
            title="Your messages"
            text="Sign in to read and reply to this chat."
          />
        </div>
      </section>
    );
  }

  // Only the two members can open a chat; anyone else gets the not-found page.
  const inbox = await inboxForPage(user.id);
  let page: ConversationPage | undefined;
  try {
    page = inbox ? await getConversationPage(user.id, params.id) : undefined;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <MessagesFrame>
      <MessagesView activeId={params.id} initialList={inbox} initialPage={page} />
    </MessagesFrame>
  );
}
