import type { Types } from 'mongoose';
import { Activity, Notification, type ActivityType, type INotification } from '../models/student';

type Id = Types.ObjectId | string;

/** Records something a student did; it feeds their heatmap, streaks and badges. Never throws. */
export async function logActivity(userId: Id, type: ActivityType, label: string, href?: string): Promise<void> {
  try {
    await Activity.create({ userId, type, label: label.slice(0, 200), href, at: new Date() });
  } catch (err) {
    console.error('[activity] could not log', type, err);
  }
}

/** In-app notification, e.g. "Sneha asked to join your team". Never throws. */
export async function notify(
  userId: Id,
  type: INotification['type'],
  title: string,
  body = '',
  href?: string
): Promise<void> {
  try {
    await Notification.create({ userId, type, title: title.slice(0, 160), body: body.slice(0, 500), href });
  } catch (err) {
    console.error('[notify] could not notify', type, err);
  }
}
