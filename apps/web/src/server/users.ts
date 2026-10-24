import 'server-only';
import bcrypt from 'bcryptjs';
import { slugify, User } from '@hackathonfinder/db';

const RESERVED_HANDLES = new Set([
  'admin', 'api', 'login', 'signup', 'logout', 'settings', 'profile', 'me', 'u', 'new', 'edit', 'help', 'support',
  'hackathonfinder', 'about', 'team', 'teams', 'community', 'wins', 'cities', 'submit', 'organizers', 'null', 'undefined',
]);

/** A free handle based on the name or email, e.g. "yash-desai", "yash-desai-2". */
export async function uniqueHandle(base: string): Promise<string> {
  const root = (slugify(base, 26) || 'student').replace(/^-+|-+$/g, '').slice(0, 26) || 'student';
  const start = RESERVED_HANDLES.has(root) ? `${root}-hf` : root;
  for (let i = 1; i <= 50; i++) {
    const candidate = i === 1 ? start : `${start}-${i}`;
    if (!(await User.exists({ handle: candidate }))) return candidate;
  }
  return `${start}-${Math.random().toString(36).slice(2, 6)}`;
}

export function isReservedHandle(handle: string): boolean {
  return RESERVED_HANDLES.has(handle);
}

/** The emails in ADMIN_EMAILS (comma-separated), lowercased. */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Emails in ADMIN_EMAILS get the admin role when they sign up or sign in. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export const checkPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

/** At least 8 characters with a letter and a number. */
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return 'Use at least 8 characters.';
  if (password.length > 128) return 'Use at most 128 characters.';
  if (!/[a-z]/i.test(password) || !/\d/.test(password)) return 'Use at least one letter and one number.';
  return null;
}
