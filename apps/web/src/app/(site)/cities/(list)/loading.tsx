import PageSkeleton from '@/components/PageSkeleton';

/** Shown while the cities load. Sits in (list) so a missing city still returns 404. */
export default function Loading() {
  return <PageSkeleton kind="boards" label="Loading cities" />;
}
