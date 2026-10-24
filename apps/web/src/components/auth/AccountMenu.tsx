'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Bell, Bookmark, LogIn, LogOut, MessagesSquare, Settings, UserPlus, UserRound, type LucideIcon } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { useUnreadMessages } from '@/components/messages/useChat';
import { NOTIFICATION_ICONS, useMarkRead, useNotificationBell, whenLabel } from '@/components/profile/notificationParts';
import { cn } from '@/lib/cn';
import { withNext } from './authUtils';

// Account controls for the inner-page navbar (components/layout/Navbar.tsx). The bar follows
// the theme, so these use the ink tokens: bg-card panels, text-ink, border-ink/10.

const DEFAULT_ICON_BTN =
  'inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 text-ink/80 transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

const PANEL = 'hf-dd-in z-50 rounded-2xl border border-ink/10 bg-card text-ink shadow-lift';

/** Closes a dropdown on a click outside, on Escape, and when the page changes. */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useEffect(() => close(), [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('click', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, close]);
  return ref;
}

const countLabel = (n: number) => (n > 99 ? '99+' : String(n));

/** Bell with the unread count; opening it shows the latest few and marks them read. */
export function NotificationBell({ className = DEFAULT_ICON_BTN }: { className?: string }) {
  const { data, mutate } = useNotificationBell();
  const markRead = useMarkRead();
  const [open, setOpen] = useState(false);
  // Ids that were unread when the menu opened, so they stay highlighted while it's open.
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [failed, setFailed] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const unread = data?.unread ?? 0;

  const toggle = async () => {
    if (open) return setOpen(false);
    setOpen(true);
    setFailed(false);
    try {
      const page = (await mutate()) ?? data;
      const ids = (page?.items ?? []).filter((n) => !n.read).map((n) => n.id);
      setFresh(new Set(ids));
      if (ids.length) await markRead(ids);
    } catch {
      setFailed(true);
    }
  };

  const items = data?.items ?? [];
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        className={cn(className, 'relative')}
        aria-expanded={open}
        aria-controls="nav-notifications"
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        title="Notifications"
      >
        <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-white">
            {countLabel(unread)}
          </span>
        )}
      </button>
      {open && (
        <div
          id="nav-notifications"
          className={cn(PANEL, 'fixed inset-x-4 top-[80px] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[360px]')}
        >
          <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            <Link href="/notifications" className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300">
              See all
            </Link>
          </div>
          {failed && <p className="px-4 py-3 text-xs text-ink/70">Couldn’t load your notifications. Try again in a moment.</p>}
          {!data && !failed ? (
            <div className="space-y-2 p-4" aria-busy="true" aria-label="Loading notifications">
              <div className="h-10 animate-pulse rounded-xl bg-ink/[0.05]" />
              <div className="h-10 animate-pulse rounded-xl bg-ink/[0.05]" />
            </div>
          ) : items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-ink/70">
              Nothing yet. Team requests, invites and deadline reminders show up here.
            </p>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto p-2">
              {items.map((n) => {
                const Icon = NOTIFICATION_ICONS[n.type] ?? Bell;
                const body = (
                  <>
                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink/5 text-ink/80">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold leading-snug">{n.title}</span>
                      {n.body && <span className="mt-0.5 line-clamp-2 block text-xs text-ink/70">{n.body}</span>}
                      <span className="mt-1 block text-[11px] text-ink/50">{whenLabel(n.createdAt)}</span>
                    </span>
                    {fresh.has(n.id) && (
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="New" role="img" />
                    )}
                  </>
                );
                const rowClass = cn('flex items-start gap-3 rounded-xl px-2.5 py-2.5', fresh.has(n.id) && 'bg-ink/[0.05]');
                return (
                  <li key={n.id}>
                    {n.href ? (
                      <Link href={n.href} onClick={() => setOpen(false)} className={cn(rowClass, 'transition hover:bg-ink/[0.05]')}>
                        {body}
                      </Link>
                    ) : (
                      <div className={rowClass}>{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

interface MenuLink {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

// The admin dashboard has no link here on purpose: admins open it by typing /admin.
function useAccountLinks(): MenuLink[] {
  const { data } = useNotificationBell();
  const { data: chats } = useUnreadMessages();
  return [
    { href: '/profile', label: 'Profile', icon: UserRound },
    { href: '/messages', label: 'Messages', icon: MessagesSquare, badge: chats?.unread },
    { href: '/saved', label: 'My hackathons', icon: Bookmark },
    { href: '/notifications', label: 'Notifications', icon: Bell, badge: data?.unread },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];
}

/** Avatar button with the account menu. */
export function AccountMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const links = useAccountLinks();
  const { data: chats } = useUnreadMessages();
  const unreadChats = chats?.unread ?? 0;
  const user = session?.user;
  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex rounded-full transition hover:ring-2 hover:ring-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-expanded={open}
        aria-controls="nav-account"
        aria-label={unreadChats ? `Your account, ${user.name}, ${unreadChats} unread messages` : `Your account, ${user.name}`}
        title="Your account"
      >
        <Avatar name={user.name || 'You'} image={user.image} size="sm" className="h-10 w-10 ring-0" />
        {unreadChats > 0 && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-surface bg-accent" aria-hidden="true" />}
      </button>
      {open && (
        <div id="nav-account" className={cn(PANEL, 'absolute right-0 top-full mt-3 w-64 p-2')}>
          <div className="flex items-center gap-3 px-2.5 pb-3 pt-2">
            <Avatar name={user.name || 'You'} image={user.image} size="md" className="ring-0" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              {user.handle && <p className="truncate text-xs text-ink/60">@{user.handle}</p>}
            </div>
          </div>
          <ul className="border-t border-ink/10 pt-2">
            {links.map(({ href, label, icon: Icon, badge }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium transition hover:bg-ink/[0.05]"
                >
                  <Icon className="h-4 w-4 text-ink/70" aria-hidden="true" />
                  <span className="flex-1">{label}</span>
                  {Boolean(badge) && (
                    <span className="rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-bold text-white">{countLabel(badge!)}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-2 border-t border-ink/10 pt-2">
            <button
              type="button"
              onClick={() => void signOut({ callbackUrl: '/' })}
              className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm font-medium transition hover:bg-ink/[0.05]"
            >
              <LogOut className="h-4 w-4 text-ink/70" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Right side of the navbar, next to Submit: bell and avatar menu when signed in, a
 * "Sign in" button when not. Holds its width while the session loads.
 */
export function NavAccount({ iconClassName = DEFAULT_ICON_BTN }: { iconClassName?: string }) {
  const { status } = useSession();
  const pathname = usePathname();
  if (status === 'loading') return <span className="hidden h-10 w-10 rounded-full bg-ink/[0.05] sm:inline-flex" aria-hidden="true" />;
  if (status === 'unauthenticated') {
    return (
      <Link
        href={withNext('/login', pathname === '/' ? null : pathname)}
        className="btn-secondary hidden h-10 whitespace-nowrap rounded-full px-4 py-0 text-sm sm:inline-flex"
      >
        <LogIn className="h-4 w-4" aria-hidden="true" />
        Sign in
      </Link>
    );
  }
  return (
    <>
      <NotificationBell className={iconClassName} />
      <span className="hidden sm:inline-flex">
        <AccountMenu />
      </span>
    </>
  );
}

/** The account part of the mobile menu sheet. */
export function MobileAccountLinks() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const links = useAccountLinks();
  if (status === 'loading') return null;

  if (!session?.user) {
    return (
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/50">Your account</p>
        <p className="mb-3 text-sm text-ink/70">Keep your saved hackathons, cities and profile on every device.</p>
        <div className="flex gap-3">
          <Link href={withNext('/login', pathname === '/' ? null : pathname)} className="btn-primary flex-1 text-sm">
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Sign in
          </Link>
          <Link href="/signup" className="btn-secondary flex-1 text-sm">
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Sign up
          </Link>
        </div>
      </div>
    );
  }

  const user = session.user;
  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <Avatar name={user.name || 'You'} image={user.image} size="md" className="ring-0" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{user.name}</p>
          {user.handle && <p className="truncate text-xs text-ink/60">@{user.handle}</p>}
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-1">
        {links.map(({ href, label, icon: Icon, badge }) => (
          <li key={href}>
            <Link
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition hover:bg-ink/[0.05]',
                pathname === href ? 'bg-accent/10 text-brand-700 dark:text-brand-300' : 'text-ink'
              )}
            >
              <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <span className="flex-1">{label}</span>
              {Boolean(badge) && <span className="rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-bold text-white">{countLabel(badge!)}</span>}
            </Link>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: '/' })}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink transition hover:bg-ink/[0.05]"
          >
            <LogOut className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            Sign out
          </button>
        </li>
      </ul>
    </div>
  );
}
