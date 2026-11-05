import { HackathonCardSkeleton } from '@/components/hackathon/HackathonCard';

/** Shown while the listings load: the Explore layout with placeholder cards. */
export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading hackathons">
      <section className="hf-hero border-b border-line">
        <div className="container-page space-y-3 py-10 sm:py-14">
          <div className="skeleton h-9 w-72" />
          <div className="skeleton h-4 w-96 max-w-full" />
        </div>
      </section>
      <section className="py-8">
        <div className="container-page grid gap-8 lg:grid-cols-[272px_minmax(0,1fr)]">
          <div className="hidden space-y-4 rounded-lg border border-line bg-card p-4 lg:block">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="space-y-2">
                <div className="skeleton h-3.5 w-24" />
                <div className="flex flex-wrap gap-1.5">
                  <div className="skeleton h-7 w-16 rounded-md" />
                  <div className="skeleton h-7 w-20 rounded-md" />
                  <div className="skeleton h-7 w-14 rounded-md" />
                </div>
              </div>
            ))}
          </div>
          <div>
            <div className="skeleton h-11 w-full rounded-lg" />
            <div className="skeleton mt-4 h-4 w-32" />
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <HackathonCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
