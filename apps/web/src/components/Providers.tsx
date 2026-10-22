'use client';

import { SessionProvider } from 'next-auth/react';
import { SWRConfig } from 'swr';
import { swrFetcher } from '@/lib/apiClient';

/** Session and data-fetching context for the whole app. */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <SWRConfig value={{ fetcher: swrFetcher, revalidateOnFocus: false, shouldRetryOnError: false, dedupingInterval: 4000 }}>
        {children}
      </SWRConfig>
    </SessionProvider>
  );
}
