import { z } from 'zod';
import { isHttpUrl, ListingInput } from '@/components/admin/listingFields';
import { readBody } from '@/server/api';
import { adminRoute, deleteListing, getListingDetail, idParam, updateListing } from '@/server/admin';

/** One listing with its editor fields, where we found it (raw items, submissions), its reports and recent numbers. */
export const GET = adminRoute<{ id: string }>(async ({ params }) => getListingDetail(idParam(params.id, 'That listing')));

const imageRef = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v === '' || v.startsWith('/uploads/') || isHttpUrl(v), 'Use a full image link, or leave it empty.');

const Patch = z
  .object({
    fields: ListingInput.optional(),
    state: z.enum(['live', 'pending', 'rejected', 'removed']).optional(),
    featured: z.boolean().optional(),
    verified: z.boolean().optional(),
    imageUrl: imageRef.optional(),
    registrationVia: z.enum(['link', 'qr']).optional(),
    note: z.string().trim().max(300).default(''),
  })
  .strict()
  .refine(
    (v) => v.fields || v.state || v.featured !== undefined || v.verified !== undefined || v.imageUrl !== undefined || v.registrationVia !== undefined,
    'Nothing to change.'
  );

/** Edit, approve (state "live"), reject, remove (with a reason) or restore; flip featured / verified; replace the banner. */
export const PATCH = adminRoute<{ id: string }>(async ({ req, params, user }) => {
  const patch = await readBody(req, Patch);
  return { listing: await updateListing(idParam(params.id, 'That listing'), patch, user) };
});

const Delete = z.object({ confirm: z.literal('DELETE', { error: 'Type DELETE to confirm.' }) }).strict();

/** Deletes the listing for good (its saves too). Removing it is usually better: that can be undone. */
export const DELETE = adminRoute<{ id: string }>(async ({ req, params, user }) => {
  await readBody(req, Delete);
  return { deleted: await deleteListing(idParam(params.id, 'That listing'), user) };
});
