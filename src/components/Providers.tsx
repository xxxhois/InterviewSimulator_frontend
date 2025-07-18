'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';

function LayoutButton() {
  const isLoggedIn = useAuthStore(state => state.isLoggedIn);
  const logout = useAuthStore(state => state.logout);
  return (
    <button onClick={() => { logout(); window.location.reload(); }}>
      {isLoggedIn ? '退出登录' : '登录'}
    </button>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      {/* <LayoutButton /> */}
      {children}
    </QueryClientProvider>
  );
}