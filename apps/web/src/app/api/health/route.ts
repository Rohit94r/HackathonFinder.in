import { NextResponse } from 'next/server';
import { connectDb, Hackathon, isDbConfigured, User } from '@hackathonfinder/db';
import { isAiEnabled } from '@hackathonfinder/ai';
import { enabledProviders } from '@/server/auth';
import { storageMode } from '@/server/storage';

/** What's connected: database, AI, email, image storage and sign-in providers. No secrets. */
export async function GET() {
  let db: 'connected' | 'not-configured' | 'error' = 'not-configured';
  let counts: Record<string, number> | undefined;
  if (isDbConfigured()) {
    try {
      await connectDb();
      const [live, pending, students] = await Promise.all([
        Hackathon.countDocuments({ state: 'live' }),
        Hackathon.countDocuments({ state: 'pending' }),
        User.countDocuments({ isSample: false }),
      ]);
      db = 'connected';
      counts = { live, pending, students };
    } catch {
      db = 'error';
    }
  }
  return NextResponse.json({
    ok: db === 'connected',
    db,
    counts,
    ai: isAiEnabled(),
    email: Boolean(process.env.RESEND_API_KEY),
    storage: storageMode(),
    signIn: { email: true, ...enabledProviders() },
  });
}
