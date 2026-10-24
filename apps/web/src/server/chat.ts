import 'server-only';
import { z } from 'zod';
import {
  AUTHOR_FIELDS,
  Conversation,
  Message,
  Notification,
  Types,
  User,
  connectDb,
  conversationKey,
  isDbConfigured,
  notify,
  type IConversation,
  type IMessage,
  type IUser,
} from '@hackathonfinder/db';
import {
  MESSAGE_MAX,
  type ChatMessage,
  type ChatPerson,
  type ConversationList,
  type ConversationPage,
  type ConversationSummary,
} from '@/components/messages/model';
import { forbidden, notFound } from './api';
import type { SessionUser } from './auth';
import { assertCanPost } from './community';
import { assertRespectful } from './moderation';

// Private chats between two students. A chat only opens once one of them accepts the
// other's team invite or join request (see server/teams.ts), so nobody can message a
// stranger cold. Only the two members can ever read it; everyone else gets a 404.

type Id = Types.ObjectId | string;
type ConversationDoc = Omit<IConversation, never>;

const PAGE_SIZE = 40;
const INBOX_LIMIT = 100;
const PREVIEW_MAX = 140;

const iso = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString() : '');
const oid = (id: Id) => (typeof id === 'string' ? new Types.ObjectId(id) : id);

export const SendMessageSchema = z.object({
  body: z
    .string('Write a message first.')
    .trim()
    .min(1, 'Write a message first.')
    .max(MESSAGE_MAX, `Keep messages under ${MESSAGE_MAX.toLocaleString('en-IN')} characters.`),
});

export const MessagesQuerySchema = z.object({
  /** A message id: return the messages before it. */
  before: z.string().regex(/^[a-f0-9]{24}$/i, 'Not a valid id.').optional(),
});

/** Notification type for chats; older running schemas without 'chat' get 'system' instead. */
function chatNotificationType(): 'chat' | 'system' {
  const values = (Notification.schema.path('type') as unknown as { enumValues?: string[] }).enumValues ?? [];
  return values.includes('chat') ? 'chat' : 'system';
}

// ── People ────────────────────────────────────────────────────────────────

type PersonDoc = Pick<IUser, '_id' | 'handle' | 'name' | 'image' | 'about' | 'college' | 'city' | 'deletedAt' | 'banned'>;

function toPerson(doc: PersonDoc | undefined): ChatPerson {
  if (!doc || doc.deletedAt) {
    return { id: '', handle: 'deleted', name: 'Former student', about: '', college: '', city: '', inactive: true };
  }
  return {
    id: String(doc._id),
    handle: doc.handle,
    name: doc.name,
    image: doc.image || undefined,
    about: doc.about ?? '',
    college: doc.college ?? '',
    city: doc.city ?? '',
    inactive: Boolean(doc.banned),
  };
}

async function peopleById(ids: Id[]): Promise<Map<string, PersonDoc>> {
  if (!ids.length) return new Map();
  const docs = await User.find({ _id: { $in: ids } })
    .select(`${AUTHOR_FIELDS} deletedAt banned`)
    .lean<PersonDoc[]>();
  return new Map(docs.map((d) => [String(d._id), d]));
}

// ── Conversations ─────────────────────────────────────────────────────────

const otherOf = (c: Pick<IConversation, 'members'>, userId: string) => c.members.find((m) => String(m) !== userId) ?? c.members[0];
const readAtOf = (c: Pick<IConversation, 'readAt'>, userId: string) => c.readAt?.find((r) => String(r.userId) === userId)?.at ?? null;

function toSummary(c: ConversationDoc, userId: string, other: PersonDoc | undefined, unread: number): ConversationSummary {
  const blockedBy = c.blockedBy ? String(c.blockedBy) : '';
  return {
    id: String(c._id),
    other: toPerson(other),
    lastMessage: c.lastMessage?.body
      ? { body: c.lastMessage.body, mine: String(c.lastMessage.senderId) === userId, at: iso(c.lastMessageAt ?? c.updatedAt) }
      : null,
    unread,
    blocked: Boolean(blockedBy),
    blockedByMe: blockedBy === userId,
    origin: c.origin?.kind === 'request' ? 'request' : 'invite',
    createdAt: iso(c.createdAt),
    lastMessageAt: iso(c.lastMessageAt ?? c.createdAt),
  };
}

