import 'server-only';
import { Hackathon, notify, SavedEvent, User } from '@hackathonfinder/db';
import { formatDate, formatTime } from '@/lib/format';
import { sendEmail, siteUrl } from './email';

const DAY = 24 * 60 * 60 * 1000;

/**
 * Reminds students about saved or registered hackathons whose registration closes
 * within their reminder window (default 2 days). Each saved event is reminded once.
 */
export async function sendDeadlineReminders(now = new Date()): Promise<{ reminded: number; emailed: number }> {
  const due = await SavedEvent.find({ status: { $in: ['saved', 'registered'] }, remindedAt: null, remindDaysBefore: { $ne: null } }).limit(10_000).lean();
  if (!due.length) return { reminded: 0, emailed: 0 };

  const slugs = [...new Set(due.map((d) => d.hackathonSlug))];
  const events = new Map(
    (await Hackathon.find({ slug: { $in: slugs }, state: 'live', registrationDeadline: { $gt: now } }).select('slug title registrationDeadline').lean()).map((h) => [h.slug, h])
  );
  const userIds = [...new Set(due.map((d) => String(d.userId)))];
  const users = new Map(
    (await User.find({ _id: { $in: userIds }, deletedAt: null, banned: { $ne: true } }).select('name email emailVerified prefs').lean()).map((u) => [String(u._id), u])
  );

  let reminded = 0;
  let emailed = 0;
  for (const item of due) {
    const event = events.get(item.hackathonSlug);
    const user = users.get(String(item.userId));
    if (!event || !user) continue;
    const msLeft = event.registrationDeadline.getTime() - now.getTime();
    if (msLeft > (item.remindDaysBefore ?? 2) * DAY) continue;

    const when = `${formatDate(event.registrationDeadline.toISOString())}, ${formatTime(event.registrationDeadline.toISOString())} IST`;
    const href = `/hackathons/${event.slug}`;
    await notify(item.userId, 'deadline', `${event.title}: registration closes soon`, `Closes ${when}.`, href);
    if (user.email && user.emailVerified && user.prefs?.reminders !== false) {
      const ok = await sendEmail({
        to: user.email,
        subject: `Registration for ${event.title} closes soon`,
        text: `Hi ${user.name.split(' ')[0]},\n\nRegistration for ${event.title} closes ${when}. If you’re still planning to join, now’s the time.`,
        action: { label: 'Open the event', url: `${siteUrl()}${href}` },
      });
      if (ok) emailed++;
    }
    await SavedEvent.updateOne({ _id: item._id }, { $set: { remindedAt: now } });
    reminded++;
  }
  return { reminded, emailed };
}
