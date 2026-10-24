import type { Metadata } from 'next';
import Dashboard from '@/components/admin/Dashboard';
import { requireAdminPage } from '@/server/admin';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function Page() {
  await requireAdminPage();
  return <Dashboard />;
}
