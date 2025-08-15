'use client';

import { NonAlgorithmSubmissionAnalysis } from '@/types/problem';
import { useEffect, useState } from 'react';
import { MdClose, MdOutlineAnalytics, MdOutlineLightbulb, MdOutlineTrendingUp } from 'react-icons/md';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisData: NonAlgorithmSubmissionAnalysis | null;
}

export default function AnalysisModal({ isOpen, onClose, analysisData }: AnalysisModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
      isOpen ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* 背景遮罩 - 半透明 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-30"
        onClick={onClose}
      />
      
      {/* 弹窗内容 */}
      <div className={`relative w-full max-w-3xl mx-4 max-h-[85vh] bg-white rounded-2xl shadow-xl transform transition-all duration-300 ${
        isOpen ? 'scale-100' : 'scale-95'
      }`}>
        {/* 弹窗头部 */}
        <div className="bg-purple-500 rounded-t-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MdOutlineAnalytics className="text-2xl text-white" />
              <div>
                <h2 className="text-xl font-bold text-white">答题评析结果</h2>
                <p className="text-purple-100 text-sm">查看你的答题表现</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-purple-600 rounded-full transition-colors"
            >
              <MdClose className="text-xl" />
            </button>
          </div>
        </div>

        {/* 弹窗内容区域 - 可滚动 */}
        <div className="overflow-y-auto max-h-[calc(85vh-140px)] p-6">
          {analysisData ? (
            <div className="space-y-6">
              {/* 成绩概览 */}
              <div className="bg-purple-50 rounded-xl p-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{analysisData.total_score}</div>
                    <div className="text-sm text-purple-600">总分</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{analysisData.accuracy_rate}%</div>
                    <div className="text-sm text-purple-600">正确率</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{analysisData.total_problems}</div>
                    <div className="text-sm text-purple-600">总题数</div>
                  </div>
                </div>
              </div>

              {/* 整体分析 */}
              {analysisData.overall_analysis && (
                <div className="bg-white rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <MdOutlineTrendingUp className="text-purple-500" />
                    <h3 className="font-semibold text-gray-800">整体表现</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {analysisData.overall_analysis}
                  </p>
                </div>
              )}

              {/* 详细题目评析 */}
              {analysisData.answers && analysisData.answers.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <MdOutlineLightbulb className="text-purple-500" />
                    <h3 className="font-semibold text-gray-800">题目评析</h3>
                  </div>
                  {analysisData.answers.map((answer, index) => (
                    <div key={index} className="bg-white rounded-xl p-4 border border-purple-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-800">第 {index + 1} 题</h4>
                        <div className="text-sm text-purple-600">
                          {answer.score} / {answer.max_score}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm font-medium text-gray-600 mb-1">题目</div>
                          <div className="text-sm text-gray-700 bg-gray-50 rounded p-2">
                            {answer.problem_question}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium text-gray-600 mb-1">你的答案</div>
                          <div className="text-sm text-gray-700 bg-gray-50 rounded p-2 max-h-16 overflow-y-auto">
                            {answer.user_answer}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium text-gray-600 mb-1">评析</div>
                          <div className="text-sm text-gray-700 bg-gray-50 rounded p-2">
                            {answer.analysis}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">暂无评析数据</p>
            </div>
          )}
        </div>

        {/* 弹窗底部 */}
        <div className="bg-gray-50 rounded-b-2xl p-4 border-t border-gray-200">
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
