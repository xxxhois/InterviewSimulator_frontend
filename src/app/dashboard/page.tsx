'use client';

import { fetchPosts } from '@/api/post';
import AIbot from '@/assets/AIbot.json';
import programming from '@/assets/programming.json';
import Navigation from '@/components/Navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Player } from '@lottiefiles/react-lottie-player';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

// 动态导入echarts组件以避免SSR问题
//const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

  const features: Array<{
    title: string;
    description?: string;
    position: string;
    route?: string;
    bgColor: string;
    shadowColor: string;
    textColor?: string;
    type: 'animation' | 'icon';
    animation?: any;
    icon?: string;
  }> = [
    {
      title: 'AI数字人视频面试',
      description: '选择不同风格的数字人面试官，模拟真实场景，提升应对能力。',
      animation: AIbot,
      position: 'md:col-span-1',
      route: '/interview/book',
      bgColor: 'bg-white border-2 border-purple-400',
      shadowColor: 'shadow-purple-500/30',
      textColor: 'text-purple-800',
      type: 'animation'
    },
    {
      title: '专项练习题库',
      description: '针对八股、项目、代码等问题进行专项练习，在线评测',
      animation: programming,
      position: 'md:col-span-1',
      route: '/written-test/list',
      bgColor:'bg-gradient-to-br from-purple-300 to-purple-500',
      shadowColor: 'shadow-purple-200/30',
      type: 'animation'
    },
    {
      title: '简历上传与修改',
      description: '智能分析简历，提供优化建议，一键生成多版本简历。',
      icon: '📄',
      position: 'md:col-span-1',
      route: '/resume',
      bgColor: 'bg-gradient-to-br from-purple-300 to-purple-500',
      shadowColor: 'shadow-purple-400/30',
      type: 'icon'
    },
      {
      title: '交流社区',
      position: 'md:col-span-1',
      bgColor: 'bg-white border-2 border-purple-400',
      shadowColor: 'shadow-purple-200/30',
      textColor: 'text-purple-800',
      type: 'animation'
    },
];

// 热门题库数据
const hotTopics = [
  { name: 'JavaScript核心概念', count: 1250, difficulty: '中等', color: 'bg-purple-400' },
  { name: 'React Hooks详解', count: 980, difficulty: '简单', color: 'bg-purple-300' },
  { name: '算法与数据结构', count: 2100, difficulty: '困难', color: 'bg-purple-500' },
  { name: '系统设计面试', count: 750, difficulty: '困难', color: 'bg-purple-600' },
  { name: '前端工程化', count: 680, difficulty: '中等', color: 'bg-purple-400' },
];

// 个性化推荐数据
const recommendations = {
  currentGoal: {
    title: '前端开发工程师',
    company: '字节跳动',
    salary: '25-35K',
    matchRate: 85
  },
  recommendedCompanies: [
    { name: '字节跳动', logo: '🟠', matchRate: 85, position: '前端开发工程师' },
    { name: '阿里巴巴', logo: '🟡', matchRate: 82, position: '前端开发工程师' },
    { name: '腾讯', logo: '🟢', matchRate: 78, position: '前端开发工程师' },
    { name: '美团', logo: '🟣', matchRate: 75, position: '前端开发工程师' },
    { name: '滴滴', logo: '🔵', matchRate: 72, position: '前端开发工程师' }
  ],
  recommendedTopics: [
    { name: 'React高级特性', difficulty: '困难', matchRate: 90, count: 156 },
    { name: 'TypeScript实战', difficulty: '中等', matchRate: 88, count: 234 },
    { name: '前端性能优化', difficulty: '困难', matchRate: 85, count: 189 },
    { name: 'Vue3生态', difficulty: '中等', matchRate: 82, count: 167 },
    { name: '微前端架构', difficulty: '困难', matchRate: 80, count: 98 }
  ]
};

