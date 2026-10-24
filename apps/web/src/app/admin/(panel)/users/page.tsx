import type { Metadata } from 'next';
import UsersTable from '@/components/admin/UsersTable';
import { requireAdminPage } from '@/server/admin';

export const metadata: Metadata = { title: 'Users' };

export default async function Page() {
  await requireAdminPage();
  return <UsersTable />;
}
