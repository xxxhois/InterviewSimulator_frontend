'use client';

import { getProblemDetail } from "@/api/code";
import Navigation from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { showToast } from "@/components/Toast";
import type { ProblemDetailResponse } from "@/types/problem";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { FaRegCheckCircle } from 'react-icons/fa';
import { MdError, MdOutlineArrowBack, MdOutlineEditNote, MdOutlineSend, MdOutlineTimer } from 'react-icons/md';

export default function NonAlgorithmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const problemSetId = searchParams.get('problemSetId');
  
  const [problemData, setProblemData] = useState<ProblemDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // 计时器
  useEffect(() => {
    if (!loading && problemData) {
      const timer = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [loading, problemData]);

  // 获取题目数据
  useEffect(() => {
    const fetchProblemDetail = async () => {
      if (!problemSetId) {
        setError('缺少题库ID参数');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await getProblemDetail(problemSetId);
        setProblemData(response);
      } catch (err) {
        console.error('获取题目详情失败:', err);
        setError('网络错误，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchProblemDetail();
  }, [problemSetId]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (problemId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [problemId]: answer
    }));
  };

  // 检查答案完整性
  const checkAnswerCompleteness = () => {
    if (!problemData) return null;
    
    const totalProblems = problemData.problems.length;
    const answeredProblems = Object.keys(answers).length;
    const emptyAnswers = Object.values(answers).filter(answer => !answer.trim()).length;
    
    return {
      total: totalProblems,
      answered: answeredProblems,
      completed: answeredProblems - emptyAnswers,
      hasEmptyAnswers: emptyAnswers > 0,
      completionRate: Math.round(((answeredProblems - emptyAnswers) / totalProblems) * 100)
    };
  };

  // 提交答案
  const handleSubmit = async () => {
    if (!problemData || !problemSetId) return;

    const completeness = checkAnswerCompleteness();
    if (!completeness) return;
    
    // 检查是否有未作答的题目
    if (completeness.hasEmptyAnswers) {
      const emptyCount = completeness.total - completeness.completed;
      showToast(`还有 ${emptyCount} 道题目未作答，请检查后再次提交`);
      return;
    }

    // 确认提交
    const confirmed = window.confirm(
      `确认提交答案吗？\n\n` +
      `总题数：${completeness.total}\n` +
      `已完成：${completeness.completed}\n` +
      `完成率：${completeness.completionRate}%\n` +
      `用时：${formatTime(timeSpent)}`
    );

    if (!confirmed) return;

    setSubmitting(true);
    try {
      // TODO: 调用提交接口
      // const response = await submitAnswers({
      //   problemSetId,
      //   answers,
      //   timeSpent,
      //   completionRate: completeness.completionRate
      // });

      // 模拟提交延迟
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showToast('答案提交成功！');
      
      // 提交成功后可以跳转到结果页面或返回题库列表
      setTimeout(() => {
        router.push('/written-test/list');
      }, 1500);
      
    } catch (error) {
      console.error('提交答案失败:', error);
      showToast('提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const currentProblem = problemData?.problems?.[currentProblemIndex];

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 flex items-center justify-center">
          <div className="text-center">
            <AiOutlineLoading3Quarters className="text-4xl text-purple-500 animate-spin mx-auto mb-4" />
            <p className="text-purple-600">正在加载题目...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !problemData) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 flex items-center justify-center">
          <div className="text-center">
            <MdError className="text-4xl text-red-500 mx-auto mb-4" />
            <p className="text-red-500">{error || '加载失败'}</p>
            <button 
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              返回
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100">
        <Navigation />
        
        {/* 头部信息 */}
        <div className="pt-20 pb-6">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => router.back()}
                  className="flex items-center text-purple-600 hover:text-purple-700 transition-colors"
                >
                  <MdOutlineArrowBack className="mr-2" />
                  返回题库列表
                </button>
                <div className="flex items-center text-purple-600">
                  <MdOutlineTimer className="mr-2" />
                  <span className="font-mono">{formatTime(timeSpent)}</span>
                </div>
              </div>
              
              <div className="text-center">
                <h1 className="text-2xl font-bold text-purple-800 mb-2">
                  {problemData.problem_bank.title}
                </h1>
                <p className="text-gray-600 mb-4">{problemData.problem_bank.description}</p>
                
                <div className="flex justify-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center">
                    <MdOutlineEditNote className="mr-1" />
                    <span>共 {problemData.problems.length} 道题目</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-1"></span>
                    <span>已完成 {Object.keys(answers).length} 道</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                    <span>完成率 {checkAnswerCompleteness()?.completionRate || 0}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 题目列表侧边栏 */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-4 border border-purple-200 sticky top-24">
                <h3 className="text-lg font-semibold text-purple-800 mb-4">题目导航</h3>
                <div className="grid grid-cols-5 lg:grid-cols-3 gap-2">
                  {problemData.problems.map((problem, index) => (
                    <button
                      key={problem.id}
                      onClick={() => setCurrentProblemIndex(index)}
                      className={`p-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        currentProblemIndex === index
                          ? 'bg-purple-500 text-white shadow-md'
                          : answers[problem.id]
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 题目内容区域 */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-purple-200">
                {currentProblem && (
                  <>
                    {/* 题目头部 */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-purple-100">
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl font-bold text-purple-600">
                          第 {currentProblemIndex + 1} 题
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          currentProblem.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                          currentProblem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {currentProblem.difficulty}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {currentProblemIndex + 1} / {problemData.problems.length}
                      </div>
                    </div>

                    {/* 题目内容 */}
                    <div className="mb-8">
                      <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        {currentProblem.title}
                      </h2>
                      
                      {currentProblem.scenario && (
                        <div className="bg-purple-50 rounded-lg p-4 mb-4 border-l-4 border-purple-300">
                          <h3 className="font-medium text-purple-800 mb-2">场景描述</h3>
                          <p className="text-gray-700">{currentProblem.scenario}</p>
                        </div>
                      )}

                      <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <h3 className="font-medium text-gray-800 mb-2">题目要求</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{currentProblem.question}</p>
                      </div>

                      {/* 答案输入区域 */}
                      <div className="space-y-4">
                        <h3 className="font-medium text-gray-800">你的答案：</h3>
                        <textarea
                          value={answers[currentProblem.id] || ''}
                          onChange={(e) => handleAnswerChange(currentProblem.id, e.target.value)}
                          placeholder="请在此输入你的答案..."
                          className="w-full h-32 p-4 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        />
                      </div>
                    </div>

                    {/* 导航按钮 */}
                    <div className="flex justify-between items-center pt-6 border-t border-purple-100">
                      <button
                        onClick={() => setCurrentProblemIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentProblemIndex === 0}
                        className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        上一题
                      </button>
                      
                      <div className="flex items-center space-x-2">
                        {answers[currentProblem.id] && (
                          <FaRegCheckCircle className="text-green-500" />
                        )}
                        <span className="text-sm text-gray-500">
                          {answers[currentProblem.id] ? '已作答' : '未作答'}
                        </span>
                      </div>

                      <button
                        onClick={() => setCurrentProblemIndex(prev => Math.min(problemData.problems.length - 1, prev + 1))}
                        disabled={currentProblemIndex === problemData.problems.length - 1}
                        className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        下一题
                      </button>
                    </div>

                    {/* 提交按钮 */}
                    <div className="flex justify-center mt-6">
                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex items-center px-8 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? (
                          <>
                            <AiOutlineLoading3Quarters className="mr-2 animate-spin" />
                            提交中...
                          </>
                        ) : (
                          <>
                            <MdOutlineSend className="mr-2" />
                            提交答案
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}