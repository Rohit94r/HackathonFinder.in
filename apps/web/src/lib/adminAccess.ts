export const DEFAULT_ADMIN_EMAILS = ['rjdhav67@gmail.com'];

export function normalizeAdminEmails(raw?: string | null): string[] {
  const envEmails = (raw ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return [...new Set([...envEmails, ...DEFAULT_ADMIN_EMAILS])];
}

export function isAdminAccessEmail(email?: string | null): boolean {
  if (!email) return false;
  return normalizeAdminEmails(process.env.ADMIN_EMAILS).includes(email.trim().toLowerCase());
}

/** Being on the list grants admin only once the account's email is confirmed. */
export function grantsAdminAccess(doc?: { email?: string | null; emailVerified?: Date | null } | null): boolean {
  return Boolean(doc?.emailVerified) && isAdminAccessEmail(doc?.email);
}
