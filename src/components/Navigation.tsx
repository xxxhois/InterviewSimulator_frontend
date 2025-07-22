'use client';

import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface NavItem {
  name: string;
  path: string;
  icon?: string;
}

const navItems: NavItem[] = [
  { name: "首页", path: "/dashboard" },
  { name: "面试", path: "/interview/room",},
  { name: "简历", path: "/resume" },
  { name: "刷题", path: "/written-test/list" },
  { name: "社区", path: "/posts" },
  { name: "个人", path: "/profile" },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentPath, setCurrentPath] = useState(pathname);
  const interviewTime = "14:30";//TODO: 获取今日面试时间
  // 更新当前路径
  useEffect(() => {
    setCurrentPath(pathname);
  }, [pathname]);

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
                今日面试:{interviewTime}
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
    </div>
  );
}