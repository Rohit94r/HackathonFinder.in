'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Catches render errors in the app (most often a database that is unreachable)
 * and shows a friendly page instead of Next.js's bare "Application error".
 * `digest` matches the server log entry, so it can be quoted in a bug report.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="container-page flex min-h-screen flex-col items-center justify-center py-20 text-center">
      <span className="mb-6 rounded-xl bg-ink/5 p-5 text-ink">
        <AlertTriangle className="h-10 w-10" />
      </span>
      <h1 className="text-4xl font-bold">Something went wrong on our side</h1>
      <p className="mt-3 max-w-md text-ink/70">
        We couldn’t load this page just now. It’s usually temporary — try again in a moment.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/" className="btn-secondary">
          Go home
        </Link>
      </div>
      {error.digest ? <p className="mt-8 text-xs text-ink/40">Reference: {error.digest}</p> : null}
    </main>
  );
}
