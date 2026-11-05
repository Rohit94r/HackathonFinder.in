import PageSkeleton from '@/components/PageSkeleton';

/** Shown while the nearest hackathons load. */
export default function Loading() {
  return <PageSkeleton kind="tickets" label="Loading hackathons near you" />;
}
