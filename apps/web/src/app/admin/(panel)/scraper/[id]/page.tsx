import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import ScrapeRun from '@/components/admin/ScrapeRun';
import { requireAdminPage } from '@/server/admin';

export const metadata: Metadata = { title: 'Scrape run' };

export default async function Page({ params }: { params: { id: string } }) {
  await requireAdminPage();
  if (!/^[a-f0-9]{24}$/i.test(params.id)) notFound();
  return (
    <div className="space-y-4">
      <Link href="/admin/scraper" className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-black">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Scraper
      </Link>
      <ScrapeRun id={params.id} showLogs />
    </div>
  );
}
