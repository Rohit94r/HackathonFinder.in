import type { Metadata } from 'next';
import HackathonsTable from '@/components/admin/HackathonsTable';
import { filtersFrom } from '@/components/admin/hackathonFilters';
import { requireAdminPage } from '@/server/admin';

export const metadata: Metadata = { title: 'Hackathons' };

export default async function Page({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  await requireAdminPage();
  return <HackathonsTable initial={filtersFrom(searchParams)} />;
}
