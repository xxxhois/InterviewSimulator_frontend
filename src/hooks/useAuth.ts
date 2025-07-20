/*这个组件是用于保护路由组件的Hook，验证localStorage中的token，如果没有，则重定向到登录页面*/ 

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface UseAuthOptions {
  requireAuth?: boolean;
  redirectTo?: string;
}

export const useAuth = (options: UseAuthOptions = {}) => {
  const { requireAuth = true, redirectTo = '/auth/login' } = options;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      setIsLoading(true);
      
      // 直接从 localStorage 检查 token
      const authToken = localStorage.getItem('auth_token');
      const hasToken = !!authToken && authToken.trim() !== '';
      
      setIsAuthenticated(hasToken);
      setToken(authToken);
      
      if (!hasToken && requireAuth) {
        console.log('未找到有效token，重定向到登录页面');
        router.push(redirectTo);
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [requireAuth, redirectTo, router]);

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setIsAuthenticated(false);
    setToken(null);
    router.push('/auth/login');
  };

  return {
    isLoading,
    isAuthenticated,
    isLoggedIn: isAuthenticated,
    token,
    logout,
  };
};

// 简化版本，用于不需要重定向的组件
// export const useAuthStatus = () => {
//   const { isLoggedIn, token } = useAuthStore();
  
//   return {
//     isLoggedIn,
//     token,
//   };
// };