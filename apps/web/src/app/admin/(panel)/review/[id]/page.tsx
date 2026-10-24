import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SubmissionReview from '@/components/admin/SubmissionReview';
import { requireAdminPage } from '@/server/admin';

export const metadata: Metadata = { title: 'Review submission' };

export default async function Page({ params }: { params: { id: string } }) {
  await requireAdminPage();
  if (!/^[a-f0-9]{24}$/i.test(params.id)) notFound();
  return <SubmissionReview id={params.id} />;
}
