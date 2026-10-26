import 'server-only';
import { getServerSession, type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { connectDb, isDbConfigured, User, type Role } from '@hackathonfinder/db';
import { recordSignIn } from './analytics';
import { rateLimit } from './rateLimit';
import { checkPassword, grantsAdmin, uniqueHandle } from './users';

export interface SessionUser {
  id: string;
  handle: string;
  name: string;
  email: string;
  image?: string;
  role: Role;
}

declare module 'next-auth' {
  interface Session {
    user: SessionUser;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    uid?: string;
    handle?: string;
    role?: Role;
    /** When the account was last checked against the database (ms). */
    checkedAt?: number;
    /** The account's passwordChangedAt when this session signed in (ms; 0 = never changed). */
    pwdAt?: number;
  }
}

/** How often a signed-in session is re-checked, so a ban or a deleted account takes effect within a minute. */
const RECHECK_MS = 60_000;

/** bcrypt hash of a random string, compared against when no account matches. */
const DUMMY_HASH = '$2b$12$BHG6i1ZjLKkCB0P2eEQ3uexRyWbUXRGZQ0sA0YVU6niIbBhd9svXm';

/** Which sign-in buttons to show: OAuth providers only appear once their keys are set. */
export function enabledProviders() {
  return {
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    github: Boolean(process.env.GITHUB_ID && process.env.GITHUB_SECRET),
  };
}

function providers(): NextAuthOptions['providers'] {
  const list: NextAuthOptions['providers'] = [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and password',
      credentials: { email: { type: 'email' }, password: { type: 'password' } },
      async authorize(credentials, req) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? '';
        if (!email || !password) return null;
        // Password guessing: 10 tries per account and 30 per address every 15 minutes.
        const headers = (req?.headers ?? {}) as Record<string, string | undefined>;
        const ip = headers['x-real-ip'] || headers['x-forwarded-for']?.split(',')[0]?.trim() || 'local';
        if (!rateLimit(`login:${email}`, 10, 15 * 60_000) || !rateLimit(`login-ip:${ip}`, 30, 15 * 60_000)) {
          throw new Error('TooManyAttempts');
        }
        await connectDb();
        const user = await User.findOne({ email, deletedAt: null }).select('+passwordHash');
        if (!user?.passwordHash || user.isSample) {
          // Same work as a real check, so the response time doesn't reveal who has an account.
          await checkPassword(password, DUMMY_HASH);
          return null;
        }
        if (!(await checkPassword(password, user.passwordHash))) return null;
        // Only told after the right password, so it can't reveal who has an account.
        if (user.banned) throw new Error('AccountBanned');
        return { id: String(user._id), email: user.email, name: user.name, image: user.image };
      },
    }),
  ];
  const on = enabledProviders();
  if (on.google) {
    list.push(GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! }));
  }
  if (on.github) {
    list.push(
      GitHubProvider({
        clientId: process.env.GITHUB_ID!,
        clientSecret: process.env.GITHUB_SECRET!,
        // next-auth takes the primary email even when GitHub hasn't verified it. Only a
        // verified address may sign in to (or link with) the account that uses it.
        userinfo: {
          url: 'https://api.github.com/user',
          async request({ client, tokens }) {
            const profile = await client.userinfo(tokens.access_token!);
            const res = await fetch('https://api.github.com/user/emails', {
              headers: { Authorization: `token ${tokens.access_token}`, 'User-Agent': 'HackathonFinder' },
            });
            const emails: { email: string; primary: boolean; verified: boolean }[] = res.ok ? await res.json() : [];
            const verified = emails.find((e) => e.primary && e.verified) ?? emails.find((e) => e.verified);
            return { ...profile, email: verified?.email ?? null, email_verified: Boolean(verified) };
          },
        },
      })
    );
  }
  return list;
}

/** Whether Google or GitHub vouched for the email it sent. Anything else is treated as unverified. */
function providerVerifiedEmail(provider: string, profile: unknown): boolean {
  const p = (profile ?? {}) as { email_verified?: unknown };
  if (provider === 'google' || provider === 'github') return p.email_verified === true;
  return false;
}

