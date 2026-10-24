import type { Metadata } from 'next';
import ReviewQueue from '@/components/admin/ReviewQueue';
import { requireAdminPage } from '@/server/admin';

export const metadata: Metadata = { title: 'Review' };

export default async function Page() {
  await requireAdminPage();
  return <ReviewQueue />;
}