/** Unread messages per conversation: the other student's messages after this student's readAt. */
async function unreadCounts(convs: ConversationDoc[], userId: string): Promise<Map<string, number>> {
  // Skip chats with nothing new since they were last opened.
  const maybe = convs.filter((c) => {
    if (!c.lastMessage || String(c.lastMessage.senderId) === userId) return false;
    const read = readAtOf(c, userId);
    return !read || (c.lastMessageAt && new Date(c.lastMessageAt) > new Date(read));
  });
  if (!maybe.length) return new Map();
  const rows = await Message.aggregate<{ _id: Types.ObjectId; n: number }>([
    {
      $match: {
        $or: maybe.map((c) => {
          const read = readAtOf(c, userId);
          return { conversationId: c._id, ...(read ? { createdAt: { $gt: new Date(read) } } : {}) };
        }),
        senderId: { $ne: oid(userId) },
        deletedAt: null,
      },
    },
    { $group: { _id: '$conversationId', n: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.n]));
}

/** The student's chats, latest first, with the other student and unread counts. */
export async function listConversations(userId: string): Promise<ConversationList> {
  const convs = await Conversation.find({ members: oid(userId) })
    .sort({ lastMessageAt: -1, _id: -1 })
    .limit(INBOX_LIMIT)
    .lean<ConversationDoc[]>();
  const [people, unread] = await Promise.all([peopleById(convs.map((c) => otherOf(c, userId))), unreadCounts(convs, userId)]);
  const items = convs.map((c) => toSummary(c, userId, people.get(String(otherOf(c, userId))), unread.get(String(c._id)) ?? 0));
  return { items, unread: items.reduce((sum, c) => sum + c.unread, 0), now: new Date().toISOString() };
}

/** The inbox for a server-rendered page; undefined without a database or on error (the page loads it itself then). */
export async function inboxForPage(userId: string): Promise<ConversationList | undefined> {
  if (!isDbConfigured()) return undefined;
  try {
    await connectDb();
    return await listConversations(userId);
  } catch (err) {
    console.error('[chat] Could not load the inbox:', err);
    return undefined;
  }
}

/** Total unread messages, for the badge in the account menu. */
export async function unreadTotal(userId: string): Promise<number> {
  const convs = await Conversation.find({ members: oid(userId), 'lastMessage.senderId': { $ne: oid(userId) } })
    .select('readAt lastMessage lastMessageAt')
    .limit(INBOX_LIMIT)
    .lean<ConversationDoc[]>();
  const counts = await unreadCounts(convs, userId);
  return [...counts.values()].reduce((a, b) => a + b, 0);
}

/** The conversation if this student is in it. Anyone else gets a 404, so ids reveal nothing. */
async function memberConversation(userId: string, id: string): Promise<ConversationDoc> {
  if (!Types.ObjectId.isValid(id)) throw notFound('That chat');
  const conv = await Conversation.findOne({ _id: oid(id), members: oid(userId) }).lean<ConversationDoc>();
  if (!conv) throw notFound('That chat');
  return conv;
}

function toMessage(m: Pick<IMessage, '_id' | 'senderId' | 'body' | 'createdAt'>, userId: string): ChatMessage {
  return { id: String(m._id), body: m.body, mine: String(m.senderId) === userId, createdAt: iso(m.createdAt) };
}

/** A page of messages, oldest first: the latest ones, or the ones before `before`. */
export async function getConversationPage(userId: string, id: string, before?: string): Promise<ConversationPage> {
  const conv = await memberConversation(userId, id);
  const filter: Record<string, unknown> = { conversationId: conv._id, deletedAt: null };
  if (before) {
    const cursor = await Message.findOne({ _id: oid(before), conversationId: conv._id }).select('createdAt').lean();
    if (!cursor) throw notFound('That message');
    filter.$or = [{ createdAt: { $lt: cursor.createdAt } }, { createdAt: cursor.createdAt, _id: { $lt: cursor._id } }];
  }
  const otherId = otherOf(conv, userId);
  const [rows, people] = await Promise.all([
    Message.find(filter).sort({ createdAt: -1, _id: -1 }).limit(PAGE_SIZE + 1).lean(),
    peopleById([otherId]),
  ]);
  const unread = (await unreadCounts([conv], userId)).get(String(conv._id)) ?? 0;
  const otherRead = readAtOf(conv, String(otherId));
  return {
    conversation: toSummary(conv, userId, people.get(String(otherId)), unread),
    messages: rows.slice(0, PAGE_SIZE).reverse().map((m) => toMessage(m, userId)),
    hasMore: rows.length > PAGE_SIZE,
    otherReadAt: otherRead ? iso(otherRead) : null,
    now: new Date().toISOString(),
  };
}

/** Moves a member's "read up to" time forward (never back). */
async function setReadAt(convId: Types.ObjectId, userId: string, at: Date): Promise<void> {
  const uid = oid(userId);
  const moved = await Conversation.updateOne(
    { _id: convId, readAt: { $elemMatch: { userId: uid, at: { $lt: at } } } },
    { $set: { 'readAt.$.at': at } },
    { timestamps: false }
  );
  if (moved.matchedCount) return;
  await Conversation.updateOne(
    { _id: convId, 'readAt.userId': { $ne: uid } },
    { $push: { readAt: { userId: uid, at } } },
    { timestamps: false }
  );
}

/** Marks everything in the chat as read by this student. */
export async function markConversationRead(userId: string, id: string): Promise<{ unread: number }> {
  const conv = await memberConversation(userId, id);
  await setReadAt(conv._id, userId, new Date());
  return { unread: await unreadTotal(userId) };
}

/** Sends a message. Members only; not while the chat is blocked or the other account is gone. */
export async function sendMessage(user: SessionUser, id: string, body: string, ip?: string): Promise<ChatMessage> {
  await assertCanPost(user.id);
  const conv = await memberConversation(user.id, id);
  if (conv.blockedBy) {
    throw forbidden(
      String(conv.blockedBy) === user.id
        ? 'You blocked this chat. Unblock it to send messages.'
        : 'You can’t send messages in this chat any more.'
    );
  }
  const other = (await peopleById([otherOf(conv, user.id)])).get(String(otherOf(conv, user.id)));
  if (!other || other.deletedAt || other.banned) throw forbidden('This student’s account isn’t active any more, so you can’t send messages.');
  await assertRespectful({ userId: user.id, kind: 'message', ip }, body);

  const message = await Message.create({ conversationId: conv._id, senderId: user.id, body });
  await Promise.all([
    Conversation.updateOne(
      { _id: conv._id },
      { $set: { lastMessageAt: message.createdAt, lastMessage: { senderId: oid(user.id), body: body.slice(0, PREVIEW_MAX) } } }
    ),
    // Sending counts as reading everything before it.
    setReadAt(conv._id, user.id, message.createdAt),
  ]);
  return toMessage(message.toObject(), user.id);
}

/** Blocks the chat, or unblocks it if this student was the one who blocked it. */
export async function toggleBlock(userId: string, id: string): Promise<{ blocked: boolean; blockedByMe: boolean }> {
  const conv = await memberConversation(userId, id);
  if (conv.blockedBy && String(conv.blockedBy) !== userId) {
    throw forbidden('The other student blocked this chat, so only they can unblock it.');
  }
  const blocking = !conv.blockedBy;
  // Guarded on the current state, so two quick clicks can't fight.
  await Conversation.updateOne(
    { _id: conv._id, blockedBy: blocking ? null : oid(userId) },
    { $set: { blockedBy: blocking ? oid(userId) : null } },
    { timestamps: false }
  );
  return { blocked: blocking, blockedByMe: blocking };
}

/** The chat between two students, if they have one. */
export async function conversationBetween(a: string, b: string): Promise<string | null> {
  if (!a || !b || a === b) return null;
  const conv = await Conversation.findOne({ key: conversationKey(a, b) }).select('_id').lean();
  return conv ? String(conv._id) : null;
}

/** Chat ids for several students at once, keyed by the other student's id. */
export async function conversationsWith(userId: string, otherIds: Id[]): Promise<Map<string, string>> {
  const keys = [...new Set(otherIds.map(String))].filter((o) => o && o !== userId).map((o) => conversationKey(userId, o));
  if (!keys.length) return new Map();
  const convs = await Conversation.find({ key: { $in: keys } }).select('_id members').lean<ConversationDoc[]>();
  return new Map(convs.map((c) => [String(otherOf(c, userId)), String(c._id)]));
}

/**
 * Opens (or finds) the chat between two students once one accepts the other's invite or
 * join request. The student who accepted is told the chat is open; the one who asked
 * hears it in their "accepted" notification (server/teams.ts). Returns the chat id, or
 * null if it couldn't be opened: accepting still works then.
 */
export async function openConversation(
  accepter: Pick<SessionUser, 'id'>,
  otherId: Id,
  origin: { kind: 'invite' | 'request'; id: Id }
): Promise<string | null> {
  try {
    const members = [oid(accepter.id), oid(otherId)].sort((x, y) => String(x).localeCompare(String(y)));
    const key = conversationKey(members[0], members[1]);
    let created = false;
    let conv: ConversationDoc | null = await Conversation.findOne({ key }).lean<ConversationDoc>();
    if (!conv) {
      try {
        const doc = await Conversation.create({
          members,
          key,
          origin: { kind: origin.kind, id: oid(origin.id) },
          // New chats go to the top of both inboxes.
          lastMessageAt: new Date(),
          readAt: [],
        });
        conv = doc.toObject();
        created = true;
      } catch (err) {
        // The other student accepted something at the same moment: use their chat.
        if ((err as { code?: number }).code !== 11000) throw err;
        conv = await Conversation.findOne({ key }).lean<ConversationDoc>();
      }
    }
    if (!conv) return null;
    const id = String(conv._id);
    if (created) {
      const other = await User.findById(otherId).select('name').lean();
      await notify(
        accepter.id,
        chatNotificationType(),
        `You can now chat with ${other?.name ?? 'your new teammate'}`,
        'Say hi and plan your hackathon together.',
        `/messages/${id}`
      );
    }
    return id;
  } catch (err) {
    console.error('[chat] Could not open a conversation:', err);
    return null;
  }
}
