'use client';

import { Player } from '@lottiefiles/react-lottie-player';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from 'chart.js';
import { gsap } from 'gsap';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import {
  Line,
  Radar
} from 'react-chartjs-2';
import robot from '@/assets/robot.json';
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
);

const features = [
  {
    title: 'AI数字人视频面试',
    description: '选择不同风格的数字人面试官，模拟真实场景，提升应对能力。',
    animation: robot,
    position: 'md:col-span-2',
    route: '/interview/start',
  },
  {
    title: '简历编辑与上传',
    description: '上传并智能优化简历，提升面试前准备效率。',
    animation: 'https://lottie.host/8b8b26aa-30be-4a9a-b8cd-f099fe89860d/J4ePcg3zAm.json',
    position: 'md:col-span-1',
    route: '/resume',
  },
  {
    title: '专项练习题库',
    description: '针对八股、项目、代码等问题进行专项练习。',
    animation: 'https://lottie.host/59d9cf40-d2ee-402e-9213-dc3a7ad7db71/LdDfVLfBLT.json',
    position: 'md:col-span-1',
    route: '/interview/special',
  },
  {
    title: '个性化学习路线',
    description: '根据你的能力生成个性化成长路径。',
    animation: 'https://lottie.host/2b32b226-2df5-4ff7-b6c0-4d4513b5f4f5/FS39uAQv5r.json',
    position: 'md:col-span-2',
    route: '/learning-path',
  },
  {
    title: '多维度能力评估',
    description: '情绪、表达、知识掌握、代码能力等全面评估反馈。',
    animation: 'https://lottie.host/c8fbe5c9-7393-4b9f-a944-708325cccbfd/wDFIfV95cf.json',
    position: 'md:col-span-3',
    route: '/interview/report',
  },
];

const MainDashboard = () => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          stagger: 0.2,
          ease: 'power2.out',
        }
      );
    }
  }, []);

  const radarData = {
    labels: ['表达能力', '技术知识', '情绪稳定', '逻辑思维', '肢体语言'],
    datasets: [
      {
        label: '能力雷达图',
        data: [70, 85, 60, 75, 65],
        backgroundColor: 'rgba(147, 112, 219, 0.3)',
        borderColor: '#7e5bef',
        borderWidth: 2,
      },
    ],
  };

  const lineData = {
    labels: ['第1次', '第2次', '第3次', '第4次', '第5次'],
    datasets: [
      {
        label: '综合评分趋势',
        data: [65, 70, 78, 80, 85],
        fill: false,
        backgroundColor: '#7e5bef',
        borderColor: '#7e5bef',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-200 text-gray-800 px-4 py-12">
      <div className="flex justify-between items-center mb-8 px-4 md:px-12">
        <h1 className="text-3xl font-bold text-purple-700">AI 面试主面板</h1>
        <div className="space-x-4">
          <button onClick={() => router.push('/')} className="text-purple-700 hover:underline">首页</button>
          <button onClick={() => router.push('/login')} className="bg-purple-700 text-white px-4 py-1 rounded-lg hover:bg-purple-800">登录</button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 md:px-12"
      >
        {features.map((feature, index) => (
          <div
            key={index}
            className={`bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col items-center justify-between ${feature.position}`}
            onClick={() => router.push(feature.route)}
          >
            <div className="w-full flex flex-col items-center text-center">
              <h2 className="text-xl font-bold text-purple-800 mb-2">
                {feature.title}
              </h2>
              <p className="text-gray-600 text-sm mb-4">{feature.description}</p>
            </div>
            <Player
              autoplay
              loop
              src={feature.animation}
              style={{ height: '180px', width: '180px' }}
            />
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="mt-16 px-8 md:px-24">
        <h2 className="text-2xl font-semibold text-purple-700 mb-6 text-center">能力数据概览</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-purple-700 mb-4">能力雷达图</h3>
            <Radar data={radarData} />
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-purple-700 mb-4">评分趋势曲线</h3>
            <Line data={lineData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;