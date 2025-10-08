import * as React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Reduce aggressive refetching when switching tabs
        refetchOnWindowFocus: false,
        // Longer stale time to prevent unnecessary requests
        staleTime: 5 * 60 * 1000, // 5 minutes
        // Increase cache time
        gcTime: 10 * 60 * 1000, // 10 minutes
        // Better retry strategy for MSW
        retry: (failureCount, error) => {
          // Don't retry 404s - they indicate MSW issues
          if (error?.message?.includes('404')) return false
          return failureCount < 2
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    },
  })
  return { queryClient }
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode
  queryClient: QueryClient
}) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}


