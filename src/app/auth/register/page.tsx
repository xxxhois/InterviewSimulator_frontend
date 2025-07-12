'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const RegisterPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-purple-200 flex items-center justify-center">
      <motion.div
        className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold text-purple-800 mb-6 text-center">注册账号</h2>

        <form className="space-y-4">
          <div>
            <label className="block text-sm text-purple-700 mb-1">用户名</label>
            <input
              type="text"
              placeholder="请输入用户名"
              className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm text-purple-700 mb-1">密码</label>
            <input
              type="password"
              placeholder="至少6位"
              className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm text-purple-700 mb-1">确认密码</label>
            <input
              type="password"
              placeholder="********"
              className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-purple-700 text-white py-2 rounded-lg font-semibold hover:bg-purple-800"
          >
            注册
          </button>

          <p className="text-sm text-center text-gray-600 mt-4">
            已有账号？
            <span
              className="text-purple-700 font-medium cursor-pointer ml-1 hover:underline"
              onClick={() => router.push('/auth/login')}
            >
              去登录
            </span>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
