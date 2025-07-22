'use client';
import { UnauthorizedError } from '@/api/apiRequest';
import { useAuthStore } from '@/store/authStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    useAuthStore.getState().initializeAuth();

    // 订阅全局 query 错误
    const unsubscribeQuery = queryClient.getQueryCache().subscribe(event => {
      if (
        event &&
        'query' in event &&
        event.query &&
        event.query.state.status === 'error' &&
        event.query.state.error instanceof UnauthorizedError
      ) {
        window.location.href = '/auth/login';
      }
    });

    // 订阅全局 mutation 错误
    const unsubscribeMutation = queryClient.getMutationCache().subscribe(event => {
      if (
        event &&
        'mutation' in event &&
        event.mutation &&
        event.mutation.state.status === 'error' &&
        event.mutation.state.error instanceof UnauthorizedError
      ) {
        window.location.href = '/auth/login';
      }
    });

    return () => {
      unsubscribeQuery();
      unsubscribeMutation();
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}