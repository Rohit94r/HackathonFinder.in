import { NextResponse, type NextRequest } from 'next/server';

/**
 * Only runs for the admin area. Search engines are told to stay out (X-Robots-Tag),
 * nothing is cached, and the requested path is passed to the admin layout so a
 * signed-out visitor can be sent back to it after signing in.
 */
export function middleware(req: NextRequest) {
  const headers = new Headers(req.headers);
  // Always overwritten here, so a visitor can't supply their own.
  headers.set('x-hf-admin-path', `${req.nextUrl.pathname}${req.nextUrl.search}`.slice(0, 500));
  const res = NextResponse.next({ request: { headers } });
  res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.headers.set('Cache-Control', 'no-store, max-age=0');
  return res;
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/admin', '/api/admin/:path*'],
};
