import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

interface UseAuthOptions {
  requireAuth?: boolean;
  redirectTo?: string;
}

export const useAuth = (options: UseAuthOptions = {}) => {
  const { requireAuth = true, redirectTo = '/auth/login' } = options;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const { 
    token, 
    user, 
    isLoggedIn, 
    setToken, 
    setUser, 
    logout, 
    checkAuthStatus 
  } = useAuthStore();

  useEffect(() => {
    const validateAuth = async () => {
      try {
        setIsLoading(true);
        
        // 检查本地存储中的 token
        const localToken = localStorage.getItem('auth_token');
        
        if (!localToken) {
          if (requireAuth) {
            router.push(redirectTo);
            return;
          }
          setIsAuthenticated(false);
          return;
        }

        // 验证 token 有效性
        const isValid = await checkAuthStatus();
        
        if (!isValid) {
          if (requireAuth) {
            logout();
            router.push(redirectTo);
            return;
          }
          setIsAuthenticated(false);
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth validation error:', error);
        if (requireAuth) {
          logout();
          router.push(redirectTo);
        }
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    validateAuth();
  }, [requireAuth, redirectTo, router, checkAuthStatus, logout]);

  const login = async (email: string, password: string) => {
    try {
      // 这里应该调用实际的登录 API
      // const response = await authApi.login(email, password);
      
      // 模拟登录成功
      const mockToken = 'mock_jwt_token_' + Date.now();
      const mockUser = {
        id: '1',
        email,
        name: '测试用户',
        avatar: null
      };

      setToken(mockToken);
      setUser(mockUser);
      localStorage.setItem('auth_token', mockToken);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error };
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return {
    // 状态
    isLoading,
    isAuthenticated,
    isLoggedIn,
    user,
    token,
    
    // 方法
    login,
    logout: handleLogout,
    checkAuthStatus,
  };
};

// 简化版本，用于不需要重定向的组件
export const useAuthStatus = () => {
  const { isLoggedIn, user, token } = useAuthStore();
  
  return {
    isLoggedIn,
    user,
    token,
  };
};