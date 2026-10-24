'use client';

import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSWRConfig } from 'swr';
import { AlertCircle, ArrowLeft, Ban, Check, CheckCheck, Loader2, MoreVertical, RotateCcw, Send, ShieldCheck, UserRound, X } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { ApiClientError, apiFetch } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import ChatPhoto from './ChatPhoto';
import { MESSAGE_MAX, dayKey, dayLabel, messageTime, type ChatMessage, type ConversationList, type ConversationPage } from './model';
import { CONVERSATIONS_KEY, UNREAD_KEY, useConversation, usePageVisible } from './useChat';

/** A message on its way to the server, shown at once. */
interface Pending {
  tempId: string;
  body: string;
  createdAt: string;
  /** Why it didn't send; it can be retried. */
  failed?: string;
}

const GROUP_MS = 5 * 60_000;
// Layout effects only run in the browser; this avoids React's warning during server rendering.
const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;

/** One open chat: header, messages (polled every few seconds) and the box to write in. */
export default function ConversationPane({ id, initial }: { id: string; initial?: ConversationPage }) {
  const { data, error, mutate } = useConversation(id, initial);
  const { mutate: mutateGlobal } = useSWRConfig();
  const visible = usePageVisible();
  const [older, setOlder] = useState<ChatMessage[]>([]);
  const [olderHasMore, setOlderHasMore] = useState<boolean | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [pending, setPending] = useState<Pending[]>([]);
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [blockBusy, setBlockBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // Stay pinned to the newest message unless the student scrolled up to read.
  const stick = useRef(true);
  // Distance from the bottom to keep while older messages load above.
  const restore = useRef<number | null>(null);

  const conv = data?.conversation;
  const other = conv?.other;
  const now = data?.now ?? new Date().toISOString();
  const messages = useMemo(() => {
    const latest = data?.messages ?? [];
    const seen = new Set(latest.map((m) => m.id));
    return [...older.filter((m) => !seen.has(m.id)), ...latest];
  }, [older, data?.messages]);
  const hasMore = olderHasMore ?? data?.hasMore ?? false;
  const canSend = Boolean(conv && !conv.blocked && other && !other.inactive);
  const lastMine = [...messages].reverse().find((m) => m.mine);
  const seen = Boolean(lastMine && data?.otherReadAt && Date.parse(data.otherReadAt) >= Date.parse(lastMine.createdAt));

  // Scroll: keep the place when older messages load, otherwise follow new ones.
  useBrowserLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (restore.current !== null) {
      el.scrollTop = el.scrollHeight - restore.current;
      restore.current = null;
    } else if (stick.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, pending.length]);

  // Mark the chat read while it's open and in front.
  const unread = conv?.unread ?? 0;
  const lastId = data?.messages[data.messages.length - 1]?.id;
  useEffect(() => {
    if (!visible || !unread) return;
    let cancelled = false;
    apiFetch<{ unread: number }>(`/api/messages/${id}/read`, { method: 'POST' })
      .then((res) => {
        if (cancelled) return;
        void mutateGlobal(UNREAD_KEY, { unread: res.unread }, { revalidate: false });
        void mutateGlobal(
          CONVERSATIONS_KEY,
          (list?: ConversationList) => list && { ...list, unread: res.unread, items: list.items.map((c) => (c.id === id ? { ...c, unread: 0 } : c)) },
          { revalidate: false }
        );
        void mutate((d) => d && { ...d, conversation: { ...d.conversation, unread: 0 } }, { revalidate: false });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id, visible, unread, lastId, mutate, mutateGlobal]);

  // Grow the box with what's typed, up to about six lines.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }, [draft]);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenuOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('click', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const onScroll = () => {
    const el = scroller.current;
    if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const loadOlder = async () => {
    const first = messages[0];
    if (!first || loadingOlder) return;
    setLoadingOlder(true);
    const el = scroller.current;
    try {
      const page = await apiFetch<ConversationPage>(`/api/messages/${id}?before=${first.id}`);
      restore.current = el ? el.scrollHeight - el.scrollTop : null;
      setOlder((list) => [...page.messages, ...list]);
      setOlderHasMore(page.hasMore);
    } catch (err) {
      setNotice(err instanceof ApiClientError ? err.message : 'Couldn’t load older messages. Try again.');
    } finally {
      setLoadingOlder(false);
    }
  };

  const send = async (text: string, retryId?: string) => {
    const body = text.trim();
    if (!body || !canSend) return;
    const tempId = retryId ?? `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    stick.current = true;
    setNotice('');
    if (retryId) setPending((p) => p.map((x) => (x.tempId === retryId ? { ...x, failed: undefined } : x)));
    else {
      setPending((p) => [...p, { tempId, body, createdAt: new Date().toISOString() }]);
      setDraft('');
    }
    try {
      const { message } = await apiFetch<{ message: ChatMessage }>(`/api/messages/${id}`, { body: { body } });
      await mutate(
        (d) => d && { ...d, messages: d.messages.some((m) => m.id === message.id) ? d.messages : [...d.messages, message] },
        { revalidate: false }
      );
      setPending((p) => p.filter((x) => x.tempId !== tempId));
      void mutateGlobal(CONVERSATIONS_KEY);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Couldn’t send. Check your connection and try again.';
      if (err instanceof ApiClientError && err.status >= 400 && err.status < 500 && err.status !== 429) {
        // Refused (offensive words, blocked chat): put the text back so it can be fixed.
        setPending((p) => p.filter((x) => x.tempId !== tempId));
        setDraft((d) => d || body);
        setNotice(message);
        if (err.status === 403) void mutate();
      } else {
        setPending((p) => p.map((x) => (x.tempId === tempId ? { ...x, failed: message } : x)));
      }
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send(draft);
    }
  };

  const toggleBlock = async () => {
    if (!conv || !other) return;
    setMenuOpen(false);
    if (!conv.blocked && !window.confirm(`Block this chat with ${firstName(other.name)}? Neither of you can send messages until you unblock it.`)) return;
    setBlockBusy(true);
    setNotice('');
    try {
      await apiFetch(`/api/messages/${id}/block`, { method: 'POST' });
      await mutate();
      void mutateGlobal(CONVERSATIONS_KEY);
    } catch (err) {
      setNotice(err instanceof ApiClientError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBlockBusy(false);
    }
  };

  if (error && !data) {
    const missing = error instanceof ApiClientError && error.status === 404;
    return (
      <ChatPhoto
        title={missing ? 'This chat isn’t available' : 'We couldn’t load this chat'}
        text={missing ? 'It may have been removed, or it isn’t one of your chats.' : 'Check your connection and try again.'}
      >
        <Link href="/messages" className="btn-secondary py-2.5 text-sm">
          All chats
        </Link>
      </ChatPhoto>
    );
  }

  if (!data || !conv || !other) {
    return (
      <div className="flex h-full flex-col" aria-busy="true" aria-label="Loading the chat">
        <div className="flex items-center gap-3 border-b border-ink/10 px-4 py-3">
          <div className="h-11 w-11 animate-pulse rounded-full bg-ink/10" />
          <div className="h-4 w-40 animate-pulse rounded bg-ink/10" />
        </div>
        <div className="flex-1 space-y-3 p-5">
          <div className="h-10 w-2/3 animate-pulse rounded-2xl bg-ink/[0.06]" />
          <div className="ml-auto h-10 w-1/2 animate-pulse rounded-2xl bg-ink/[0.06]" />
          <div className="h-10 w-1/3 animate-pulse rounded-2xl bg-ink/[0.06]" />
        </div>
      </div>
    );
  }

  const profileHref = other.id ? `/u/${other.handle}` : undefined;
  const detail = [other.about, other.college].filter(Boolean).join(' · ');

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-2 border-b border-ink/10 px-2 py-2.5 sm:gap-3 sm:px-4">
        <Link href="/messages" className="rounded-full p-2 text-ink/70 hover:bg-ink/5 hover:text-ink lg:hidden" aria-label="Back to all chats">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Avatar name={other.name} image={other.image} size="md" className="ring-0" />
        <div className="min-w-0 flex-1">
          {profileHref ? (
            <Link href={profileHref} className="block truncate font-semibold text-ink hover:underline">
              {other.name}
            </Link>
          ) : (
            <p className="truncate font-semibold text-ink/70">{other.name}</p>
          )}
          {detail && <p className="truncate text-xs text-ink/60">{detail}</p>}
        </div>
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label="Chat options"
            className="rounded-full p-2 text-ink/70 hover:bg-ink/5 hover:text-ink"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
          {menuOpen && (
            <div className="hf-dd-in absolute right-0 top-full z-20 mt-2 w-52 rounded-2xl border border-ink/10 bg-card p-1.5 text-sm shadow-lift">
              {profileHref && (
                <Link href={profileHref} className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-ink/5">
                  <UserRound className="h-4 w-4 text-ink/60" />
                  View profile
                </Link>
              )}
              {(!conv.blocked || conv.blockedByMe) && (
                <button
                  type="button"
                  onClick={toggleBlock}
                  disabled={blockBusy}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-brand-700 hover:bg-ink/5 dark:text-brand-300"
                >
                  <Ban className="h-4 w-4" />
                  {conv.blockedByMe ? 'Unblock chat' : 'Block chat'}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <div ref={scroller} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5" aria-live="polite" aria-label={`Messages with ${other.name}`}>
        {hasMore ? (
          <div className="mb-4 flex justify-center">
            <button type="button" onClick={loadOlder} disabled={loadingOlder} className="btn-secondary px-4 py-1.5 text-xs">
              {loadingOlder && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {loadingOlder ? 'Loading…' : 'Show older messages'}
            </button>
          </div>
        ) : (
          <div className="mx-auto mb-5 max-w-md rounded-2xl border border-ink/10 px-4 py-3 text-center text-xs leading-5 text-ink/60">
            <ShieldCheck className="mx-auto mb-1 h-4 w-4 text-ink/50" aria-hidden="true" />
            You connected when {conv.origin === 'invite' ? 'an invite' : 'a join request'} was accepted. Only the two of you can see
            this chat. Keep it respectful, and never share passwords or OTPs.
          </div>
        )}

        {messages.length === 0 && pending.length === 0 && (
          <p className="py-6 text-center text-sm text-ink/60">No messages yet. Say hi to {firstName(other.name)}!</p>
        )}

        <ol className="space-y-1">
          {messages.map((m, i) => {
            const prev = messages[i - 1];
            const newDay = !prev || dayKey(prev.createdAt) !== dayKey(m.createdAt);
            const grouped = Boolean(prev && !newDay && prev.mine === m.mine && Date.parse(m.createdAt) - Date.parse(prev.createdAt) < GROUP_MS);
            return (
              <Fragment key={m.id}>
                {newDay && (
                  <li className="py-3 text-center" aria-hidden="true">
                    <span className="rounded-full bg-ink/[0.06] px-3 py-1 text-[11px] font-semibold text-ink/60">{dayLabel(m.createdAt, now)}</span>
                  </li>
                )}
                <Bubble message={m} grouped={grouped} status={m === lastMine ? (seen ? 'seen' : 'sent') : undefined} />
              </Fragment>
            );
          })}
          {pending.map((p) => (
            <li key={p.tempId} className="flex flex-col items-end pt-1">
              <p className={cn('max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md px-3.5 py-2 text-sm sm:max-w-[70%]', p.failed ? 'bg-accent/20 text-ink' : 'bg-accent/70 text-white')}>
                {p.body}
              </p>
              {p.failed ? (
                <p className="mt-1 flex items-center gap-2 text-[11px] text-brand-700 dark:text-brand-300">
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  {p.failed}
                  <button type="button" onClick={() => void send(p.body, p.tempId)} className="inline-flex items-center gap-1 font-semibold underline">
                    <RotateCcw className="h-3 w-3" aria-hidden="true" />
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={() => setPending((list) => list.filter((x) => x.tempId !== p.tempId))}
                    className="inline-flex items-center gap-0.5 font-semibold underline"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                    Discard
                  </button>
                </p>
              ) : (
                <p className="mt-0.5 text-[11px] text-ink/45">Sending…</p>
              )}
            </li>
          ))}
        </ol>
      </div>

      <footer className="border-t border-ink/10 p-3 sm:p-4">
        {notice && (
          <p role="alert" className="mb-2 rounded-xl bg-accent/10 px-3 py-2 text-xs font-medium text-brand-800 dark:text-brand-200">
            {notice}
          </p>
        )}
        {conv.blocked ? (
          <div className="flex flex-col items-center gap-2 rounded-xl bg-ink/[0.04] px-4 py-3 text-center text-sm text-ink/70 sm:flex-row sm:justify-between sm:text-left">
            <span className="flex items-center gap-2">
              <Ban className="h-4 w-4 shrink-0" aria-hidden="true" />
              {conv.blockedByMe ? 'You blocked this chat, so neither of you can send messages.' : 'This chat is closed. You can’t send messages here.'}
            </span>
            {conv.blockedByMe && (
              <button type="button" onClick={toggleBlock} disabled={blockBusy} className="btn-secondary shrink-0 px-4 py-1.5 text-xs">
                Unblock
              </button>
            )}
          </div>
        ) : other.inactive ? (
          <p className="rounded-xl bg-ink/[0.04] px-4 py-3 text-center text-sm text-ink/70">
            This student’s account isn’t active any more, so you can’t send messages.
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(draft);
            }}
            className="flex items-end gap-2"
          >
            <label htmlFor="chat-box" className="sr-only">
              Message {other.name}
            </label>
            <textarea
              id="chat-box"
              ref={box}
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, MESSAGE_MAX))}
              onKeyDown={onKeyDown}
              maxLength={MESSAGE_MAX}
              placeholder={`Message ${firstName(other.name)}…`}
              className="input max-h-[168px] min-h-[44px] flex-1 resize-none py-2.5"
              aria-describedby="chat-hint"
            />
            <button type="submit" disabled={!draft.trim()} className="btn-primary h-11 w-11 shrink-0 p-0" aria-label="Send message">
              <Send className="h-4 w-4" />
            </button>
          </form>
        )}
        {canSend && (
          <p id="chat-hint" className="mt-1.5 flex justify-between gap-3 text-[11px] text-ink/45">
            <span className="hidden sm:inline">Enter to send, Shift + Enter for a new line</span>
            {draft.length > MESSAGE_MAX - 200 && (
              <span>
                {draft.length.toLocaleString('en-IN')}/{MESSAGE_MAX.toLocaleString('en-IN')}
              </span>
            )}
          </p>
        )}
      </footer>
    </div>
  );
}

function Bubble({ message: m, grouped, status }: { message: ChatMessage; grouped: boolean; status?: 'sent' | 'seen' }) {
  return (
    <li className={cn('flex flex-col', m.mine ? 'items-end' : 'items-start', grouped ? 'pt-0.5' : 'pt-2')}>
      <p
        className={cn(
          'max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed sm:max-w-[70%]',
          m.mine ? 'rounded-br-md bg-accent text-white' : 'rounded-bl-md bg-ink/[0.07] text-ink'
        )}
      >
        {m.body}
      </p>
      <p className="mt-0.5 flex items-center gap-1 px-1 text-[11px] text-ink/45">
        <time dateTime={m.createdAt}>{messageTime(m.createdAt)}</time>
        {status === 'seen' && (
          <span className="inline-flex items-center gap-0.5 font-semibold text-ink/60">
            · <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" /> Seen
          </span>
        )}
        {status === 'sent' && (
          <span className="inline-flex items-center gap-0.5">
            · <Check className="h-3.5 w-3.5" aria-hidden="true" /> Sent
          </span>
        )}
      </p>
    </li>
  );
}
