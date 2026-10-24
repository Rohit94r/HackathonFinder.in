import { z } from 'zod';
import { objectId, readBody } from '@/server/api';
import { adminRoute, idParam, mergeListing } from '@/server/admin';

const Body = z.object({ intoId: objectId }).strict();

/** Merges this listing (usually a pending duplicate) into another: sources move over, gaps are filled, this one is removed. */
export const POST = adminRoute<{ id: string }>(async ({ req, params, user }) => {
  const { intoId } = await readBody(req, Body);
  return mergeListing(idParam(params.id, 'That listing'), intoId, user);
});
