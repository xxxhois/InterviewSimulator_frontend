import { create } from 'zustand';
import { persist } from 'zustand/middleware';
//import { LoginResponse } from '@/types/user';

interface User {
  user_id: string;
  username: string;
}

interface AuthState {
  // 状态
  token: string | null;
  user: User | null;
  isLoggedIn: boolean;
  
  // 方法
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  //checkAuthStatus: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      token: null,
      user: null,
      isLoggedIn: false,

      // 设置 token
      setToken: (token: string) => {
        set({ token, isLoggedIn: true });
        localStorage.setItem('auth_token', token);
        
      },

      // 设置用户信息
      setUser: (user: User) => {
        set({ user });
        localStorage.setItem('auth_user', JSON.stringify(user));
      },

      // 登出
      logout: () => {
        set({ token: null, user: null, isLoggedIn: false });
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      },

      // // 检查认证状态
      // checkAuthStatus: async () => {
      //   const { token } = get();
        
      //   if (!token) {
      //     return false;
      //   }

      //   try {
      //     // 这里应该调用实际的 API 来验证 token
      //     // const response = await authApi.validateToken(token);
          
      //     // 模拟 token 验证
      //     // 在实际项目中，这里应该发送请求到后端验证 token
      //     const isValid = token && token.length > 10;
          
      //     if (!isValid) {
      //       get().logout();
      //       return false;
      //     }

      //     return true;
      //   } catch (error) {
      //     console.error('Token validation error:', error);
      //     get().logout();
      //     return false;
      //   }
      // },
    }),
    {
      name: 'auth-storage', // localStorage 的 key
      partialize: (state) => ({ 
        token: state.token,
        //user: state.user,
        isLoggedIn: state.isLoggedIn 
      }),
    }
  )
);