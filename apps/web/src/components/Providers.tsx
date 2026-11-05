'use client';

import { SessionProvider } from 'next-auth/react';
import { SWRConfig } from 'swr';
import { swrFetcher } from '@/lib/apiClient';
import Toaster from './Toaster';
import MobileTabBar from './layout/MobileTabBar';

/** Session and data-fetching context for the whole app, plus the toast outlet. */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <SWRConfig value={{ fetcher: swrFetcher, revalidateOnFocus: false, shouldRetryOnError: false, dedupingInterval: 4000 }}>
        {children}
        <MobileTabBar />
        <Toaster />
      </SWRConfig>
    </SessionProvider>
  );
}
