'use client';
import { getProblemBanks } from "@/api/code";
import Navigation from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import type { ProblemBank } from "@/types/problem";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
// 导入技术栈图标
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import {
  FaChartLine,
  FaCode
} from 'react-icons/fa';
import {
  MdError,
  MdOutlineEditNote,
  MdSearch,
  MdSpeed
} from 'react-icons/md';
import {
  SiDatadog,
  SiFigma,
  SiGoogleanalytics,
  SiJavascript,
  SiMysql,
  SiNodedotjs,
  SiPython,
  SiReact,
  SiSelenium,
  SiSpring,
  SiTensorflow,
  SiVuedotjs
} from 'react-icons/si';

export default function WrittenTestListPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [searchTerm, setSearchTerm] = useState('');
  const [problemBanks, setProblemBanks] = useState<ProblemBank[]>([]);
  const [filteredProblems, setFilteredProblems] = useState<ProblemBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 图标匹配函数
  const getIconForProblemBank = (problemBank: ProblemBank) => {
    const { id, title, tags } = problemBank;
    const searchText = `${id} ${title} ${tags.join(' ')}`.toLowerCase();
    
    if (searchText.includes('react')) {
      return <SiReact className="text-3xl text-white" />;
    }
    if (searchText.includes('vue')) {
      return <SiVuedotjs className="text-3xl text-white" />;
    }
    if (searchText.includes('javascript') || searchText.includes('js')) {
      return <SiJavascript className="text-3xl text-white" />;
    }
    if (searchText.includes('python')) {
      return <SiPython className="text-3xl text-white" />;
    }
    if (searchText.includes('java') || searchText.includes('spring')) {
      return <SiSpring className="text-3xl text-white" />;
    }
    if (searchText.includes('node') || searchText.includes('express')) {
      return <SiNodedotjs className="text-3xl text-white" />;
    }
    if (searchText.includes('mysql') || searchText.includes('sql')) {
      return <SiMysql className="text-3xl text-white" />;
    }
    if (searchText.includes('selenium') || searchText.includes('test')) {
      return <SiSelenium className="text-3xl text-white" />;
    }
    if (searchText.includes('tensorflow') || searchText.includes('ml') || searchText.includes('ai')) {
      return <SiTensorflow className="text-3xl text-white" />;
    }
    if (searchText.includes('figma') || searchText.includes('design')) {
      return <SiFigma className="text-3xl text-white" />;
    }
    if (searchText.includes('analytics') || searchText.includes('data')) {
      return <SiGoogleanalytics className="text-3xl text-white" />;
    }
    if (searchText.includes('datadog') || searchText.includes('monitor')) {
      return <SiDatadog className="text-3xl text-white" />;
    }
    if (searchText.includes('speed') || searchText.includes('performance')) {
      return <MdSpeed className="text-3xl text-white" />;
    }
    if (searchText.includes('chart') || searchText.includes('visualization')) {
      return <FaChartLine className="text-3xl text-white" />;
    }
    // 默认图标
    return <FaCode className="text-3xl text-white" />;
  };

  // 获取题库数据
  useEffect(() => {
    const fetchProblemBanks = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getProblemBanks();
        if (response.success) {
          setProblemBanks(response.data);
        } else {
          setError('获取题库数据失败');
        }
      } catch (err) {
        console.error('获取题库数据失败:', err);
        setError('网络错误，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchProblemBanks();
  }, []);

  // 动态获取分类列表
  const categories = ['全部', ...Array.from(new Set(problemBanks.map(bank => bank.category)))];

  // 筛选逻辑
  useEffect(() => {
    let filtered = problemBanks;
    
    if (selectedCategory !== '全部') {
      filtered = filtered.filter(problem => problem.category === selectedCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(problem => 
        problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        problem.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        problem.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredProblems(filtered);
  }, [selectedCategory, searchTerm, problemBanks]);



  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getProgressPercentage = (completed: number, total: number) => {
    return Math.round((completed / total) * 100);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-purple-200">
        <Navigation />
        
        {/* 头部区域 */}
        <div className="pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
                              <h1 className="text-4xl font-bold text-purple-600 mb-4">
                机试题库
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                精选技术面试题目，涵盖前后端开发、算法设计、测试开发、产品设计、数据分析等多个领域
              </p>
            </div>

            {/* 搜索栏 */}
            <div className="max-w-md mx-auto mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索题库..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-purple-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 分类导航 */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedCategory === category
                      ? 'bg-purple-500 text-white shadow-lg transform scale-105'
                      : 'bg-white text-purple-600 border border-purple-200 hover:bg-purple-50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

                 {/* 题库卡片网格 */}
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
           {loading ? (
             <div className="text-center py-12">
               <div className="flex justify-center mb-4">
                 <AiOutlineLoading3Quarters className="text-6xl text-purple-500 animate-spin" />
               </div>
               <h3 className="text-xl font-semibold text-gray-600 mb-2">正在加载题库...</h3>
               <p className="text-gray-500">请稍候</p>
             </div>
           ) : error ? (
             <div className="text-center py-12">
               <div className="flex justify-center mb-4">
                 <MdError className="text-6xl text-red-500" />
               </div>
               <h3 className="text-xl font-semibold text-gray-600 mb-2">加载失败</h3>
               <p className="text-gray-500">{error}</p>
             </div>
           ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProblems.map((problemSet) => (
                <div
                  key={problemSet.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-purple-100 overflow-hidden group cursor-pointer"
                                     onClick={() => {
                     if (problemSet.is_algorithm) {
                       router.push(`/written-test/ide?problemSetId=${problemSet.id}`);
                     } else {
                       router.push(`/written-test/non-algorithm?problemSetId=${problemSet.id}`);
                     }
                   }}
                >
                  {/* 卡片头部 - 渐变背景 */}
                  <div className={`h-32 bg-purple-300 relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                    <div className="absolute top-4 left-4">
                      {getIconForProblemBank(problemSet)}
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(problemSet.difficulty)}`}>
                        {problemSet.difficulty}
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white font-bold text-lg mb-1 group-hover:scale-105 transition-transform">
                        {problemSet.title}
                      </h3>
                    </div>
                  </div>

                  {/* 卡片内容 */}
                  <div className="p-6">
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {problemSet.description}
                    </p>

                    {/* 标签 */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {problemSet.tags.slice(0, 3).map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* 进度信息 */}
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">进度</span>
                        <span className="text-purple-600 font-semibold">
                          {problemSet.completed_count}/{problemSet.problem_count} ({getProgressPercentage(problemSet.completed_count, problemSet.problem_count)}%)
                        </span>
                      </div>
                      
                      {/* 进度条 */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${getProgressPercentage(problemSet.completed_count, problemSet.problem_count)}%` }}
                        ></div>
                      </div>

                      {/* 题目数量 */}
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-sm text-gray-500">
                          <span className="inline-flex items-center">
                            <MdOutlineEditNote className="inline-block mr-1 text-lg text-purple-500" />
                            {problemSet.problem_count} 道题目
                          </span>
                        </span>
                        <button className="text-purple-600 text-sm font-medium hover:text-purple-700 transition-colors">
                          开始练习 →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

                     {/* 空状态 */}
           {!loading && !error && filteredProblems.length === 0 && (
             <div className="text-center py-12">
               <div className="flex justify-center mb-4">
                 <MdSearch className="text-6xl text-gray-400" />
               </div>
               <h3 className="text-xl font-semibold text-gray-600 mb-2">没有找到相关题库</h3>
               <p className="text-gray-500">尝试调整搜索条件或选择其他分类</p>
             </div>
           )}
        </div>

        {/* 统计信息 */}
        <div className="bg-white border-t border-purple-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-600">{problemBanks.length}</div>
                <div className="text-sm text-gray-500">题库总数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {problemBanks.reduce((sum: number, set: ProblemBank) => sum + set.problem_count, 0)}
                </div>
                <div className="text-sm text-gray-500">题目总数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {problemBanks.reduce((sum: number, set: ProblemBank) => sum + set.completed_count, 0)}
                </div>
                <div className="text-sm text-gray-500">已完成</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{categories.length - 1}</div>
                <div className="text-sm text-gray-500">技术领域</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}