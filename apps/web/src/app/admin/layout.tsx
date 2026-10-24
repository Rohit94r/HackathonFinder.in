import type { Metadata, Viewport } from 'next';
import './admin.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Admin · HackathonFinder' },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const viewport: Viewport = { themeColor: '#ffffff', colorScheme: 'light' };

/**
 * The admin area's own frame: no public navbar or footer, always black on white.
 * Sign-in is checked by app/admin/(panel)/layout.tsx and by every admin page and API,
 * so /admin/login stays reachable when signed out.
 */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="hf-admin flex min-h-screen flex-1 flex-col">{children}</div>;
}
