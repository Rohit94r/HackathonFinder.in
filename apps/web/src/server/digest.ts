import 'server-only';
import crypto from 'node:crypto';
import { cityName, isRegistrationOpen, themeName } from '@hackathonfinder/shared';
import { DigestSubscriber, type IDigestSubscriber } from '@hackathonfinder/db';
import { deadlineLabel, formatDateRange, formatPrizeShort } from '@/lib/format';
import type { HackathonView } from '@/lib/hackathons';
import { sendEmail, siteUrl } from './email';
import { getHackathons } from './hackathons';

const DAY = 24 * 60 * 60 * 1000;
const MAX_ITEMS = 8;

export const newDigestToken = () => crypto.randomBytes(24).toString('base64url');

export async function sendDigestConfirmation(sub: Pick<IDigestSubscriber, 'email' | 'token'>) {
  await sendEmail({
    to: sub.email,
    subject: 'Confirm your HackathonFinder weekly digest',
    text: 'One click and you’ll get the best open hackathons every Monday: new events, deadlines closing soon, and ones near your cities.',
    action: { label: 'Yes, send me the digest', url: `${siteUrl()}/api/digest/confirm?token=${sub.token}` },
  });
}

/** Open events for one subscriber: their cities and themes first, then new and closing-soon ones. */
export function pickForSubscriber(items: HackathonView[], sub: Pick<IDigestSubscriber, 'cities' | 'themes'>, now: Date): HackathonView[] {
  const open = items.filter((h) => isRegistrationOpen(h.status));
  const score = (h: HackathonView) =>
    (sub.cities.length && h.city && sub.cities.includes(h.city) ? 4 : 0) +
    (h.mode !== 'offline' ? 1 : 0) +
    (sub.themes.length && h.themes.some((t) => sub.themes.includes(t)) ? 3 : 0) +
    (now.getTime() - Date.parse(h.addedAt) < 7 * DAY ? 2 : 0) +
    (h.daysToDeadline <= 7 ? 2 : 0) +
    (h.featured ? 1 : 0);
  return open
    .map((h) => ({ h, s: score(h) }))
    .sort((a, b) => b.s - a.s || a.h.daysToDeadline - b.h.daysToDeadline)
    .slice(0, MAX_ITEMS)
    .map(({ h }) => h);
}

function digestText(items: HackathonView[]): string {
  return items
    .map((h) => {
      const where = h.mode === 'online' ? 'Online' : `${cityName(h.city)} · ${h.mode}`;
      const themes = h.themes.slice(0, 2).map(themeName).join(', ');
      return `${h.title}\n${where} · ${formatDateRange(h.startDate, h.endDate)} · ${formatPrizeShort(h.prizePool, h.prizeCurrency)} · ${themes}\n${deadlineLabel(h.daysToDeadline)} → ${siteUrl()}/hackathons/${h.slug}`;
    })
    .join('\n\n');
}

/** Sends this week's digest to every confirmed subscriber who hasn't had one in 6 days. */
export async function sendWeeklyDigest(now = new Date()): Promise<{ sent: number; skipped: number }> {
  const { items } = await getHackathons(now);
  const subs = await DigestSubscriber.find({
    confirmedAt: { $ne: null },
    unsubscribedAt: null,
    $or: [{ lastSentAt: null }, { lastSentAt: { $lt: new Date(now.getTime() - 6 * DAY) } }],
  }).limit(5000);
  let sent = 0;
  let skipped = 0;
  for (const sub of subs) {
    const picks = pickForSubscriber(items, sub, now);
    if (!picks.length) {
      skipped++;
      continue;
    }
    const ok = await sendEmail({
      to: sub.email,
      subject: `${picks.length} hackathons for you this week`,
      text: `Here’s what’s open right now, picked for you.\n\n${digestText(picks)}\n\nDon’t want these? Unsubscribe: ${siteUrl()}/api/digest/unsubscribe?token=${sub.token}`,
      action: { label: 'See all hackathons', url: `${siteUrl()}/hackathons` },
    });
    if (ok) {
      sub.lastSentAt = now;
      await sub.save();
      sent++;
    }
  }
  return { sent, skipped };
}
