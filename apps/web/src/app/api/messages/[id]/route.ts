import { notFound, objectId, readBody, readQuery, route } from '@/server/api';
import { MessagesQuerySchema, SendMessageSchema, getConversationPage, sendMessage } from '@/server/chat';

type Params = { id: string };

/** One chat and its latest messages (or older ones with ?before=<message id>). Members only. */
export const GET = route<Params>(
  async ({ req, params, user }) => {
    if (!objectId.safeParse(params.id).success) throw notFound('That chat');
    const { before } = readQuery(req, MessagesQuerySchema);
    return getConversationPage(user!.id, params.id, before);
  },
  { auth: 'required', rate: { limit: 300, windowMs: 60_000, key: 'messages-read' } }
);

/** Sends a message. Members only, not while the chat is blocked, and it has to be respectful. */
export const POST = route<Params>(
  async ({ req, params, user, ip }) => {
    if (!objectId.safeParse(params.id).success) throw notFound('That chat');
    const { body } = await readBody(req, SendMessageSchema);
    return { message: await sendMessage(user!, params.id, body, ip) };
  },
  { auth: 'required', rate: { limit: 30, windowMs: 60_000, key: 'messages-send' } }
);
