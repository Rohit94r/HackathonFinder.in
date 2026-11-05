import Link from 'next/link';
import { SearchX } from 'lucide-react';
import SiteLayout from './(site)/layout';

export default function NotFound() {
  return (
    <SiteLayout>
      <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <span className="mb-6 rounded-xl bg-ink/5 p-5 text-ink">
          <SearchX className="h-10 w-10" />
        </span>
        <h1 className="text-4xl font-bold">This page went offline</h1>
        <p className="mt-3 max-w-md text-ink/70">
          We couldn’t find what you were looking for. It may have ended, moved or never existed.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/hackathons" className="btn-primary">
            Find hackathons
          </Link>
          <Link href="/" className="btn-secondary">
            Go home
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
