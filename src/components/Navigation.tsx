'use client';

import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { getInterviewList } from '@/api/interview';
import { Dialog } from '@headlessui/react';

interface NavItem {
  name: string;
  path: string;
  icon?: string;
}

const navItems: NavItem[] = [
  { name: "首页", path: "/dashboard" },
  { name: "面试", path: "/interview/room",},
  { name: "简历", path: "/resume" },
  { name: "刷题", path: "/written-test/ide" },
  { name: "社区", path: "/posts" },
  { name: "个人", path: "/profile" },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentPath, setCurrentPath] = useState(pathname);
  // 新增面试提醒相关状态
  const [nextInterview, setNextInterview] = useState<{ time: string; id: number } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setCurrentPath(pathname);
  }, [pathname]);

  useEffect(() => {
    getInterviewList().then(res => {
      if (res.interviews && res.interviews.length > 0) {
        const now = new Date();
        const future = res.interviews
          .map(i => ({ ...i, date: new Date(i.interview_time) }))
          .filter(i => i.date > now)
          .sort((a, b) => a.date.getTime() - b.date.getTime());
        if (future.length > 0) {
          setNextInterview({ time: future[0].interview_time, id: future[0].id });
          const ms = future[0].date.getTime() - now.getTime();
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => setShowModal(true), ms);
        }
      }
    });
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // 检查是否为当前页面
  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  // 导航到指定页面
  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div>
      {/* 导航栏 */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-purple-200 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <motion.h1 
                className="text-2xl font-bold text-purple-800 cursor-pointer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                onClick={() => handleNavigation("/")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                讯飞AI模拟面试系统
              </motion.h1>
              
              <div className="hidden md:flex space-x-6">
                {navItems.map((item) => (
                  <motion.button 
                    key={item.path}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                      isActive(item.path)
                        ? "text-white bg-purple-600 shadow-lg"
                        : "text-purple-700 hover:text-purple-600 hover:bg-purple-50"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleNavigation(item.path)}
                  >
                    <span className="text-sm">{item.icon}</span>
                    <span>{item.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>
            
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="bg-gradient-to-r from-purple-400 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                {nextInterview
                  ? `下场面试: ${new Date(nextInterview.time).toLocaleString().replace(/:\d{2}$/, '')}`
                  : "暂无面试"}
              </div>
            </motion.div>
          </div>
        </div>
      </nav>
      
      {/* 移动端导航菜单 */}
      <div className="md:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
        <div className="bg-white/90 backdrop-blur-md border border-purple-200 rounded-full shadow-lg px-2 py-1">
          <div className="flex space-x-1">
            {navItems.slice(0, 4).map((item) => (
              <motion.button
                key={item.path}
                className={`p-2 rounded-full transition-all duration-200 ${
                  isActive(item.path)
                    ? "text-white bg-purple-600"
                    : "text-purple-700 hover:text-purple-600 hover:bg-purple-50"
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleNavigation(item.path)}
                title={item.name}
              >
                <span className="text-lg">{item.icon}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
      {/* 到点弹窗 */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} className="fixed z-50 inset-0 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <Dialog.Panel className="bg-white rounded-xl p-8 shadow-xl z-50 max-w-sm w-full text-center">
          <Dialog.Title className="text-lg font-bold mb-4 text-purple-700">面试提醒</Dialog.Title>
          <div className="mb-4 text-gray-700">
            您有一场面试即将开始，是否立即进入面试房间？
          </div>
          <button
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded font-bold"
            onClick={() => {
              setShowModal(false);
              if (nextInterview) router.push(`/interview/room?id=${nextInterview.id}`);
            }}
          >
            进入面试房间
          </button>
        </Dialog.Panel>
      </Dialog>
    </div>
  );
}