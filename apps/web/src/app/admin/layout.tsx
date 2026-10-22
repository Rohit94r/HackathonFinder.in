import type { Metadata } from 'next';
import SiteLayout from '../(site)/layout';
import AdminNav from '@/components/admin/AdminNav';
import { requireAdminPage } from '@/server/admin';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Admin · HackathonFinder' },
  robots: { index: false, follow: false },
};

/** The admin area: the site's navbar and footer, admin tabs, and a role check on the server. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage('/admin');
  return (
    <SiteLayout>
      <section className="border-b border-ink/10 bg-surface">
        <div className="container-page space-y-4 py-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h1 className="text-3xl sm:text-4xl">Admin</h1>
            <p className="text-sm text-ink/60">Signed in as @{admin.handle}</p>
          </div>
          <AdminNav />
        </div>
      </section>
      <div className="bg-surface">
        <div className="container-page py-8">{children}</div>
      </div>
    </SiteLayout>
  );
}
