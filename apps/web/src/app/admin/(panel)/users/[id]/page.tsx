import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import UserDetail from '@/components/admin/UserDetail';
import { requireAdminPage } from '@/server/admin';

export const metadata: Metadata = { title: 'User' };

export default async function Page({ params }: { params: { id: string } }) {
  await requireAdminPage();
  if (!/^[a-f0-9]{24}$/i.test(params.id)) notFound();
  return <UserDetail id={params.id} />;
}
