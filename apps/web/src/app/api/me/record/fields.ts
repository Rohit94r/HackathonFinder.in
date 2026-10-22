import { z } from 'zod';
import { Hackathon } from '@hackathonfinder/db';
import { badRequest } from '@/server/api';

const DAY = 24 * 60 * 60 * 1000;
export const MAX_RECORDS = 100;

/** One hackathon in the student's record (POST takes all of it, PATCH any part). */
export const RecordFields = z.object({
  event: z.string().trim().min(2, 'Add the hackathon’s name.').max(120, 'Keep the name under 120 characters.'),
  /** Set when it's one of our listings, so the record links to it. */
  hackathonSlug: z
    .string()
    .trim()
    .max(80)
    .refine((v) => v === '' || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v), 'Not a valid listing.')
    .optional(),
  result: z.enum(['winner', 'runner-up', 'finalist', 'participant'], { error: 'Pick how it went.' }),
  project: z.string().trim().max(120, 'Keep the project name under 120 characters.').optional(),
  date: z.coerce
    .date({ error: 'Add when it happened.' })
    .refine((d) => d.getTime() <= Date.now() + 2 * DAY, 'That date is in the future. Add hackathons once they’re over.')
    .refine((d) => d.getUTCFullYear() >= 2000, 'Pick a date after 2000.'),
});

/** Checks a linked listing exists; an empty slug unlinks it. */
export async function checkListing(slug: string | undefined): Promise<string | undefined> {
  if (!slug) return slug === '' ? '' : undefined;
  if (!(await Hackathon.exists({ slug }))) {
    throw badRequest('We couldn’t find that hackathon in our listings.', { hackathonSlug: 'Pick a hackathon from the list, or leave it blank.' });
  }
  return slug;
}
