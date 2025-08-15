'use client';

import animationData from "@/assets/working_person.json";
import { Player } from "@lottiefiles/react-lottie-player";
import { Parallax, ParallaxLayer } from "@react-spring/parallax";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const HomePage = () => {
  const router = useRouter();

  return (
    <div className="h-screen w-screen overflow-x-hidden text-gray-800">
      <Parallax pages={2}>
        {/* Background floating elements */}
        <ParallaxLayer offset={0} speed={0.2}>
          <div className="absolute top-20 left-10 w-20 h-20 bg-purple-300 rounded-full opacity-20 animate-pulse"></div>
        </ParallaxLayer>
        <ParallaxLayer offset={0} speed={0.4}>
          <div className="absolute top-40 right-20 w-16 h-16 bg-purple-400 rounded-full opacity-30 animate-bounce"></div>
        </ParallaxLayer>
        <ParallaxLayer offset={0} speed={0.6}>
          <div className="absolute bottom-40 left-20 w-12 h-12 bg-purple-500 rounded-full opacity-25 animate-ping"></div>
        </ParallaxLayer>
        <ParallaxLayer offset={0} speed={0.3}>
          <div className="absolute bottom-20 right-10 w-24 h-24 bg-purple-200 rounded-full opacity-20 animate-pulse"></div>
        </ParallaxLayer>

        {/* Page 1 - Hero + Nav */}
        <ParallaxLayer offset={0} speed={0.5}>
          <div className="h-screen bg-gradient-to-b from-purple-100 to-purple-200 relative overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_#8b5cf6_1px,_transparent_1px)] bg-[length:50px_50px]"></div>
            </div>
            
            {/* Navigation Bar */}
            <div className="absolute top-0 w-full flex justify-between items-center px-8 py-4 z-50">
              <motion.h1 
                className="text-2xl font-bold text-purple-800"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                Powered by 油菜花v2
              </motion.h1>
              <motion.div 
                className="space-x-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <button
                  onClick={() => router.push('/auth/login')}
                  className="text-purple-800 font-medium hover:underline transition-all duration-300 hover:text-purple-600 relative z-50"
                >
                  登录
                </button>
                <button
                  onClick={() => router.push('/auth/register')}
                  className="bg-purple-600 text-white px-4 py-1 rounded-lg hover:bg-purple-700 transition-all duration-300 hover:scale-105 relative z-50"
                >
                  注册
                </button>
              </motion.div>
            </div>

            {/* Hero Section */}
            <div className="h-full flex flex-col md:flex-row items-center justify-center px-6 md:px-16 relative z-10">
              <div className="md:w-1/2 mb-12 md:mb-0 flex flex-col items-center relative z-10">
                <motion.h1
                  className="text-5xl font-bold text-purple-800 mb-4 text-center"
                  initial={{ opacity: 0, y: -30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1 }}
                >
                  欢迎来到讯飞 AI 模拟面试系统
                </motion.h1>
                <motion.p
                  className="text-lg text-gray-700 max-w-lg text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 1 }}
                >
                  模拟真实面试场景，智能评估表达、情绪与技术能力。选择你的目标岗位和薪资，开启定制化提升之旅。
                </motion.p>
                <motion.button
                  onClick={() => router.push('/dashboard')}
                  className="mt-6 px-6 py-3 bg-purple-700 text-white font-bold rounded-xl shadow-md hover:bg-purple-800 relative overflow-hidden group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="relative z-10">准备好了，开启面试！</span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-800"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "0%" }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.button>
              </div>
              <motion.div 
                className="md:w-1/2 relative z-10"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                <Player
                  autoplay
                  loop
                  src={animationData}
                  style={{ height: "700px", width: "700px" }}
                />
              </motion.div>
            </div>
          </div>
        </ParallaxLayer>

        {/* Page 2 - Features */}
        <ParallaxLayer offset={1} speed={0.3}>
          <div className="h-screen bg-purple-50 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
            {/* Background animated elements for page 2 */}
            <div className="absolute top-10 left-1/4 w-32 h-32 bg-purple-200 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute bottom-20 right-1/4 w-24 h-24 bg-purple-300 rounded-full opacity-15 animate-bounce"></div>
            <div className="absolute top-1/2 left-10 w-16 h-16 bg-purple-400 rounded-full opacity-25 animate-ping"></div>
            
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_25%_25%,_#8b5cf6_1px,_transparent_1px)] bg-[length:40px_40px]"></div>
            </div>

            <motion.h2 
              className="text-4xl font-semibold text-purple-700 mb-10 relative z-10"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              核心功能亮点
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl relative z-10">
              {[
                {
                  title: "简历智能分析",
                  desc: "上传简历，使用多模态大模型提取关键信息并匹配岗位。",
                },
                {
                  title: "AI数字人面试官",
                  desc: "选择不同风格数字人视频面试官，模拟真实面试情境。",
                },
                {
                  title: "多维能力评估",
                  desc: "语言表达、逻辑、情绪识别、肢体动作一体化智能评分。",
                },
                {
                  title: "智能笔试系统",
                  desc: "题库自动推送、在线作答、自动评判、引导讲解思路。",
                },
                {
                  title: "个性化报告",
                  desc: "全面反馈面试表现，生成能力雷达图与提升建议。",
                },
                {
                  title: "社群交流",
                  desc: "加入面试者社群，分享经验、获取精华内容推荐。",
                },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  className="bg-white rounded-2xl p-6 shadow-xl border border-purple-200 hover:shadow-2xl transition-all duration-300 group cursor-pointer"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ 
                    y: -10,
                    scale: 1.02,
                    boxShadow: "0 25px 50px -12px rgba(139, 92, 246, 0.25)"
                  }}
                >
                  <h3 className="text-xl font-bold text-purple-800 mb-2 group-hover:text-purple-600 transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm group-hover:text-gray-700 transition-colors duration-300">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </ParallaxLayer>

        {/* Additional floating elements for page 2 */}
        <ParallaxLayer offset={1} speed={0.1}>
          <div className="absolute top-1/3 right-10 w-8 h-8 bg-purple-300 rounded-full opacity-20 animate-pulse"></div>
        </ParallaxLayer>
        <ParallaxLayer offset={1} speed={0.2}>
          <div className="absolute bottom-1/3 left-20 w-12 h-12 bg-purple-400 rounded-full opacity-15 animate-bounce"></div>
        </ParallaxLayer>
      </Parallax>
    </div>
  );
};

export default HomePage;
