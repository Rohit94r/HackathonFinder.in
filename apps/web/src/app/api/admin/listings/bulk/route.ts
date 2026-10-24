import { z } from 'zod';
import { badRequest, objectId, readBody } from '@/server/api';
import { adminRoute, bulkListings } from '@/server/admin';

const Body = z
  .object({
    ids: z.array(objectId).min(1, 'Pick at least one listing.').max(100, 'Up to 100 at a time.'),
    action: z.enum(['live', 'remove', 'restore', 'feature', 'unfeature', 'verify', 'unverify', 'delete']),
    note: z.string().trim().max(300).default(''),
    /** Must be "DELETE" for the delete action. */
    confirm: z.string().max(10).optional(),
  })
  .strict();

/** Keep, remove, restore, feature, verify or delete many listings at once. */
export const POST = adminRoute(async ({ req, user }) => {
  const body = await readBody(req, Body);
  if (body.action === 'delete' && body.confirm !== 'DELETE') throw badRequest('Type DELETE to confirm.', { confirm: 'Type DELETE to confirm.' });
  if (body.action === 'remove' && body.note.length < 2) throw badRequest('Say why they’re being removed.', { note: 'Add a reason.' });
  return bulkListings(body.ids, body.action, user, body.note);
});
