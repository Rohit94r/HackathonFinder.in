'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { Bell, BellOff, CheckCheck, Loader2 } from 'lucide-react';
import { ApiClientError, apiFetch } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { NOTIFICATION_ICONS, useMarkRead, whenLabel, type NotificationItem, type NotificationPage } from './notificationParts';

const PAGE = 20;

/** Every notification, newest first, with an unread filter and "Load more". */
export default function NotificationsList() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const key = `/api/me/notifications?limit=${PAGE}${unreadOnly ? '&unread=1' : ''}`;
  const { data, error, isLoading, mutate } = useSWR<NotificationPage>(key);
  const markRead = useMarkRead();
  // Older pages, loaded on demand for the current filter.
  const [older, setOlder] = useState<{ key: string; items: NotificationItem[]; hasMore: boolean } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const extra = older?.key === key ? older : null;
  const items = [...(data?.items ?? []), ...(extra?.items ?? [])];
  const hasMore = extra ? extra.hasMore : Boolean(data?.hasMore);
  const unread = data?.unread ?? 0;

  const loadMore = async () => {
    const last = items[items.length - 1];
    if (!last) return;
    setLoadingMore(true);
    setActionError(null);
    try {
      const page = await apiFetch<NotificationPage>(`${key}&before=${encodeURIComponent(last.createdAt)}`);
      setOlder({ key, items: [...(extra?.items ?? []), ...page.items], hasMore: page.hasMore });
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'Couldn’t load more. Try again.');
    } finally {
      setLoadingMore(false);
    }
  };

  const read = async (ids?: string[]) => {
    setActionError(null);
    try {
      await markRead(ids);
      if (extra) setOlder({ ...extra, items: extra.items.map((n) => (!ids || ids.includes(n.id) ? { ...n, read: true } : n)) });
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'Couldn’t mark that as read. Try again.');
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl">Notifications</h1>
          <p className="mt-2 text-sm text-ink/70" aria-live="polite">
            {data ? (unread ? `${unread} unread` : 'You’re all caught up.') : ' '}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-md border border-ink/15 p-1" role="group" aria-label="Show">
            {[
              { value: false, label: 'All' },
              { value: true, label: 'Unread' },
            ].map((tab) => (
              <button
                key={tab.label}
                type="button"
                aria-pressed={unreadOnly === tab.value}
                onClick={() => setUnreadOnly(tab.value)}
                className={cn(
                  'rounded-md px-4 py-1.5 text-sm font-semibold transition',
                  unreadOnly === tab.value ? 'bg-ink text-surface' : 'text-ink/70 hover:text-ink'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {unread > 0 && (
            <button type="button" onClick={() => void read()} className="btn-secondary px-4 py-2 text-sm">
              <CheckCheck className="h-4 w-4" aria-hidden="true" />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <p role="alert" className="mt-4 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800 dark:border-brand-400/25 dark:bg-brand-500/10 dark:text-brand-100">
          {actionError}
        </p>
      )}

      <div className="card mt-6 overflow-hidden">
        {isLoading && !data ? (
          <div className="space-y-3 p-5" aria-busy="true" aria-label="Loading notifications">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-ink/5" />
            ))}
          </div>
        ) : error && !data ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <p className="text-sm text-ink/70">{error instanceof ApiClientError ? error.message : 'Couldn’t load your notifications.'}</p>
            <button type="button" onClick={() => void mutate()} className="btn-secondary mt-4 px-4 py-2 text-sm">
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <span className="mb-4 rounded-lg bg-ink/5 p-4 text-ink/70">
              {unreadOnly ? <CheckCheck className="h-7 w-7" aria-hidden="true" /> : <BellOff className="h-7 w-7" aria-hidden="true" />}
            </span>
            <h2 className="text-xl">{unreadOnly ? 'No unread notifications' : 'Nothing here yet'}</h2>
            <p className="mt-2 max-w-sm text-sm text-ink/70">
              {unreadOnly
                ? 'You’ve seen everything. Nice.'
                : 'Team requests, invites, replies to your discussions and deadline reminders will show up here.'}
            </p>
            {!unreadOnly && (
              <Link href="/teams" className="btn-primary mt-6">
                Find a team
              </Link>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-ink/10">
            {items.map((n) => {
              const Icon = NOTIFICATION_ICONS[n.type] ?? Bell;
              return (
                <li key={n.id} className={cn('flex items-start gap-3 px-4 py-4 sm:px-5', !n.read && 'bg-accent/[0.04]')}>
                  <span
                    className={cn(
                      'mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                      n.read ? 'bg-ink/5 text-ink/70' : 'bg-accent text-white'
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm leading-snug text-ink', !n.read && 'font-semibold')}>
                      {n.href ? (
                        <Link href={n.href} onClick={() => !n.read && void read([n.id])} className="hover:underline">
                          {n.title}
                        </Link>
                      ) : (
                        n.title
                      )}
                      {!n.read && <span className="sr-only"> (unread)</span>}
                    </p>
                    {n.body && <p className="mt-1 text-sm text-ink/70">{n.body}</p>}
                    <p className="mt-1.5 text-xs text-ink/60">{whenLabel(n.createdAt)}</p>
                  </div>
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => void read([n.id])}
                      className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-ink/60 hover:bg-ink/5 hover:text-ink"
                    >
                      Mark read
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button type="button" onClick={() => void loadMore()} disabled={loadingMore} className="btn-secondary">
            {loadingMore && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {loadingMore ? 'Loading…' : 'Load older'}
          </button>
        </div>
      )}
    </div>
  );
}
