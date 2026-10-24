import { z } from 'zod';
import { readQuery } from '@/server/api';
import { adminRoute, listAudit } from '@/server/admin';

const Query = z.object({
  q: z.string().trim().max(80).default(''),
  action: z
    .string()
    .trim()
    .max(60)
    .regex(/^[a-z0-9.-]*$/, 'Not a valid action.')
    .default(''),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

/** The admin audit log: who changed what, newest first. */
export const GET = adminRoute(async ({ req }) => listAudit(readQuery(req, Query)));
