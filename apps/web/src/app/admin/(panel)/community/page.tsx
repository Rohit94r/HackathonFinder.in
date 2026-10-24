import type { Metadata } from 'next';
import Community from '@/components/admin/Community';
import { requireAdminPage } from '@/server/admin';

export const metadata: Metadata = { title: 'Community' };

export default async function Page() {
  await requireAdminPage();
  return <Community />;
}