const MainDashboard = () => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, y: 50, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: 'back.out(1.7)',
        }
      );
    }

    // 更新时间
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchPosts({ pageParam: 3, pageSize: 5 }).then(res => {
      setCommunityPosts(res.results || []);
    });
  }, []);

  // ECharts配置 - 能力雷达图
  const skillMatchOption = {
    title: {
      text: '能力雷达图',
      textStyle: {
        color: '#7c3aed',
        fontSize: 14,
        fontWeight: 'bold'
      },
      left: 'center'
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      data: ['当前能力', '目标能力'],
      bottom: 5,
      textStyle: {
        color: '#7c3aed'
      }
    },
    radar: {
      indicator: [
        { name: '表达能力', max: 100 },
        { name: '技术知识', max: 100 },
        { name: '情绪稳定', max: 100 },
        { name: '逻辑思维', max: 100 },
        { name: '肢体语言', max: 100 },
        { name: '应变能力', max: 100 }
      ],
      shape: 'circle',
      splitNumber: 5,
      axisName: {
        color: '#7c3aed',
        fontSize: 10
      },
      splitLine: {
        lineStyle: {
          color: ['#e9d5ff']
        }
      },
      splitArea: {
        show: false
      }
    },
    series: [
      {
        name: '能力评估',
        type: 'radar',
        data: [
          {
            value: [75, 85, 70, 80, 65, 72],
            name: '当前能力',
            areaStyle: {
              color: 'rgba(147, 51, 234, 0.4)'
            },
            lineStyle: {
              color: '#9333ea',
              width: 3
            },
            itemStyle: {
              color: '#9333ea'
            }
          },
          {
            value: [90, 95, 85, 90, 80, 88],
            name: '目标能力',
            areaStyle: {
              color: 'rgba(236, 72, 153, 0.4)'
            },
            lineStyle: {
              color: '#ec4899',
              width: 3,
              type: 'dashed'
            },
            itemStyle: {
              color: '#ec4899'
            }
          }
        ]
      }
    ],
    animation: true,
    animationDuration: 2000,
    animationEasing: 'cubicOut'
  };

  // ECharts配置 - 技能饼状图
  const pieOption = {
    title: {
      text: '技能分布',
      textStyle: {
        color: '#7c3aed',
        fontSize: 14,
        fontWeight: 'bold'
      },
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: {
        color: '#7c3aed'
      }
    },
    series: [
      {
        name: '技能掌握',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '16',
            fontWeight: 'bold',
            color: '#7c3aed'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 35, name: '前端开发', itemStyle: { color: '#8b5cf6' } },
          { value: 25, name: '后端开发', itemStyle: { color: '#a855f7' } },
          { value: 20, name: '算法设计', itemStyle: { color: '#c084fc' } },
          { value: 15, name: '系统设计', itemStyle: { color: '#ec4899' } },
          { value: 5, name: '其他技能', itemStyle: { color: '#f59e0b' } }
        ]
      }
    ],
    animation: true,
    animationDuration: 2000,
    animationEasing: 'cubicOut'
  };

  // ECharts配置 - 能力趋势曲线图
  const trendOption = {
    title: {
      text: '能力提升趋势',
      textStyle: {
        color: '#7c3aed',
        fontSize: 14,
        fontWeight: 'bold'
      },
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['第1次', '第2次', '第3次', '第4次', '第5次', '第6次'],
      axisLine: {
        lineStyle: {
          color: '#7c3aed'
        }
      },
      axisLabel: {
        color: '#7c3aed'
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLine: {
        lineStyle: {
          color: '#7c3aed'
        }
      },
      axisLabel: {
        color: '#7c3aed'
      }
    },
    series: [
      {
        name: '综合评分',
        type: 'line',
        smooth: true,
        data: [65, 70, 78, 80, 85, 88],
        lineStyle: {
          color: '#8b5cf6',
          width: 4
        },
        itemStyle: {
          color: '#8b5cf6',
          borderWidth: 3,
          borderColor: '#fff'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(139, 92, 246, 0.7)' },
              { offset: 0.5, color: 'rgba(168, 85, 247, 0.4)' },
              { offset: 1, color: 'rgba(236, 72, 153, 0.1)' }
            ]
          }
        }
      }
    ],
    animation: true,
    animationDuration: 2000,
    animationEasing: 'cubicOut'
  };

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-purple-200 relative overflow-hidden">
      {/* 背景装饰元素 */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-purple-300 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-purple-400 rounded-full opacity-30 animate-bounce"></div>
      <div className="absolute bottom-40 left-20 w-12 h-12 bg-purple-500 rounded-full opacity-25 animate-ping"></div>
      <div className="absolute bottom-20 right-10 w-24 h-24 bg-purple-200 rounded-full opacity-20 animate-pulse"></div>
      
      {/* 背景图案 */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_#8b5cf6_1px,_transparent_1px)] bg-[length:50px_50px]"></div>
      </div>

      <Navigation/>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 relative z-10">
        {/* 功能卡片区域 */}
        <motion.div
          ref={containerRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {/* 左侧三个功能卡片 */}
          <div className="grid grid-cols-1 gap-3">
            {features.slice(0, 3).map((feature, index) => (
              <motion.div
                key={index}
                className={`${feature.bgColor} rounded-2xl p-4 shadow-lg ${feature.shadowColor} hover:shadow-xl transition-all duration-500 cursor-pointer transform hover:-translate-y-0.5 border border-purple-200/20`}
                onClick={() => router.push(feature.route!)}
                whileHover={{ 
                  y: -1,
                  scale: 1.002,
                  boxShadow: "0 8px 16px -6px rgba(139, 92, 246, 0.15)"
                }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center mb-3">
                    <h2 className={`text-lg font-bold ${feature.textColor || 'text-white'}`}>
                      {feature.title}
                    </h2>
                  </div>
                  <p className={`text-xs mb-4 flex-grow ${feature.textColor ? 'text-gray-700' : 'text-white/90'}`}>
                    {feature.description}
                  </p>
                  <div className="flex justify-center">
                    {feature.type === 'animation' ? (
                      <Player
                        autoplay
                        loop
                        src={feature.animation}
                        style={{ height: '100px', width: '100px' }}
                      />
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="text-6xl mb-2">{feature.icon}</span>
                        <div className="w-16 h-1 bg-white/30 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* 右侧交流社区卡片 */}
          <div className="md:col-span-2">
            <motion.div
              className={`${features[3].bgColor} rounded-3xl p-6 shadow-2xl ${features[3].shadowColor} border border-purple-200/20 h-full`}
            >
                          <div className="flex flex-col h-full relative">
      {/* 右上角查看更多 */}
      <button
        className="absolute top-2 right-2 text-purple-600 hover:underline text-sm font-medium"
        onClick={() => router.push('/posts')}
      >
        查看更多
      </button>
      <div className="flex items-center mb-2">
        <h2 className={`text-xl font-bold ${features[3].textColor || 'text-white'}`}>
          {features[3].title}
        </h2>
      </div>
      <p className={`text-sm mb-2 ${features[3].textColor ? 'text-gray-700' : 'text-white/90'}`}>
        {features[3].description}
      </p>
      {/* 帖子列表填满父容器 */}
      <div className="flex-1 overflow-auto space-y-1">
        {communityPosts.map((post, idx) => (
          <motion.div
            key={post.id}
            className="relative bg-white/90 rounded border border-purple-100 p-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.07, duration: 0.4, type: 'spring' }}
          >
            {/* 右上角标签 */}
            {(post.isHot || post.isRecommended) && (
              <div className="absolute top-2 right-2 flex items-center space-x-1">
                {post.isHot && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow">热帖</span>
                )}
                {post.isRecommended && (
                  <span className="bg-yellow-400 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow flex items-center">
                    <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.122-6.545L.488 6.91l6.561-.955L10 0l2.951 5.955 6.561.955-4.756 4.635 1.122 6.545z"/></svg>
                    推荐
                  </span>
                )}
              </div>
            )}
            <div className="font-semibold text-purple-700 mb-0.5">{post.title}</div>
            <div
              className="text-gray-700 text-sm"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'pre-line',
                lineHeight: '1.5em',
                maxHeight: '3em',
              }}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </motion.div>
        ))}
        {communityPosts.length === 0 && (
          <div className="text-gray-400 text-center">暂无帖子</div>
        )}
      </div>
      {/* 动画或icon始终贴底 */}
      <div className="flex justify-center mt-2">
        {features[3].type === 'animation' ? (
          <Player
            autoplay
            loop
            src={features[3].animation}
            style={{ height: '120px', width: '120px' }}
          />
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-6xl mb-2">{features[3].icon}</span>
            <div className="w-16 h-1 bg-white/30 rounded-full"></div>
          </div>
        )}
      </div>
</div>
            </motion.div>
          </div>
        </motion.div>

        {/* 热门题库区域 */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-purple-800 mb-6 text-center">🔥 热门题库</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {hotTopics.map((topic, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border border-purple-200"
                onClick={() => router.push('/interview/special')}
                whileHover={{ 
                  y: -5,
                  scale: 1.02,
                  boxShadow: "0 10px 25px -5px rgba(139, 92, 246, 0.2)"
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`${topic.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3 shadow-md`}>
                  <span className="text-white text-lg font-bold">{index + 1}</span>
                </div>
                <h3 className="font-semibold text-purple-800 text-sm mb-2">{topic.name}</h3>
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>{topic.count}人练习</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    topic.difficulty === '困难' ? 'bg-red-100 text-red-600' :
                    topic.difficulty === '中等' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {topic.difficulty}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 个性化路径推荐区域 */}
        <motion.div 
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-purple-200 mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <h2 className="text-3xl font-bold text-purple-800 mb-8 text-center">🎯 个性化路径推荐</h2>
          
          {/* 当前目标 */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-purple-700 mb-4">🎯 当前目标</h3>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold text-purple-800">{recommendations.currentGoal.title}</h4>
                  <p className="text-purple-600">{recommendations.currentGoal.company} • {recommendations.currentGoal.salary}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">{recommendations.currentGoal.matchRate}%</div>
                  <div className="text-sm text-purple-500">匹配度</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 推荐企业 */}
            <div>
              <h3 className="text-xl font-bold text-purple-700 mb-4">🏢 推荐企业</h3>
              <div className="space-y-3">
                {recommendations.recommendedCompanies.map((company, index) => (
                  <motion.div
                    key={index}
                    className="bg-white rounded-lg p-4 border border-purple-200 hover:shadow-md transition-all duration-300 cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{company.logo}</span>
                        <div>
                          <h4 className="font-semibold text-purple-800">{company.name}</h4>
                          <p className="text-sm text-gray-600">{company.position}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-purple-600">{company.matchRate}%</div>
                        <div className="text-xs text-purple-500">匹配度</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* 推荐题库 */}
            <div>
              <h3 className="text-xl font-bold text-purple-700 mb-4">📚 推荐题库</h3>
              <div className="space-y-3">
                {recommendations.recommendedTopics.map((topic, index) => (
                  <motion.div
                    key={index}
                    className="bg-white rounded-lg p-4 border border-purple-200 hover:shadow-md transition-all duration-300 cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-purple-800">{topic.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            topic.difficulty === '困难' ? 'bg-red-100 text-red-600' :
                            topic.difficulty === '中等' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            {topic.difficulty}
                          </span>
                          <span className="text-xs text-gray-500">{topic.count}题</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-purple-600">{topic.matchRate}%</div>
                        <div className="text-xs text-purple-500">匹配度</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* 多维度能力评估
          <div className="mt-8">
            <h3 className="text-xl font-bold text-purple-700 mb-4">📊 多维度能力评估</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <ReactECharts 
                  option={skillMatchOption} 
                  style={{ height: '300px' }}
                  opts={{ renderer: 'canvas' }}
                />
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <ReactECharts 
                  option={pieOption} 
                  style={{ height: '300px' }}
                  opts={{ renderer: 'canvas' }}
                />
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <ReactECharts 
                  option={trendOption} 
                  style={{ height: '300px' }}
                  opts={{ renderer: 'canvas' }}
                />
              </div>
            </div>
          </div> */}
        </motion.div>
      </div>
    </div>
    </ProtectedRoute>
  );
};

export default MainDashboard;