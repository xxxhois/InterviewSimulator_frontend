/*这个组件是用于保护路由组件的Hook，验证localStorage中的token，如果没有，则重定向到登录页面*/ 

import { useAuthStore } from '@/store/authStore';
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
  
  const { 
    token, 
    isLoggedIn, 
    logout
  } = useAuthStore();

  useEffect(() => {
    const validateAuth = () => {
      setIsLoading(true);
      
      if (!isLoggedIn && requireAuth) {
        router.push(redirectTo);
      }
      
      setIsLoading(false);
    };

    validateAuth();
  }, [isLoggedIn, requireAuth]);

  return {
    isLoading,
    isAuthenticated: isLoggedIn, // 直接使用 authStore 状态
    isLoggedIn,
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