/** Finds or creates the student for an OAuth sign-in, linking the provider to an existing email. */
async function upsertOAuthUser(input: { provider: string; providerAccountId: string; email?: string | null; name?: string | null; image?: string | null }) {
  await connectDb();
  const email = input.email?.toLowerCase() ?? undefined;
  let user =
    (await User.findOne({ 'providers.provider': input.provider, 'providers.providerAccountId': input.providerAccountId })) ??
    (email ? await User.findOne({ email }) : null);

  if (!user) {
    user = await User.create({
      email,
      emailVerified: email ? new Date() : null,
      name: input.name?.trim() || email?.split('@')[0] || 'Student',
      handle: await uniqueHandle(input.name || email?.split('@')[0] || 'student'),
      image: input.image ?? undefined,
      role: grantsAdmin({ email, emailVerified: email ? new Date() : null }) ? 'admin' : 'student',
      providers: [{ provider: input.provider, providerAccountId: input.providerAccountId }],
    });
    return user;
  }

  const linked = user.providers.some((p) => p.provider === input.provider && p.providerAccountId === input.providerAccountId);
  if (!linked) user.providers.push({ provider: input.provider, providerAccountId: input.providerAccountId });
  // The provider confirmed this email, so it counts as verified.
  if (email && user.email === email && !user.emailVerified) user.emailVerified = new Date();
  // The provider's photo only fills an empty profile the first time the account is linked,
  // so a student who removed their photo doesn't get it back on every sign-in.
  if (!linked && !user.image && input.image) user.image = input.image;
  if (grantsAdmin(user)) user.role = 'admin';
  await user.save();
  return user;
}

export const authOptions: NextAuthOptions = {
  providers: providers(),
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  // In development a fixed secret keeps sessions across restarts; production must set NEXTAUTH_SECRET.
  secret: process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV !== 'production' ? 'hackathonfinder-dev-secret-change-me' : undefined),
  pages: { signIn: '/login', error: '/login' },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!isDbConfigured()) return false;
      if (account && account.provider !== 'credentials') {
        const dbUser = await upsertOAuthUser({
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          // An unverified email would let anyone take over the account that uses it.
          email: providerVerifiedEmail(account.provider, profile) ? user.email : null,
          name: user.name,
          image: user.image,
        });
        if (dbUser.banned || dbUser.deletedAt) return false;
        // Hand the database id to the jwt callback.
        user.id = String(dbUser._id);
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      // On sign-in, whenever the client calls update() after a profile change, and at most once a
      // minute otherwise, so role changes, bans and deleted accounts reach existing sessions quickly.
      const stale = Boolean(token.uid) && Date.now() - (token.checkedAt ?? 0) > RECHECK_MS;
      if (user?.id || trigger === 'update' || stale) {
        const id = user?.id ?? token.uid;
        if (id) {
          await connectDb();
          const dbUser = await User.findById(id).lean();
          // A deleted or banned account stops being signed in at its next refresh.
          if (!dbUser || dbUser.deletedAt || dbUser.banned) return {};
          // A password change or reset ends sessions that signed in before it.
          const pwdAt = dbUser.passwordChangedAt ? new Date(dbUser.passwordChangedAt).getTime() : 0;
          if (user?.id) token.pwdAt = pwdAt;
          else if (pwdAt > (token.pwdAt ?? 0)) return {};
          token.uid = String(dbUser._id);
          token.handle = dbUser.handle;
          token.role = grantsAdmin(dbUser) ? 'admin' : dbUser.role;
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.picture = dbUser.image;
          token.checkedAt = Date.now();
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.uid ?? '',
        handle: token.handle ?? '',
        name: token.name ?? '',
        email: token.email ?? '',
        image: token.picture ?? undefined,
        role: token.role ?? 'student',
      };
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      if (!user?.id || !isDbConfigured()) return;
      await connectDb();
      const doc = await User.findById(user.id).select('email emailVerified').lean();
      // Confirmed ADMIN_EMAILS accounts are stored as admins too, so the admin pages and counts agree with the session.
      await User.updateOne({ _id: user.id }, { $set: { lastLoginAt: new Date(), ...(grantsAdmin(doc) ? { role: 'admin' } : {}) } });
      await recordSignIn(user.id, account?.provider).catch((err) => console.error('[auth] Could not record the sign-in:', err));
    },
  },
};

/** The signed-in student for this request, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ? session.user : null;
}
