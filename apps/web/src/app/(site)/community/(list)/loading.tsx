import PageSkeleton from '@/components/PageSkeleton';

/** Shown while the discussions load. Sits in (list) so a missing thread still returns 404. */
export default function Loading() {
  return <PageSkeleton kind="rows" label="Loading discussions" />;
}
