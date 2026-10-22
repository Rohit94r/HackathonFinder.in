import { NextResponse, type NextRequest } from 'next/server';
import { connectDb, Hackathon, isDbConfigured } from '@hackathonfinder/db';
import { createSampleHackathons } from '@hackathonfinder/shared';

/** "Register on official site": counts the click for the organizer, then sends the student there. */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  let url: string | undefined;
  if (isDbConfigured()) {
    await connectDb();
    const doc = await Hackathon.findOneAndUpdate({ slug: params.slug, state: 'live' }, { $inc: { 'stats.registerClicks': 1 } }, { new: false })
      .select('registrationUrl')
      .lean();
    url = doc?.registrationUrl;
  } else {
    url = createSampleHackathons(new Date()).find((h) => h.slug === params.slug)?.registrationUrl;
  }
  // Only ever redirect to http(s) links, never javascript: or relative tricks.
  if (!url || !/^https?:\/\//i.test(url)) return NextResponse.redirect(new URL(`/hackathons/${params.slug}`, req.nextUrl.origin));
  return NextResponse.redirect(url, 302);
}
