import { z } from 'zod';
import { objectId, readBody } from '@/server/api';
import { adminRoute, contentAction } from '@/server/admin';

const Body = z
  .object({
    type: z.enum(['thread', 'reply', 'team-post', 'win', 'request', 'invite']),
    id: objectId,
    action: z.enum(['remove', 'restore', 'pin', 'unpin', 'withdraw']),
  })
  .strict();

/** Remove, restore or pin one piece of community content, or withdraw a pending team request or invite. */
export const POST = adminRoute(async ({ req, user }) => {
  const { type, id, action } = await readBody(req, Body);
  return contentAction(type, id, action, user);
});
