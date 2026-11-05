import { NextResponse, type NextRequest } from 'next/server';
import { getRates } from '@/server/rates';

export const dynamic = 'force-dynamic';

/**
 * The visitor's country (from the host's geo header; no IP is read or stored) and today's exchange
 * rates, so prizes and fees can be shown in their currency (components/CurrencyProvider.tsx).
 */
export async function GET(req: NextRequest) {
  const raw = (req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || '').toUpperCase();
  const country = /^[A-Z]{2}$/.test(raw) && raw !== 'XX' && raw !== 'T1' ? raw : null;
  const fx = await getRates();
  return NextResponse.json(
    { country, rates: fx?.rates ?? null, date: fx?.date ?? null },
    // Varies by visitor, so never cached by a CDN.
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}
