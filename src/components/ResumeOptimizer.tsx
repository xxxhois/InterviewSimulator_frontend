'use client';
import { getResumeOptimization } from '@/api/resume';
import { showToast } from '@/components/Toast';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface Resume {
  resume_id: number;
  resume_name: string;
}

interface ResumeOptimizerProps {
  isOpen: boolean;
  onClose: () => void;
  resumeList: Resume[];
  onApplyOptimization?: (optimizationData: any) => void;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ResumeOptimizer({ 
  isOpen, 
  onClose, 
  resumeList, 
  onApplyOptimization 
}: ResumeOptimizerProps) {
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 初始化欢迎消息
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        type: 'assistant',
        content: '你好！我是简历优化助手。请选择一份简历，我可以帮你分析并提供优化建议。',
        timestamp: new Date()
      }]);
    }
  }, [isOpen, messages.length]);

  // 发送消息
  const sendMessage = async (content: string) => {
    if (!selectedResumeId) {
      showToast('请先选择一份简历');
      return;
    }

    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsStreaming(true);

    try {
      // 创建助手消息
      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantMessageId,
        type: 'assistant',
        content: '',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // 调用API获取流式响应
      await getResumeOptimization(selectedResumeId, content, (chunk: string) => {
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: msg.content + chunk }
            : msg
        ));
      });

      // 添加应用按钮
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: msg.content + '\n\n[应用优化建议]' }
            : msg
        ));
      }, 500);

    } catch (error) {
      showToast('发送消息失败');
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  // 应用优化建议
  const applyOptimization = () => {
    if (onApplyOptimization) {
      onApplyOptimization({
        resumeId: selectedResumeId,
        optimizationType: 'general',
        suggestions: messages.filter(m => m.type === 'assistant').map(m => m.content)
      });
      showToast('优化建议已应用');
      onClose();
    }
  };

  // 处理回车发送
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 right-0 h-full w-[500px] bg-white shadow-2xl z-50 flex flex-col border-l border-purple-200"
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-purple-200">
            <h2 className="text-xl font-bold text-purple-700">智能简历优化</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="material-icons">close</span>
            </button>
          </div>

          {/* 简历选择 */}
          <div className="p-6 border-b border-purple-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择要优化的简历
            </label>
            <select
              value={selectedResumeId || ''}
              onChange={(e) => setSelectedResumeId(Number(e.target.value) || null)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500"
            >
              <option value="">请选择简历</option>
              {resumeList.map(resume => (
                <option key={resume.resume_id} value={resume.resume_id}>
                  {resume.resume_name}
                </option>
              ))}
            </select>
          </div>

          {/* 对话区域 */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.type === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    {message.type === 'assistant' && message.content.includes('[应用优化建议]') && (
                      <button
                        onClick={applyOptimization}
                        className="mt-3 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                      >
                        直接应用优化建议
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 rounded-lg px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                      <span>正在分析...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 输入区域 */}
            <div className="p-6 border-t border-purple-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入您的问题或需求..."
                  disabled={isStreaming}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 disabled:bg-gray-100"
                />
                <button
                  onClick={() => sendMessage(inputValue)}
                  disabled={!inputValue.trim() || isStreaming}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  发送
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
