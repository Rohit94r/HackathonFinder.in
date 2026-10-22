import 'server-only';
import crypto from 'node:crypto';
import { AuthToken, type IAuthToken, type Types } from '@hackathonfinder/db';

const hash = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

/** Creates a one-time token and returns the raw value for the link; only its hash is stored. */
export async function createToken(type: IAuthToken['type'], userId: Types.ObjectId | string, ttlMs: number): Promise<string> {
  // A new link replaces older unused ones.
  await AuthToken.deleteMany({ type, userId, usedAt: null });
  const token = crypto.randomBytes(32).toString('base64url');
  await AuthToken.create({ type, userId, tokenHash: hash(token), expiresAt: new Date(Date.now() + ttlMs) });
  return token;
}

/** Marks the token used and returns its user id, or null if it's wrong, used or expired. */
export async function consumeToken(type: IAuthToken['type'], token: string): Promise<Types.ObjectId | null> {
  const doc = await AuthToken.findOneAndUpdate(
    { type, tokenHash: hash(token), usedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } }
  );
  return doc ? doc.userId : null;
}
