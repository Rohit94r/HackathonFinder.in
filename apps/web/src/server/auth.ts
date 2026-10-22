import 'server-only';
import { getServerSession, type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { connectDb, isDbConfigured, User, type Role } from '@hackathonfinder/db';
import { checkPassword, isAdminEmail, uniqueHandle } from './users';

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
  }
}

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
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? '';
        if (!email || !password) return null;
        await connectDb();
        const user = await User.findOne({ email, deletedAt: null }).select('+passwordHash');
        if (!user?.passwordHash || user.isSample) return null;
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
    list.push(GitHubProvider({ clientId: process.env.GITHUB_ID!, clientSecret: process.env.GITHUB_SECRET! }));
  }
  return list;
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
      role: isAdminEmail(email) ? 'admin' : 'student',
      providers: [{ provider: input.provider, providerAccountId: input.providerAccountId }],
    });
    return user;
  }

  const linked = user.providers.some((p) => p.provider === input.provider && p.providerAccountId === input.providerAccountId);
  if (!linked) user.providers.push({ provider: input.provider, providerAccountId: input.providerAccountId });
  // The provider confirmed this email, so it counts as verified.
  if (email && user.email === email && !user.emailVerified) user.emailVerified = new Date();
  if (!user.image && input.image) user.image = input.image;
  if (isAdminEmail(user.email)) user.role = 'admin';
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
    async signIn({ user, account }) {
      if (!isDbConfigured()) return false;
      if (account && account.provider !== 'credentials') {
        const dbUser = await upsertOAuthUser({
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          email: user.email,
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
      // On sign-in, and whenever the client calls update() after a profile change.
      if (user?.id || trigger === 'update') {
        const id = user?.id ?? token.uid;
        if (id) {
          await connectDb();
          const dbUser = await User.findById(id).lean();
          // A deleted or banned account stops being signed in at its next refresh.
          if (!dbUser || dbUser.deletedAt || dbUser.banned) return {};
          token.uid = String(dbUser._id);
          token.handle = dbUser.handle;
          token.role = isAdminEmail(dbUser.email) ? 'admin' : dbUser.role;
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.picture = dbUser.image;
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
    async signIn({ user }) {
      if (!user?.id || !isDbConfigured()) return;
      await connectDb();
      await User.updateOne({ _id: user.id }, { $set: { lastLoginAt: new Date() } });
    },
  },
};

/** The signed-in student for this request, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ? session.user : null;
}
