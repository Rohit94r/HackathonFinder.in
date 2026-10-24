import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import HackathonEditor from '@/components/admin/HackathonEditor';
import { requireAdminPage } from '@/server/admin';

export const metadata: Metadata = { title: 'Edit hackathon' };

export default async function Page({ params }: { params: { id: string } }) {
  await requireAdminPage();
  if (!/^[a-f0-9]{24}$/i.test(params.id)) notFound();
  return <HackathonEditor id={params.id} />;
}
