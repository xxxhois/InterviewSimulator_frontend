'use client';

import { loginUser } from '@/api/user';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const LoginPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setToken, setUser } = useAuthStore();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // 检查URL参数中的成功消息
  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      setSuccessMessage(message);
      // 清除URL参数
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  // 表单验证函数
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username) {
      newErrors.username = '请输入用户名';
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少3位';
    }

    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少6位';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理输入变化
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await loginUser(formData.username, formData.password);
      console.log('登录成功:', response);
      
      // 存储 token 和用户信息
      if (response.token) {
        setToken(response.token);
        
        // 设置用户信息（这里可以根据实际API响应调整）
        setUser({
          user_id: response.user_id, // 实际应该从响应中获取
          name: formData.username, // 或者从响应中获取
          avatar: null
        });
        
        // 登录成功，跳转到仪表板
        router.push('/dashboard');
      } else {
        throw new Error('登录响应中没有token');
      }
    } catch (error) {
      console.error('登录失败:', error);
      setErrors({ submit: '登录失败，请检查用户名和密码' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-purple-200 flex items-center justify-center">
      <motion.div
        className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold text-purple-800 mb-6 text-center">登录账号</h2>

        {successMessage && (
          <motion.div 
            className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-green-600 text-sm">{successMessage}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-purple-700 mb-1">用户名</label>
            <input
              type="text"
              placeholder="请输入用户名"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.username ? 'border-red-500' : 'border-purple-300'
              }`}
            />
            {errors.username && (
              <p className="text-red-500 text-sm mt-1">{errors.username}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm text-purple-700 mb-1">密码</label>
            <input
              type="password"
              placeholder="********"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.password ? 'border-red-500' : 'border-purple-300'
              }`}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 rounded-lg font-semibold transition-colors ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-purple-700 text-white hover:bg-purple-800'
            }`}
          >
            {isLoading ? '登录中...' : '登录'}
          </button>

          <p className="text-sm text-center text-gray-600 mt-4">
            还没有账号？
            <span
              className="text-purple-700 font-medium cursor-pointer ml-1 hover:underline"
              onClick={() => router.push('/auth/register')}
            >
              去注册
            </span>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginPage;
