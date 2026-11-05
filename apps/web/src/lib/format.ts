import { APPROX_INR_PER_USD, type Currency } from '@hackathonfinder/shared';

// Day labels use a fixed locale and the listings' home time zone, so server and browser render the
// same text. Exact times go through <LocalTime>, which shows each visitor their own zone.
const TZ = 'Asia/Kolkata';

const dayMonth = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: TZ });
const dayMonthYear = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: TZ,
});
const weekdayDate = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: TZ,
});
const time = new Intl.DateTimeFormat('en-GB', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: TZ,
});
const monthYear = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: TZ });

export function formatDay(iso: string): string {
  return dayMonth.format(new Date(iso));
}

export function formatDate(iso: string): string {
  return dayMonthYear.format(new Date(iso));
}

export function formatWeekday(iso: string): string {
  return weekdayDate.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return time.format(new Date(iso)).toUpperCase();
}

export function formatMonthYear(date: Date): string {
  return monthYear.format(date);
}

/** "14–15 Nov" or "14 Nov" for single-day events. */
export function formatDateRange(startIso: string, endIso: string): string {
  const start = formatDay(startIso);
  const end = formatDay(endIso);
  if (start === end) return start;
  const [sDay, sMonth] = start.split(' ');
  const [eDay, eMonth] = end.split(' ');
  return sMonth === eMonth ? `${sDay}–${eDay} ${eMonth}` : `${start} – ${end}`;
}

export function formatMoney(amount: number, currency: Currency): string {
  if (currency === 'USD') return `$${amount.toLocaleString('en-US')}`;
  return `₹${amount.toLocaleString('en-US')}`;
}

/** "≈ $1,190" for a rupee amount, so visitors outside India can size it up; nothing for dollars. */
export function approxUsd(amount: number, currency: Currency): string | undefined {
  if (currency === 'USD' || amount <= 0) return undefined;
  const usd = amount / APPROX_INR_PER_USD;
  return `≈ $${(usd >= 100 ? Math.round(usd / 10) * 10 : Math.round(usd)).toLocaleString('en-US')}`;
}

/** When the source doesn't say: we never guess a prize or a team size. */
export const ON_OFFICIAL_PAGE = 'On the official page';

/** Compact amount in international notation: 1.5M, 75K, 900. */
function compact(amount: number): string {
  if (amount >= 1e6) return `${trim(Math.round(amount / 1e5) / 10)}M`;
  if (amount >= 1000) return `${trim(Math.round(amount / 100) / 10)}K`;
  return String(Math.round(amount));
}

/** Short prize label for cards in the prize's own currency, e.g. "₹150K", "$5K", "₹1.2M"; an unknown prize says where to look. */
export function formatPrizeShort(amount: number, currency: Currency): string {
  if (amount <= 0) return `Prizes: ${ON_OFFICIAL_PAGE.toLowerCase()}`;
  return `${currency === 'USD' ? '$' : '₹'}${compact(amount)}`;
}

/** A large rupee total shown in US dollars for stats: "$3.8M". */
export function formatUsdCompact(inr: number): string {
  return `$${compact(inr / APPROX_INR_PER_USD)}`;
}

function trim(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/** "Solo or up to 4"; `known` is false when the source never stated a team size. */
export function formatTeamSize(min: number, max: number, known = true): string {
  if (!known) return `Team size: ${ON_OFFICIAL_PAGE.toLowerCase()}`;
  if (max === 1) return 'Solo';
  if (min === max) return `Team of ${min}`;
  return min === 1 ? `Solo or up to ${max}` : `${min}–${max} members`;
}

/** "12 km", rounded because stored locations are only accurate to about 1 km. */
export function formatKm(km: number): string {
  return km < 1 ? 'Under 1 km' : `${Math.round(km).toLocaleString('en-US')} km`;
}

export function deadlineLabel(days: number): string {
  if (days < 0) return 'Registration closed';
  if (days === 0) return 'Closes today';
  if (days === 1) return 'Closes tomorrow';
  return `Closes in ${days} days`;
}

/** "2 hours ago"-style label relative to `nowIso`. */
export function timeAgo(iso: string, nowIso: string): string {
  const mins = Math.max(0, Math.round((Date.parse(nowIso) - Date.parse(iso)) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}
