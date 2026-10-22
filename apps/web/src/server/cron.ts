import 'server-only';
import crypto from 'node:crypto';
import type { NextRequest } from 'next/server';
import { ApiError } from './api';

/**
 * Scheduled jobs call with `Authorization: Bearer <CRON_SECRET>` (Vercel Cron sends
 * exactly this) or `?secret=`. Without CRON_SECRET, jobs only run in development.
 */
export function assertCron(req: NextRequest): void {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') throw new ApiError(503, 'cron_not_configured', 'Set CRON_SECRET to run scheduled jobs.');
    return;
  }
  const given = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? req.nextUrl.searchParams.get('secret') ?? '';
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new ApiError(401, 'unauthorized', 'Wrong cron secret.');
}
