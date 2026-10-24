'use client';

import Link from 'next/link';
import { MessagesSquare, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import ChatPhoto from './ChatPhoto';
import ConversationList from './ConversationList';
import ConversationPane from './ConversationPane';
import type { ConversationList as ConversationListData, ConversationPage } from './model';
import { useConversations } from './useChat';

/**
 * The messages page: the inbox on the left and the open chat on the right. On phones
 * only one shows at a time: the inbox at /messages, the chat at /messages/[id].
 */
export default function MessagesView({
  activeId,
  initialList,
  initialPage,
}: {
  activeId?: string;
  initialList?: ConversationListData;
  initialPage?: ConversationPage;
}) {
  const { data, error } = useConversations({ fallback: initialList, fast: true });
  const items = data?.items ?? [];
  const now = data?.now ?? new Date().toISOString();
  const unread = data?.unread ?? 0;
  const empty = Boolean(data) && items.length === 0;

  const noChats = (
    <ChatPhoto
      title="No chats yet"
      text="Chats open when a student accepts your team invite, or you accept their request to join your team. Find teammates and start one."
    >
      <Link href="/teams" className="btn-primary py-2.5 text-sm">
        <Users className="h-4 w-4" aria-hidden="true" />
        Find teammates
      </Link>
    </ChatPhoto>
  );

  return (
    <div className="card grid h-[calc(100dvh-11rem)] min-h-[520px] grid-cols-1 overflow-hidden lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside className={cn('min-h-0 flex-col border-ink/10 lg:flex lg:border-r', activeId ? 'hidden' : 'flex')} aria-label="Chats">
        <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-4 py-3.5">
          <h2 className="flex items-center gap-2 font-sans text-base font-bold normal-case tracking-normal">
            <MessagesSquare className="h-5 w-5" aria-hidden="true" />
            Chats
          </h2>
          {unread > 0 && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-white">
              {unread > 99 ? '99+' : unread} unread
            </span>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {!data && !error ? (
            <div className="space-y-1 p-2" aria-busy="true" aria-label="Loading your chats">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 px-2 py-3">
                  <div className="h-11 w-11 animate-pulse rounded-full bg-ink/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-1/2 animate-pulse rounded bg-ink/10" />
                    <div className="h-3 w-3/4 animate-pulse rounded bg-ink/[0.06]" />
                  </div>
                </div>
              ))}
            </div>
          ) : error && !data ? (
            <p className="p-5 text-sm text-ink/70">We couldn’t load your chats. Check your connection and refresh the page.</p>
          ) : empty ? (
            <>
              <div className="h-full lg:hidden">{noChats}</div>
              <p className="hidden p-5 text-sm text-ink/60 lg:block">No chats yet.</p>
            </>
          ) : (
            <ConversationList items={items} activeId={activeId} now={now} />
          )}
        </div>
      </aside>

      <section className={cn('min-h-0 min-w-0 flex-col', activeId ? 'flex' : 'hidden lg:flex')} aria-label="Chat">
        {activeId ? (
          <ConversationPane key={activeId} id={activeId} initial={initialPage} />
        ) : empty ? (
          noChats
        ) : (
          <ChatPhoto title="Pick a chat" text="Choose someone on the left to read and reply. Plan your idea, split the work and pick a hackathon together." />
        )}
      </section>
    </div>
  );
}
