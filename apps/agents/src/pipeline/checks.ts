import { hostOf } from '../text';
import type { LinkCheck } from '../http';
import type { Draft } from './draft';

// Rule-based trust checks. Flags stay visible to admins and users, but discoveries publish automatically.

const SHORTENERS = new Set(['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'rb.gy', 'cutt.ly', 'is.gd', 'ow.ly', 'buff.ly', 'shorturl.at', 'tiny.cc', 'lnkd.in', 'rebrand.ly', 't.ly', 'bl.ink', 'shorte.st']);
const PAYMENT_HOSTS = /(^|\.)(rzp\.io|razorpay\.me|pages\.razorpay\.com|paytm\.me|p\.paytm\.me|instamojo\.com|imjo\.in|paypal\.me|cashfree\.com|payu\.in|phonepe\.com|gpay\.app\.goo\.gl)$/;
const SPAM_WORDS = /\b(earn money|work from home|guaranteed (prize|winning|placement)|airdrop|giveaway|lottery|investment plan|refer and earn)\b/i;

/** INR above this (₹5 crore) or USD above $1M is unusual enough for a person to check. */
const MAX_PRIZE_INR = 5_00_00_000;
const MAX_PRIZE_USD = 1_000_000;
const HIGH_FEE_INR = 2000;

export function suspiciousFlags(d: Draft): string[] {
  const flags: string[] = [];
  if (d.fee > HIGH_FEE_INR) flags.push(`High entry fee (₹${d.fee.toLocaleString('en-IN')})`);
  const host = d.registrationUrl ? hostOf(d.registrationUrl) : '';
  if (SHORTENERS.has(host)) flags.push('Registration link is a URL shortener');
  if (PAYMENT_HOSTS.test(host) || d.registrationUrl?.startsWith('upi:')) flags.push('Registration link is a payment page');
  if ((d.prizeCurrency === 'USD' && d.prizePool > MAX_PRIZE_USD) || (d.prizeCurrency === 'INR' && d.prizePool > MAX_PRIZE_INR)) {
    flags.push('Prize amount looks unusually large; check it');
  }
  if (SPAM_WORDS.test(d.title)) flags.push('Title looks like spam');
  return flags;
}

/** Flag for a registration link check, or null when the link works (or we couldn't tell). */
export function linkFlag(check: LinkCheck): string | null {
  if (check.ok !== false) return null;
  return `Registration link is broken (${check.reason ?? `HTTP ${check.status}`})`;
}

/** Flags the verifier owns, so a later check can clear them when the link works again. */
export const LINK_FLAG_PREFIX = 'Registration link is broken';
