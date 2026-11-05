import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z, type ZodType } from 'zod';
import { connectDb, DbNotConfiguredError, isDbConfigured, User } from '@hackathonfinder/db';
import { getSessionUser, type SessionUser } from './auth';
import { rateLimit } from './rateLimit';

/** An error that becomes a JSON response: { error: { code, message, fields? } }. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>
  ) {
    super(message);
  }
}

export const badRequest = (message: string, fields?: Record<string, string>) => new ApiError(400, 'bad_request', message, fields);
export const unauthorized = () => new ApiError(401, 'unauthorized', 'Please sign in to do that.');
export const forbidden = (message = 'You can’t do that.') => new ApiError(403, 'forbidden', message);
export const notFound = (what = 'That') => new ApiError(404, 'not_found', `${what} wasn’t found.`);
export const conflict = (message: string) => new ApiError(409, 'conflict', message);

type Auth = 'none' | 'optional' | 'required' | 'admin';

interface Options {
  auth?: Auth;
  /** e.g. { limit: 10, windowMs: 60_000 } per user (or IP when signed out). */
  rate?: { limit: number; windowMs: number; key?: string };
}

export interface Ctx<P = Record<string, string>> {
  req: NextRequest;
  params: P;
  user: SessionUser | null;
  ip: string;
}

type Handler<P> = (ctx: Ctx<P>) => Promise<unknown>;

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Banned accounts can't post or change anything; deleted ones are signed out. */
async function assertActive(userId: string, allowBanned = false): Promise<void> {
  if (!/^[a-f0-9]{24}$/i.test(userId)) throw unauthorized();
  const doc = await User.findById(userId).select('banned deletedAt').lean();
  if (!doc || doc.deletedAt) throw new ApiError(401, 'unauthorized', 'Please sign in again.');
  if (doc.banned && !allowBanned) throw new ApiError(403, 'account_banned', 'Your account is suspended, so it can’t post or change anything.');
}

/**
 * The visitor's address. X-Real-IP comes first: Vercel and a typical nginx set it from the
 * connection, while the first X-Forwarded-For entry can be typed by the visitor.
 */
export function clientIp(req: NextRequest): string {
  return req.headers.get('x-real-ip')?.trim() || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
}

/** Converts ObjectIds and Dates so responses are plain JSON. */
export function toJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_k, v) => (v && typeof v === 'object' && v._bsontype === 'ObjectId' ? String(v) : v)));
}

/**
 * Wraps a route handler: connects to the database, checks sign-in, applies rate
 * limits, and turns errors into consistent JSON. Return a value to send it as JSON,
 * or a Response to send it as-is.
 */
export function route<P = Record<string, string>>(handler: Handler<P>, options: Options = {}) {
  const auth = options.auth ?? 'optional';
  // Next 15 passes route params as a Promise; handlers get them resolved.
  return async (req: NextRequest, context: { params: Promise<P> }) => {
    try {
      if (!isDbConfigured()) throw new DbNotConfiguredError();
      await connectDb();
      const user = auth === 'none' ? null : await getSessionUser();
      if ((auth === 'required' || auth === 'admin') && !user) throw unauthorized();
      if (auth === 'admin' && user?.role !== 'admin') throw forbidden('This is for admins only.');
      // Sessions outlive a ban or a deleted account, so changes check the account itself.
      // A banned student may still delete their own account.
      if (user && !SAFE_METHODS.has(req.method)) await assertActive(user.id, req.method === 'DELETE' && req.nextUrl.pathname === '/api/me');
      const ip = clientIp(req);
      if (options.rate) {
        const key = `${options.rate.key ?? req.nextUrl.pathname}:${user?.id ?? ip}`;
        if (!rateLimit(key, options.rate.limit, options.rate.windowMs)) {
          throw new ApiError(429, 'rate_limited', 'You’re doing that too often. Try again in a minute.');
        }
      }
      const params = (context?.params ? await context.params : undefined) ?? ({} as P);
      const result = await handler({ req, params, user, ip });
      if (result instanceof Response) return result;
      return NextResponse.json(toJson(result ?? { ok: true }));
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export function errorResponse(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: { code: err.code, message: err.message, fields: err.fields } }, { status: err.status });
  }
  if (err instanceof DbNotConfiguredError) {
    return NextResponse.json(
      { error: { code: 'db_not_configured', message: 'The database isn’t connected yet. Accounts and posting need it.' } },
      { status: 503 }
    );
  }
  if (err && typeof err === 'object' && 'code' in err && (err as { code: unknown }).code === 11000) {
    return NextResponse.json({ error: { code: 'conflict', message: 'That already exists.' } }, { status: 409 });
  }
  console.error('[api] Unexpected error:', err);
  return NextResponse.json({ error: { code: 'server_error', message: 'Something went wrong on our side. Please try again.' } }, { status: 500 });
}

function zodFields(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

/** Validates the JSON body; 400 with per-field messages when it doesn't match. */
export async function readBody<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw badRequest('Send the details as JSON.');
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw badRequest('Some details need fixing.', zodFields(parsed.error));
  return parsed.data;
}

/** Validates query-string parameters. */
export function readQuery<T>(req: NextRequest, schema: ZodType<T>): T {
  const raw: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((v, k) => (raw[k] = v));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw badRequest('Some filters need fixing.', zodFields(parsed.error));
  return parsed.data;
}

export const objectId = z.string().regex(/^[a-f0-9]{24}$/i, 'Not a valid id.');
