// Showing prizes and fees in the visitor's currency. Rates are per 1 US dollar, from the European
// Central Bank via our own API (server/rates.ts, app/api/locale), so this file stays client-safe.

/** Where a visitor's own currency choice is kept (localStorage); absent means "detect it". */
export const CURRENCY_KEY = 'hf_currency';

export type Rates = Record<string, number>;

/** Currencies we can convert to (the ECB's daily reference rates), for the footer picker. */
export const CURRENCIES = [
  'INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD', 'SGD', 'JPY', 'CNY', 'HKD', 'KRW', 'IDR', 'MYR', 'PHP', 'THB',
  'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'ISK', 'TRY', 'BRL', 'MXN', 'ZAR', 'ILS',
] as const;

const EURO_COUNTRIES = ['AT', 'BE', 'BG', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK', 'AD', 'MC', 'SM', 'VA', 'ME', 'XK'];
const BY_COUNTRY: Record<string, string> = {
  IN: 'INR', US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD', NZ: 'NZD', SG: 'SGD', JP: 'JPY', CN: 'CNY', HK: 'HKD',
  KR: 'KRW', ID: 'IDR', MY: 'MYR', PH: 'PHP', TH: 'THB', CH: 'CHF', LI: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK',
  PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON', IS: 'ISK', TR: 'TRY', BR: 'BRL', MX: 'MXN', ZA: 'ZAR', IL: 'ILS',
  ...Object.fromEntries(EURO_COUNTRIES.map((c) => [c, 'EUR'])),
};

/** The currency for a two-letter country code; US dollars where we have no rate for the local one. */
export function currencyForCountry(country: string | null | undefined, rates?: Rates | null): string {
  const currency = (country && BY_COUNTRY[country.toUpperCase()]) || 'USD';
  return !rates || rates[currency] ? currency : 'USD';
}

/** The country in the browser's language settings ("en-IN" gives IN), used when the host doesn't say. */
export function countryFromLanguages(languages: readonly string[]): string | null {
  for (const lang of languages) {
    const m = lang.match(/-([A-Za-z]{2})$/);
    if (m) return m[1].toUpperCase();
  }
  return null;
}

/** `amount` from one currency to another, or null when either rate is missing. */
export function convert(amount: number, from: string, to: string, rates: Rates): number | null {
  if (from === to) return amount;
  const a = rates[from];
  const b = rates[to];
  return a && b ? (amount / a) * b : null;
}

/** Two significant figures, for thresholds like "$530+" rather than "$529.48+". */
export function roundNice(n: number): number {
  if (n <= 0) return 0;
  const p = 10 ** Math.max(0, Math.floor(Math.log10(n)) - 1);
  return Math.round(n / p) * p;
}

/**
 * "₹1.5L" / "₹1,50,000" for rupees (Indian grouping), "$45K" / "€1,600" for the rest. Compact for
 * cards and stats, full for a hackathon's own page.
 */
export function formatCurrency(amount: number, currency: string, { compact = false }: { compact?: boolean } = {}): string {
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  // Compact keeps Intl's own rounding ("$1.6K", "$339K", "₹3.2Cr"); full amounts drop the paise and cents.
  return compact
    ? new Intl.NumberFormat(locale, { style: 'currency', currency, notation: 'compact' }).format(amount)
    : new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}
