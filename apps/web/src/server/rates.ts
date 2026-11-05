import 'server-only';
import { unstable_cache } from 'next/cache';
import type { Rates } from '@/lib/currency';

/**
 * Daily reference rates per 1 US dollar, from the European Central Bank via Frankfurter (free, no
 * key). Fetched by our server and cached for 12 hours, so visitors' browsers never contact it.
 */
const loadRates = unstable_cache(
  async (): Promise<{ date: string; rates: Rates }> => {
    const res = await fetch('https://api.frankfurter.dev/v1/latest?base=USD', { signal: AbortSignal.timeout(5000), cache: 'no-store' });
    if (!res.ok) throw new Error(`Exchange rates: HTTP ${res.status}`);
    const json = (await res.json()) as { date: string; rates: Rates };
    return { date: json.date, rates: { ...json.rates, USD: 1 } };
  },
  ['fx-rates-v1'],
  { revalidate: 43200 }
);

/** The rates, or null when they can't be fetched; amounts then stay in their own currency. */
export async function getRates(): Promise<{ date: string; rates: Rates } | null> {
  try {
    return await loadRates();
  } catch {
    return null;
  }
}
