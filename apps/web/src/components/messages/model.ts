// Chat shapes shared by the API (server/chat.ts) and the messages UI. Client-safe.

export const MESSAGE_MAX = 2000;

/** The other student in a chat. Never includes an email. */
export interface ChatPerson {
  /** Empty for a deleted account. */
  id: string;
  handle: string;
  name: string;
  image?: string;
  about: string;
  college: string;
  city: string;
  /** Banned or deleted: the chat stays readable but nobody can send. */
  inactive: boolean;
}

export interface ConversationSummary {
  id: string;
  other: ChatPerson;
  /** Latest message, for the inbox preview. */
  lastMessage: { body: string; mine: boolean; at: string } | null;
  /** Messages from the other student since you last opened the chat. */
  unread: number;
  /** Someone blocked the chat, so nobody can send. */
  blocked: boolean;
  blockedByMe: boolean;
  /** When you connected: an accepted invite or join request. */
  origin: 'invite' | 'request';
  createdAt: string;
  lastMessageAt: string;
}

export interface ChatMessage {
  id: string;
  body: string;
  mine: boolean;
  createdAt: string;
}

export interface ConversationList {
  items: ConversationSummary[];
  unread: number;
  now: string;
}

/** GET /api/messages/[id]: the conversation and a page of messages, oldest first. */
export interface ConversationPage {
  conversation: ConversationSummary;
  messages: ChatMessage[];
  /** Older messages exist; ask again with ?before=<id of the first message>. */
  hasMore: boolean;
  /** When the other student last read the chat, for "Seen". */
  otherReadAt: string | null;
  now: string;
}

const TZ = 'Asia/Kolkata';
const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ });
const dayFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ });
const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ });
const dayKeyFmt = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: TZ });

/** "4:05 PM" in India time. */
export function messageTime(iso: string): string {
  return timeFmt.format(new Date(iso)).toUpperCase();
}

/** "2024-05-01" in India time, to group messages by day. */
export function dayKey(iso: string): string {
  return dayKeyFmt.format(new Date(iso));
}

/** "Today", "Yesterday", "Mon, 3 Jun", or a full date for older days. */
export function dayLabel(iso: string, nowIso: string): string {
  const key = dayKey(iso);
  const now = new Date(nowIso);
  if (key === dayKey(nowIso)) return 'Today';
  if (key === dayKey(new Date(now.getTime() - 86_400_000).toISOString())) return 'Yesterday';
  return now.getTime() - Date.parse(iso) < 6 * 86_400_000 ? dayFmt.format(new Date(iso)) : dateFmt.format(new Date(iso));
}

/** Inbox time: "4:05 PM" today, "Yesterday", or a short date. */
export function inboxTime(iso: string, nowIso: string): string {
  const label = dayLabel(iso, nowIso);
  return label === 'Today' ? messageTime(iso) : label;
}
