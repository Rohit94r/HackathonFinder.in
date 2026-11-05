import { NextResponse, type NextRequest } from 'next/server';
import { connectDb, Hackathon, isDbConfigured } from '@hackathonfinder/db';
import { recordRegisterClick } from '@/server/analytics';
import { getSessionUser } from '@/server/auth';

/** "Register on official site": counts the click for the organizer, then sends the student there. */
export async function GET(req: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  let url: string | undefined;
  if (isDbConfigured()) {
    await connectDb();
    const doc = await Hackathon.findOneAndUpdate({ slug: params.slug, state: 'live' }, { $inc: { 'stats.registerClicks': 1 } }, { new: false })
      .select('registrationUrl')
      .lean();
    url = doc?.registrationUrl;
    if (doc) {
      // For the admin analytics (who clicked through, from which page). Never blocks the redirect on failure.
      try {
        const user = await getSessionUser().catch(() => null);
        await recordRegisterClick(req, params.slug, user?.id);
      } catch (err) {
        console.error('[go] Could not record the register click:', err);
      }
    }
  }
  // Only ever redirect to http(s) links, never javascript: or relative tricks.
  if (!url || !/^https?:\/\//i.test(url)) return NextResponse.redirect(new URL(`/hackathons/${params.slug}`, req.nextUrl.origin));
  return NextResponse.redirect(url, 302);
}
