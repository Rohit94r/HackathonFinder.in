import { HackathonCardSkeleton } from '@/components/hackathon/HackathonCard';

type Kind = 'tickets' | 'rows' | 'boards' | 'calendar';

/**
 * Placeholder for a page while its data loads: the page header, then the shape of what's coming
 * (a ticket grid, a list of posts, city boards or a calendar), so nothing jumps when it arrives.
 * Used by loading.tsx files, which only sit on pages with no sub-pages that can 404 (a loading
 * screen sends the page's status before a missing one could be detected).
 */
export default function PageSkeleton({ kind, label }: { kind: Kind; label: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label}>
      <section className="hf-hero border-b border-line">
        <div className="container-page space-y-3 py-10 sm:py-14">
          <div className="skeleton h-12 w-80 max-w-full" />
          <div className="skeleton h-4 w-[28rem] max-w-full" />
        </div>
      </section>
      <section className="py-8">
        <div className="container-page">
          <div className="skeleton h-11 w-full rounded-md" />
          {kind === 'tickets' && (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <HackathonCardSkeleton key={i} />
              ))}
            </div>
          )}
          {kind === 'rows' && (
            <div className="mt-6 space-y-3">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="flex gap-4 rounded-md border border-line bg-card p-5">
                  <div className="skeleton h-10 w-10 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2.5">
                    <div className="skeleton h-4 w-2/3" />
                    <div className="skeleton h-3 w-full" />
                    <div className="skeleton h-3 w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {kind === 'boards' && (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="space-y-4 rounded-md border border-line bg-card p-5">
                  <div className="skeleton h-14 w-full rounded-[5px]" />
                  <div className="skeleton h-3 w-24" />
                  <div className="skeleton h-10 w-16" />
                  <div className="skeleton h-3 w-3/4" />
                </div>
              ))}
            </div>
          )}
          {kind === 'calendar' && (
            <div className="mt-6 grid grid-cols-7 gap-1.5">
              {Array.from({ length: 35 }, (_, i) => (
                <div key={i} className="skeleton h-20 rounded-md sm:h-24" />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
