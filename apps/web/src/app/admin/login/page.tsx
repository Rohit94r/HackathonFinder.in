import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AdminLogin from '@/components/admin/AdminLogin';
import { currentAdmin, safeAdminNext } from '@/server/admin';
import { enabledProviders, getSessionUser } from '@/server/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Sign in' };

type Search = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;

/** The admin sign-in. Admins who are already signed in go straight in. */
export default async function AdminLoginPage(props: { searchParams: Promise<Search> }) {
  const searchParams = await props.searchParams;
  const next = safeAdminNext(searchParams.next) ?? '/admin';
  const user = await getSessionUser();
  if (user && (await currentAdmin())) redirect(next);
  return (
    <AdminLogin
      next={next}
      denied={Boolean(user)}
      autoSignOut={Boolean(user) && one(searchParams.via) === 'oauth'}
      providers={enabledProviders()}
      error={one(searchParams.error)}
    />
  );
}
