import type { Metadata } from 'next';
import ReportsList from '@/components/admin/ReportsList';
import { requireAdminPage } from '@/server/admin';

export const metadata: Metadata = { title: 'Reports' };

export default async function Page() {
  await requireAdminPage();
  return <ReportsList />;
}
