import 'server-only';
import { toPublicUser, User, type IRecord, type PublicUser, type ResultKind } from '@hackathonfinder/db';

export interface RecordItem {
  id: string;
  event: string;
  hackathonSlug?: string;
  result: ResultKind;
  project: string;
  date: string;
}

/** The signed-in student's own view of their account: public profile plus private bits. */
export interface Me extends PublicUser {
  email: string;
  emailVerified: boolean;
  onboarded: boolean;
  followedCities: string[];
  record: RecordItem[];
  hasPassword: boolean;
  providers: string[];
  prefs: { reminders: boolean; digest: boolean; teamEmails: boolean };
}

/** A hackathon record in API shape, newest first. */
export function recordItems(record: IRecord[] | undefined): RecordItem[] {
  return (record ?? [])
    .map((r) => ({
      id: String(r._id),
      event: r.event,
      hackathonSlug: r.hackathonSlug || undefined,
      result: r.result,
      project: r.project ?? '',
      date: new Date(r.date).toISOString(),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function loadMe(userId: string): Promise<Me | null> {
  const doc = await User.findById(userId).select('+passwordHash').lean();
  // A deleted account reads as signed out, even if an old session cookie is still around.
  if (!doc || doc.deletedAt) return null;
  return {
    ...toPublicUser(doc),
    email: doc.email ?? '',
    emailVerified: Boolean(doc.emailVerified),
    onboarded: Boolean(doc.onboarded),
    followedCities: doc.followedCities ?? [],
    record: recordItems(doc.record),
    hasPassword: Boolean(doc.passwordHash),
    providers: (doc.providers ?? []).map((p) => p.provider),
    prefs: {
      reminders: doc.prefs?.reminders !== false,
      digest: doc.prefs?.digest !== false,
      teamEmails: doc.prefs?.teamEmails !== false,
    },
  };
}
