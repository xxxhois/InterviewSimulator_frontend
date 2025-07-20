'use client';

import { useAuth } from '@/hooks/useAuth';
import { ReactNode, useEffect } from 'react';
import { showToast } from '@/components/Toast';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  fallback?: ReactNode;
}

export const ProtectedRoute = ({ 
  children, 
  redirectTo = '/auth/login',
  fallback = <div>Loading...</div>
}: ProtectedRouteProps) => {
  const { isLoading, isAuthenticated } = useAuth({ 
    requireAuth: true, 
    redirectTo 
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      showToast('身份信息未识别，请登录');
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!isAuthenticated) {
    return null; // 重定向中，不渲染内容
  }

  return <>{children}</>;
};

// 可选认证路由 - 如果已登录则显示内容，未登录则显示登录提示
export const OptionalAuthRoute = ({ 
  children, 
  fallback 
}: { 
  children: ReactNode;
  fallback?: ReactNode;
}) => {
  const { isLoading, isAuthenticated } = useAuth({ requireAuth: false });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return fallback ? <>{fallback}</> : <div>请先登录</div>;
  }

  return <>{children}</>;
};