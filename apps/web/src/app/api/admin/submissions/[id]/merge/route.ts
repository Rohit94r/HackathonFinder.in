import { z } from 'zod';
import { objectId, readBody } from '@/server/api';
import { adminRoute, idParam, mergeSubmission } from '@/server/admin';

const Body = z.object({ hackathonId: objectId, note: z.string().trim().max(500).default('') });

/** Merge: the shared link joins an existing listing (as a source) and fills its empty fields. */
export const POST = adminRoute<{ id: string }>(async ({ req, params, user }) => {
  const { hackathonId, note } = await readBody(req, Body);
  return mergeSubmission(idParam(params.id, 'That submission'), hackathonId, user, note);
});
