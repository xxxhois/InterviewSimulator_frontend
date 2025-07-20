'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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
  const [queryClient] = useState(() => new QueryClient());  // 在组件内部或使用 useEffect 初始化
  useEffect(() => {
    useAuthStore.getState().initializeAuth();
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      {/* <LayoutButton /> */}
      {children}
    </QueryClientProvider>
  );
}