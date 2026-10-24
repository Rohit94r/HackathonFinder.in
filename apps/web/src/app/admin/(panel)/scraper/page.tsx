import type { Metadata } from 'next';
import Scraper from '@/components/admin/Scraper';
import { requireAdminPage } from '@/server/admin';

export const metadata: Metadata = { title: 'Scraper' };

export default async function Page() {
  await requireAdminPage();
  return <Scraper />;
}
