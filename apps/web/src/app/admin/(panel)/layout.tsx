import AdminShell from '@/components/admin/AdminShell';
import { requireAdminPage } from '@/server/admin';

export const dynamic = 'force-dynamic';

/** Every admin page except sign-in: admins only, checked against the account on the server. */
export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();
  return <AdminShell admin={{ handle: admin.handle, name: admin.name }}>{children}</AdminShell>;
}
