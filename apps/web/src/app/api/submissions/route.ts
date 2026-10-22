import { NextResponse, type NextRequest } from 'next/server';
import { route } from '@/server/api';
import { siteUrl } from '@/server/email';
import { createSubmission, readSubmission } from '@/server/submissions';

// The browser extension posts from chrome-extension://<id> with the student's cookies.
// Set EXTENSION_IDS (comma-separated) to accept only our published extension.
function allowedOrigin(origin: string | null): string | null {
  if (!origin) return null;
  if (origin.startsWith('chrome-extension://')) {
    const ids = (process.env.EXTENSION_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    return !ids.length || ids.includes(origin.slice('chrome-extension://'.length)) ? origin : null;
  }
  try {
    return origin === new URL(siteUrl()).origin ? origin : null;
  } catch {
    return null;
  }
}

function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = allowedOrigin(req.headers.get('origin'));
  if (!origin) return { Vary: 'Origin' };
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
    ...(req.headers.get('access-control-request-private-network') === 'true' ? { 'Access-Control-Allow-Private-Network': 'true' } : {}),
  };
}

const submit = route(
  async ({ req, user, ip }) => createSubmission(await readSubmission(req), { user, ip }),
  { auth: 'optional', rate: { limit: 20, windowMs: 60 * 60 * 1000, key: 'submissions' } }
);

/**
 * "Submit a hackathon": a student's quick share (link, message or poster), the
 * organizer form, or the browser extension. Returns { id, status } where status is
 * "pending" (in the review queue) or "duplicate" (with hackathonSlug when it's live).
 */
export async function POST(req: NextRequest, context: { params: Record<string, string> }) {
  const res = await submit(req, context);
  for (const [key, value] of Object.entries(corsHeaders(req))) res.headers.set(key, value);
  return res;
}

export function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}
