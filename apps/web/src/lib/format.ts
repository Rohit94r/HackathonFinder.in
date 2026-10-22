import type { Currency } from '@hackathonfinder/shared';

// Fixed locale and time zone so server and browser render the same text.
const TZ = 'Asia/Kolkata';

const dayMonth = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: TZ });
const dayMonthYear = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: TZ,
});
const weekdayDate = new Intl.DateTimeFormat('en-IN', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: TZ,
});
const time = new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: TZ,
});
const monthYear = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric', timeZone: TZ });

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
  return `₹${amount.toLocaleString('en-IN')}`;
}

/** Short prize label for cards, e.g. "₹1L", "₹75K", "$5K". */
export function formatPrizeShort(amount: number, currency: Currency): string {
  if (amount <= 0) return 'Swag & certificates';
  if (currency === 'USD') {
    return amount >= 1000 ? `$${trim(amount / 1000)}K` : `$${amount}`;
  }
  if (amount >= 100000) return `₹${trim(amount / 100000)}L`;
  if (amount >= 1000) return `₹${trim(amount / 1000)}K`;
  return `₹${amount}`;
}

function trim(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function formatTeamSize(min: number, max: number): string {
  if (max === 1) return 'Solo';
  if (min === max) return `Team of ${min}`;
  return min === 1 ? `Solo or up to ${max}` : `${min}–${max} members`;
}

/** "12 km", rounded because stored locations are only accurate to about 1 km. */
export function formatKm(km: number): string {
  return km < 1 ? 'Under 1 km' : `${Math.round(km).toLocaleString('en-IN')} km`;
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
