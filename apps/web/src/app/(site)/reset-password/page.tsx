import type { Metadata } from 'next';
import AuthShell from '@/components/auth/AuthShell';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Choose a new password',
  robots: { index: false, follow: false },
  // The token is in the URL; don't send it on to other sites.
  referrer: 'no-referrer',
};

export default async function ResetPasswordPage(
  props: { searchParams: Promise<Record<string, string | string[] | undefined>> }
) {
  const searchParams = await props.searchParams;
  const token = Array.isArray(searchParams.token) ? searchParams.token[0] : searchParams.token;
  return (
    <AuthShell
      title="Fresh"
      accent="start"
      description="Pick a password you don’t use anywhere else. Longer is stronger."
    >
      <ResetPasswordForm token={token && token.length >= 10 ? token : null} />
    </AuthShell>
  );
}
