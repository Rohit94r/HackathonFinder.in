import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const FREE_HACKATHON_PAGES = 5;
const VIEW_COOKIE = 'hf_free_hackathon_pages';

/** Admin response headers and the five-page anonymous limit for hackathon details. */
export async function middleware(req: NextRequest) {
  const isAdmin = req.nextUrl.pathname.startsWith('/admin') || req.nextUrl.pathname.startsWith('/api/admin');
  const isHackathonPage = /^\/hackathons\/[^/]+\/?$/.test(req.nextUrl.pathname);

  if (isHackathonPage) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV !== 'production' ? 'hackathonfinder-dev-secret-change-me' : undefined) });
    const isCrawler = /bot|crawler|spider|slurp|bingpreview/i.test(req.headers.get('user-agent') ?? '');
    if (!token?.uid && !isCrawler) {
      const opened = Number.parseInt(req.cookies.get(VIEW_COOKIE)?.value ?? '0', 10) || 0;
      if (opened >= FREE_HACKATHON_PAGES) {
        const login = new URL('/login', req.url);
        login.searchParams.set('next', `${req.nextUrl.pathname}${req.nextUrl.search}`);
        login.searchParams.set('reason', 'details-limit');
        return NextResponse.redirect(login);
      }
      const res = NextResponse.next();
      res.cookies.set(VIEW_COOKIE, String(opened + 1), { httpOnly: true, sameSite: 'lax', secure: req.nextUrl.protocol === 'https:', path: '/', maxAge: 60 * 60 * 24 * 30 });
      return res;
    }
    return NextResponse.next();
  }

  if (!isAdmin) return NextResponse.next();
  const headers = new Headers(req.headers);
  // Always overwritten here, so a visitor can't supply their own.
  headers.set('x-hf-admin-path', `${req.nextUrl.pathname}${req.nextUrl.search}`.slice(0, 500));
  const res = NextResponse.next({ request: { headers } });
  res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.headers.set('Cache-Control', 'no-store, max-age=0');
  return res;
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/admin', '/api/admin/:path*', '/hackathons/:path*'],
};
