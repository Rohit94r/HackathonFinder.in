import type { Metadata } from 'next';
import AuthShell from '@/components/auth/AuthShell';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Forgot password',
  description: 'Get a link to choose a new HackathonFinder password.',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const email = Array.isArray(searchParams.email) ? searchParams.email[0] : searchParams.email;
  return (
    <AuthShell
      title="No"
      accent="worries"
      description="We’ll email you a link to choose a new password. Your saved hackathons and profile stay just as they are."
    >
      <ForgotPasswordForm initialEmail={(email ?? '').slice(0, 200)} />
    </AuthShell>
  );
}
