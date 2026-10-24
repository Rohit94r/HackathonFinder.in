import { Schema, type Types } from 'mongoose';
import { defineModel } from './define';

/**
 * A private chat between two students. It opens once one of them accepts the other's
 * team invite or join request, so strangers can't message each other cold.
 */
export interface IConversation {
  _id: Types.ObjectId;
  /** The two students, sorted by id. */
  members: Types.ObjectId[];
  /** "<smaller id>:<larger id>", so each pair has one conversation. */
  key: string;
  /** How they connected. */
  origin: { kind: 'invite' | 'request'; id: Types.ObjectId };
  lastMessageAt?: Date | null;
  /** Preview for the inbox list. */
  lastMessage?: { senderId: Types.ObjectId; body: string } | null;
  /** When each member last opened the conversation; anything newer is unread. */
  readAt: { userId: Types.ObjectId; at: Date }[];
  /** Set when a member blocks the other; nobody can send until it's cleared. */
  blockedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  body: string;
  deletedAt?: Date | null;
  createdAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    members: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], required: true },
    key: { type: String, required: true },
    origin: {
      kind: { type: String, enum: ['invite', 'request'], required: true },
      id: { type: Schema.Types.ObjectId, required: true },
    },
    lastMessageAt: { type: Date, default: null },
    lastMessage: {
      type: new Schema({ senderId: { type: Schema.Types.ObjectId, ref: 'User' }, body: String }, { _id: false }),
      default: null,
    },
    readAt: {
      type: [{ _id: false, userId: { type: Schema.Types.ObjectId, ref: 'User' }, at: Date }],
      default: [],
    },
    blockedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);
conversationSchema.index({ key: 1 }, { unique: true });
conversationSchema.index({ members: 1, lastMessageAt: -1 });

const messageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true, minlength: 1, maxlength: 2000 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });

/** The conversation key for two user ids, in either order. */
export function conversationKey(a: Types.ObjectId | string, b: Types.ObjectId | string): string {
  return [String(a), String(b)].sort().join(':');
}

export const Conversation = defineModel<IConversation>('Conversation', conversationSchema);
export const Message = defineModel<IMessage>('Message', messageSchema);
