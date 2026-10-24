'use client';

import { useCallback } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { useSession } from 'next-auth/react';
import {
  Bell,
  Clock,
  Handshake,
  Mail,
  Megaphone,
  MessagesSquare,
  Reply,
  UserCheck,
  UserPlus,
  UserX,
  type LucideIcon,
} from 'lucide-react';
import { apiFetch } from '@/lib/apiClient';

export type NotificationType =
  | 'team-request'
  | 'request-accepted'
  | 'request-declined'
  | 'invite'
  | 'invite-accepted'
  | 'reply'
  | 'deadline'
  | 'listing-live'
  | 'system'
  | 'chat';

/** One item from GET /api/me/notifications. */
export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationPage {
  items: NotificationItem[];
  unread: number;
  hasMore: boolean;
}

export const NOTIFICATION_ICONS: Record<NotificationType, LucideIcon> = {
  'team-request': UserPlus,
  'request-accepted': UserCheck,
  'request-declined': UserX,
  invite: Mail,
  'invite-accepted': Handshake,
  reply: Reply,
  deadline: Clock,
  'listing-live': Megaphone,
  system: Bell,
  chat: MessagesSquare,
};

/** The bell's list: the latest few, refreshed every minute while signed in. */
export const BELL_KEY = '/api/me/notifications?limit=8';

export function useNotificationBell() {
  const { status } = useSession();
  return useSWR<NotificationPage>(status === 'authenticated' ? BELL_KEY : null, { refreshInterval: 60_000 });
}

/**
 * Marks notifications read (all of them when `ids` is left out) and updates every list
 * on the page, so the bell count and the notifications page agree.
 */
export function useMarkRead() {
  const { mutate } = useSWRConfig();
  return useCallback(
    async (ids?: string[]) => {
      if (ids && !ids.length) return;
      const res = await apiFetch<{ updated: number; unread: number }>('/api/me/notifications/read', { body: ids ? { ids } : {} });
      const done = ids ? new Set(ids) : null;
      await mutate(
        (key) => typeof key === 'string' && key.startsWith('/api/me/notifications'),
        (page: NotificationPage | undefined) =>
          page && {
            ...page,
            unread: res.unread,
            items: page.items.map((n) => (!done || done.has(n.id) ? { ...n, read: true } : n)),
          },
        { revalidate: false }
      );
      return res.unread;
    },
    [mutate]
  );
}

/** "5 min ago", "3 days ago", then a date for anything older than a month. */
export function whenLabel(iso: string, now = Date.now()): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return '';
  const mins = Math.max(0, Math.round((now - ms) / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  return new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
}
