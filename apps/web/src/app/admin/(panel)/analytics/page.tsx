import type { Metadata } from 'next';
import Analytics from '@/components/admin/Analytics';
import { requireAdminPage } from '@/server/admin';

export const metadata: Metadata = { title: 'Analytics' };

export default async function Page() {
  await requireAdminPage();
  return <Analytics />;
}
