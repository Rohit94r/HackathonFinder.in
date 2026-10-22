import { z } from 'zod';
import { ListingInput } from '@/components/admin/listingFields';
import { readBody } from '@/server/api';
import { adminRoute, getListingDetail, idParam, updateListing } from '@/server/admin';

/** One listing with its editor fields, where we found it (raw items, submissions) and its reports. */
export const GET = adminRoute<{ id: string }>(async ({ params }) => getListingDetail(idParam(params.id, 'That listing')));

const Patch = z
  .object({
    fields: ListingInput.optional(),
    state: z.enum(['live', 'pending', 'rejected', 'removed']).optional(),
    featured: z.boolean().optional(),
    verified: z.boolean().optional(),
    note: z.string().trim().max(500).default(''),
  })
  .refine((v) => v.fields || v.state || v.featured !== undefined || v.verified !== undefined, 'Nothing to change.');

/** Edit, approve (state "live"), reject, remove or restore; or flip featured / verified. */
export const PATCH = adminRoute<{ id: string }>(async ({ req, params, user }) => {
  const patch = await readBody(req, Patch);
  return { listing: await updateListing(idParam(params.id, 'That listing'), patch, user) };
});
