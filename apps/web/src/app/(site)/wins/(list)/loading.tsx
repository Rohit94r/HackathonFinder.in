import PageSkeleton from '@/components/PageSkeleton';

/** Shown while the stories load. Sits in (list) so a missing story still returns 404. */
export default function Loading() {
  return <PageSkeleton kind="rows" label="Loading winning stories" />;
}
