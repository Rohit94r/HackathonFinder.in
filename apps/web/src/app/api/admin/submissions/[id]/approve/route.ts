import { z } from 'zod';
import { ListingInput } from '@/components/admin/listingFields';
import { readBody } from '@/server/api';
import { adminRoute, approveSubmission, idParam } from '@/server/admin';

const Body = z.object({ listing: ListingInput, note: z.string().trim().max(500).default('') });

/** Approve: creates the live listing from the edited fields and tells the submitter. */
export const POST = adminRoute<{ id: string }>(async ({ req, params, user }) => {
  const { listing, note } = await readBody(req, Body);
  return approveSubmission(idParam(params.id, 'That submission'), listing, user, note);
});
