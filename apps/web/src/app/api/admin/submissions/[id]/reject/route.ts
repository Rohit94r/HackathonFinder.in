import { z } from 'zod';
import { readBody } from '@/server/api';
import { adminRoute, idParam, rejectSubmission } from '@/server/admin';

const Body = z.object({ note: z.string().trim().max(500).default('') });

/** Reject, with an optional note the student sees in their notifications. */
export const POST = adminRoute<{ id: string }>(async ({ req, params, user }) => {
  const { note } = await readBody(req, Body);
  await rejectSubmission(idParam(params.id, 'That submission'), user, note);
  return { ok: true };
});
