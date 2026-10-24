'use client';

import Link from 'next/link';
import { Ban } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { cn } from '@/lib/cn';
import { inboxTime, type ConversationSummary } from './model';

/** The inbox: one row per chat, latest first. */
export default function ConversationList({
  items,
  activeId,
  now,
}: {
  items: ConversationSummary[];
  activeId?: string;
  now: string;
}) {
  return (
    <ul className="divide-y divide-ink/10" aria-label="Your chats">
      {items.map((c) => {
        const active = c.id === activeId;
        const preview = c.lastMessage ? `${c.lastMessage.mine ? 'You: ' : ''}${c.lastMessage.body}` : 'New chat. Say hi!';
        return (
          <li key={c.id}>
            <Link
              href={`/messages/${c.id}`}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 px-4 py-3.5 transition',
                active ? 'bg-accent/10' : 'hover:bg-ink/[0.04]'
              )}
            >
              <Avatar name={c.other.name} image={c.other.image} size="md" className="ring-0" />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className={cn('truncate text-sm text-ink', c.unread ? 'font-bold' : 'font-semibold')}>{c.other.name}</span>
                  <span className={cn('shrink-0 text-[11px]', c.unread ? 'font-semibold text-accent' : 'text-ink/50')}>
                    {inboxTime(c.lastMessageAt, now)}
                  </span>
                </span>
                <span className="mt-0.5 flex items-center justify-between gap-2">
                  <span className={cn('truncate text-xs', c.unread ? 'font-medium text-ink' : 'text-ink/60')}>
                    {c.blocked ? (
                      <span className="inline-flex items-center gap-1">
                        <Ban className="h-3 w-3" aria-hidden="true" />
                        {c.blockedByMe ? 'You blocked this chat' : 'Chat closed'}
                      </span>
                    ) : (
                      preview
                    )}
                  </span>
                  {c.unread > 0 && (
                    <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-white">
                      {c.unread > 99 ? '99+' : c.unread}
                      <span className="sr-only"> unread</span>
                    </span>
                  )}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
