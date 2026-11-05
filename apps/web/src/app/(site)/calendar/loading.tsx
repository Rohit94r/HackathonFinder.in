import PageSkeleton from '@/components/PageSkeleton';

/** Shown while the calendar loads. */
export default function Loading() {
  return <PageSkeleton kind="calendar" label="Loading the calendar" />;
}
