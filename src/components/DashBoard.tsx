import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                欢迎回来，{user?.name}！
              </h1>
              <p className="text-gray-600">
                开始你的面试准备之旅吧
              </p>
            </div>
            <button
              onClick={logout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              退出登录
            </button>
          </div>
        </motion.div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "开始面试",
              desc: "选择面试官开始模拟面试",
              action: "开始",
              color: "bg-blue-500 hover:bg-blue-600"
            },
            {
              title: "查看历史",
              desc: "回顾之前的面试记录",
              action: "查看",
              color: "bg-green-500 hover:bg-green-600"
            },
            {
              title: "能力报告",
              desc: "查看详细的能力分析报告",
              action: "查看",
              color: "bg-purple-500 hover:bg-purple-600"
            },
            {
              title: "设置",
              desc: "管理个人信息和偏好设置",
              action: "设置",
              color: "bg-gray-500 hover:bg-gray-600"
            },
            {
              title: "帮助",
              desc: "查看使用指南和常见问题",
              action: "帮助",
              color: "bg-orange-500 hover:bg-orange-600"
            },
            {
              title: "反馈",
              desc: "提交建议和问题反馈",
              action: "反馈",
              color: "bg-pink-500 hover:bg-pink-600"
            }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {item.title}
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                {item.desc}
              </p>
              <button className={`text-white px-4 py-2 rounded-lg transition-colors ${item.color}`}>
                {item.action}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;