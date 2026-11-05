import PageSkeleton from '@/components/PageSkeleton';

/** Shown while Team Finder loads. */
export default function Loading() {
  return <PageSkeleton kind="rows" label="Loading teams" />;
}
