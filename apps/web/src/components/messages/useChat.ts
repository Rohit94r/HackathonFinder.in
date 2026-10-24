'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import type { ConversationList, ConversationPage } from './model';

export const CONVERSATIONS_KEY = '/api/messages';
export const UNREAD_KEY = '/api/me/unread';
export const conversationKey = (id: string) => `/api/messages/${id}`;

/** True while the tab is in front, so polling can slow down in the background. */
export function usePageVisible(): boolean {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === 'visible');
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  return visible;
}

/** Unread chat messages for the account menu badge. */
export function useUnreadMessages() {
  const { status } = useSession();
  const visible = usePageVisible();
  return useSWR<{ unread: number }>(status === 'authenticated' ? UNREAD_KEY : null, {
    refreshInterval: visible ? 30_000 : 120_000,
    refreshWhenHidden: true,
  });
}

/** The student's chats. `fast` polls more often, for the messages page itself. */
export function useConversations({ fallback, fast = false }: { fallback?: ConversationList; fast?: boolean } = {}) {
  const { status } = useSession();
  const visible = usePageVisible();
  return useSWR<ConversationList>(status === 'authenticated' ? CONVERSATIONS_KEY : null, {
    fallbackData: fallback,
    refreshInterval: fast ? (visible ? 8_000 : 30_000) : 0,
    refreshWhenHidden: fast,
    revalidateOnMount: true,
  });
}

/** One open chat: polled every few seconds while the tab is in front, slower behind. */
export function useConversation(id: string, fallback?: ConversationPage) {
  const visible = usePageVisible();
  return useSWR<ConversationPage>(conversationKey(id), {
    fallbackData: fallback,
    refreshInterval: visible ? 4_000 : 20_000,
    refreshWhenHidden: true,
    revalidateOnFocus: true,
    revalidateOnMount: true,
    dedupingInterval: 1_500,
  });
}
