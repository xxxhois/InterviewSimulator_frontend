'use client';

import { evaluateCode, getAlgorithmProblems, getHint, runCode } from '@/api/code';
import { useAuthStore } from '@/store/authStore';
import { AlgorithmProblem, CodeProblemResult, CodeSubmissionRequest, TestCase } from '@/types/problem';
import Editor from '@monaco-editor/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  FaArrowRight,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaClock,
  FaCode,
  FaEye,
  FaEyeSlash,
  FaPaperPlane,
  FaPause,
  FaPlay,
  FaTerminal,
  FaTimes
} from 'react-icons/fa';

const languages = [
  { name: 'C++', id: 54, monacoLang: 'cpp' },
  { name: 'Java', id: 62, monacoLang: 'java' },
  { name: 'Python', id: 71, monacoLang: 'python' },
  { name: 'JavaScript', id: 63, monacoLang: 'javascript' },
];

// 默认代码模板
const getDefaultCode = (languageId: number, template?: string) => {
  if (template) {
    return template;
  }
  
  switch (languageId) {
    case 54: // C++
      return `#include <iostream>
using namespace std;

int main() {
    // 在这里编写你的代码
    cout << "Hello, World!" << endl;
    return 0;
}`;
    case 62: // Java
      return `public class Main {
    public static void main(String[] args) {
        // 在这里编写你的代码
        System.out.println("Hello, World!");
    }
}`;
    case 71: // Python
      return `# 在这里编写你的代码
print("Hello, World!")`;
    case 63: // JavaScript
      return `// 在这里编写你的代码
console.log("Hello, World!");`;
    default:
      return `print("Hello, World!")`;
  }
};

export default function WrittenTestPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const problemSetId = searchParams.get('id') || 'basic-algorithm';
  
  const [problemList, setProblemList] = useState<AlgorithmProblem[]>([]);
  const [currentProblem, setCurrentProblem] = useState<AlgorithmProblem | null>(null);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [languageId, setLanguageId] = useState(71);
  const [monacoLang, setMonacoLang] = useState('python');
  const [code, setCode] = useState('');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publicTestCases, setPublicTestCases] = useState<TestCase[]>([]);
  const [hiddenTestCases, setHiddenTestCases] = useState<TestCase[]>([]);
  const [showProblemList, setShowProblemList] = useState(false);
  const [expandedPublicCases, setExpandedPublicCases] = useState<number[]>([]);
  
  // 新增状态
  const [codeCache, setCodeCache] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState<CodeProblemResult[]>([]);
  
  // 计时器相关状态
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastCodeChange, setLastCodeChange] = useState<number>(Date.now());
  const [timeRemaining, setTimeRemaining] = useState<number>(30); // 30秒倒计时
  
  // 打字机效果相关状态
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypingIndex, setCurrentTypingIndex] = useState(0);
  
  // 提示状态管理 - 记录每道题是否已经请求过提示
  const [hintRequested, setHintRequested] = useState<Record<string, boolean>>({});
  // 自动生成开关：开启时，长时间不动才会自动生成
  const [autoGenerateEnabled, setAutoGenerateEnabled] = useState<boolean>(false);

  // 关闭评测弹窗并返回list页面
  const handleCloseEvaluationModal = () => {
    setShowEvaluationModal(false);
    router.push('/written-test/list');
  };

  // 发送提示请求
  const sendHintRequest = async () => {
    if (!currentProblem) {
      console.log('没有当前题目，跳过提示请求');
      return;
    }
    
    // 检查是否已经请求过提示
    if (hintRequested[currentProblem.id]) {
      console.log('该题目已经请求过提示，跳过');
      return;
    }
    
    console.log('开始发送提示请求...');
    
    try {
      const requestBody = {
        problem_id: currentProblem.id,
        problem_description: currentProblem.description,
        problem_question: currentProblem.question,
        current_code: code,
        language: languages.find(l => l.id === languageId)?.name || 'Python'
      };
      
      console.log('请求体:', requestBody);
      
      const response = await getHint(requestBody);
      
      console.log('API响应:', response);
      
      if (response.success && response.data) {
        console.log('收到提示:', response);
        // 标记该题目已请求过提示
        setHintRequested(prev => ({
          ...prev,
          [currentProblem.id]: true
        }));
        // 提取纯代码内容，去除Markdown格式
        const cleanCode = extractCodeFromMarkdown(response.data.code_suggestion);
        // 直接应用代码建议，不显示弹窗
        startTypingEffect(cleanCode);
      } else {
        console.log('提示请求失败:', response);
      }
    } catch (error) {
      console.error('发送提示请求失败:', error);
    }
  };

  // 从Markdown代码块中提取纯代码
  const extractCodeFromMarkdown = (markdownCode: string): string => {
    // 移除开头的 ```python 或 ``` 等标记
    let cleanCode = markdownCode.replace(/^```\w*\n?/, '');
    // 移除结尾的 ``` 标记
    cleanCode = cleanCode.replace(/```$/, '');
    return cleanCode.trim();
  };

  // 重置计时器
  const resetInactivityTimer = () => {
    // 清除现有计时器
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
    
    // 重置倒计时
    setTimeRemaining(30);
    
    // 若未开启自动生成，则不启动定时器
    if (!autoGenerateEnabled) {
      setInactivityTimer(null);
      setLastCodeChange(Date.now());
      return;
    }

    // 设置新的计时器（30秒）
    const timer = setTimeout(() => {
      console.log('计时器触发，发送提示请求');
      sendHintRequest();
    }, 30000);
    
    setInactivityTimer(timer);
    setLastCodeChange(Date.now());
  };

  // 代码变化处理函数
  const handleCodeChange = (value: string | undefined) => {
    setCode(value || '');
    resetInactivityTimer();
  };

  // 打字机效果函数
  const startTypingEffect = (codeToType: string) => {
    setIsTyping(true);
    setCurrentTypingIndex(0);
    
    // 清空当前代码，从头开始输入
    setCode('');
    
    const typeNextChar = (index: number) => {
      if (index < codeToType.length) {
        // 构建到当前索引的完整代码
        const currentCode = codeToType.substring(0, index + 1);
        setCode(currentCode);
        setCurrentTypingIndex(index + 1);
        setTimeout(() => typeNextChar(index + 1), 30); // 30ms 延迟，可以调整速度
      } else {
        setIsTyping(false);
      }
    };
    
    typeNextChar(0);
  };



  // 模拟用户数据
  const user = useAuthStore().user?.username;

  // 获取题目数据
  useEffect(() => {
    const fetchProblems = async () => {
      setLoadingData(true);
      setError(null);
      try {
        const response = await getAlgorithmProblems(problemSetId);
        if (response.success) {
          setProblemList(response.problems);
          if (response.problems.length > 0) {
            setCurrentProblem(response.problems[0]);
            setCurrentProblemIndex(0);
            // 从缓存加载代码，如果没有则使用默认代码
            const cachedCode = codeCache[response.problems[0].id];
            const defaultCode = getDefaultCode(languageId, response.problems[0].code_template);
            setCode(cachedCode || defaultCode);
            setPublicTestCases(response.problems[0].test_cases.public);
            setHiddenTestCases(response.problems[0].test_cases.hidden);
            // 初始化计时器
            resetInactivityTimer();
          }
        } else {
          setError('获取题目数据失败');
        }
      } catch (err) {
        console.error('获取题目数据失败:', err);
        setError('获取题目数据失败');
      } finally {
        setLoadingData(false);
      }
    };

    fetchProblems();
  }, [problemSetId]);

  // 倒计时效果
  useEffect(() => {
    if (!autoGenerateEnabled) return; // 关闭时不倒计时、不触发
    if (timeRemaining > 0 && !isTyping) {
      const countdownTimer = setTimeout(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          console.log(`倒计时: ${newTime}s`);
          return newTime;
        });
      }, 1000);
      
      return () => clearTimeout(countdownTimer);
    } else if (timeRemaining === 0 && !isTyping && currentProblem && !hintRequested[currentProblem.id]) {
      console.log('倒计时结束，手动触发提示请求');
      sendHintRequest();
    }
  }, [timeRemaining, isTyping, currentProblem, hintRequested, autoGenerateEnabled]);

  // 组件卸载时清理计时器
  useEffect(() => {
    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        console.log('组件卸载，清理计时器');
      }
    };
  }, [inactivityTimer]);

  const handleLanguageChange = (langId: number) => {
    const lang = languages.find((l) => l.id === langId);
    setLanguageId(langId);
    setMonacoLang(lang?.monacoLang || 'python');
    if (currentProblem) {
      // 保存当前代码到缓存
      setCodeCache(prev => ({
        ...prev,
        [currentProblem.id]: code
      }));
      // 加载新语言的代码
      const cachedCode = codeCache[currentProblem.id];
      const defaultCode = getDefaultCode(langId, currentProblem.code_template);
      setCode(cachedCode || defaultCode);
    }
  };

  const handleProblemChange = (problem: AlgorithmProblem) => {
    // 保存当前代码到缓存
    if (currentProblem) {
      setCodeCache(prev => ({
        ...prev,
        [currentProblem.id]: code
      }));
    }
    
    setCurrentProblem(problem);
    setCurrentProblemIndex(problemList.findIndex(p => p.id === problem.id));
    setInput('');
    setOutput('');
    
    // 从缓存加载代码，如果没有则使用默认代码
    const cachedCode = codeCache[problem.id];
    const defaultCode = getDefaultCode(languageId, problem.code_template);
    setCode(cachedCode || defaultCode);
    
    setPublicTestCases(problem.test_cases.public.map(tc => ({ ...tc, status: 'pending' as const, actualOutput: '', error: '' })));
    setHiddenTestCases(problem.test_cases.hidden.map(tc => ({ ...tc, status: 'pending' as const })));
    
    // 切换题目时重置计时器（只有未请求过提示的题目才重置）
    if (!hintRequested[problem.id]) {
      resetInactivityTimer();
    }
  };

  // 下一题按钮
  const handleNextProblem = () => {
    if (currentProblemIndex < problemList.length - 1) {
      const nextProblem = problemList[currentProblemIndex + 1];
      handleProblemChange(nextProblem);
    }
  };

  // 上一题按钮
  const handlePrevProblem = () => {
    if (currentProblemIndex > 0) {
      const prevProblem = problemList[currentProblemIndex - 1];
      handleProblemChange(prevProblem);
    }
  };

  // 提交评测
  const handleSubmitEvaluation = async () => {
    if (!currentProblem) return;
    
    setSubmitting(true);
    try {
      // 保存当前代码到缓存
      setCodeCache(prev => ({
        ...prev,
        [currentProblem.id]: code
      }));
      
      // 准备提交数据
      const submission: CodeSubmissionRequest = {
        problem_answers: problemList.map(problem => ({
          problem_id: problem.id,
          source_code: codeCache[problem.id] || getDefaultCode(languageId, problem.code_template)
        }))
      };
      
      const response = await evaluateCode(submission);
      if (response.success) {
        setEvaluationResults(response.data);
        setShowEvaluationModal(true);
      } else {
        console.error('提交失败:', response);
      }
    } catch (error) {
      console.error('提交评测失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunCode = async () => {
    setLoading(true);
    try {
      const res = await runCode(code, languageId, input);
      setOutput(res.stdout || res.stderr || '无输出');
    } catch (error) {
      setOutput(`运行错误: ${error}`);
    }
    setLoading(false);
  };

  const runTestCase = async (testCase: TestCase, isPublic: boolean) => {
    // 更新测试用例状态为运行中
    if (isPublic) {
      setPublicTestCases(prev => prev.map(tc => 
        tc.id === testCase.id ? { ...tc, status: 'running' } : tc
      ));
    } else {
      setHiddenTestCases(prev => prev.map(tc => 
        tc.id === testCase.id ? { ...tc, status: 'running' } : tc
      ));
    }

    try {
      const res = await runCode(code, languageId, testCase.input);
      const actualOutput = res.stdout || '';
      const error = res.stderr || '';
      
      // 简单的输出比较（实际项目中可能需要更复杂的比较逻辑）
      const passed = actualOutput.trim() === testCase.expectedOutput?.trim() && !error;
      
      if (isPublic) {
        setPublicTestCases(prev => prev.map(tc => 
          tc.id === testCase.id ? { 
            ...tc, 
            status: passed ? 'passed' : 'failed',
            actualOutput,
            error
          } : tc
        ));
      } else {
        setHiddenTestCases(prev => prev.map(tc => 
          tc.id === testCase.id ? { 
            ...tc, 
            status: passed ? 'passed' : 'failed'
          } : tc
        ));
      }
    } catch (error) {
      if (isPublic) {
        setPublicTestCases(prev => prev.map(tc => 
          tc.id === testCase.id ? { 
            ...tc, 
            status: 'failed',
            error: `运行错误: ${error}`
          } : tc
        ));
      } else {
        setHiddenTestCases(prev => prev.map(tc => 
          tc.id === testCase.id ? { 
            ...tc, 
            status: 'failed'
          } : tc
        ));
      }
    }
  };

  const runAllPublicTests = async () => {
    for (const testCase of publicTestCases) {
      await runTestCase(testCase, true);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <FaClock className="text-yellow-400 animate-spin" />;
      case 'passed':
        return <FaCheck className="text-green-400" />;
      case 'failed':
        return <FaTimes className="text-red-400" />;
      default:
        return <FaPause className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-yellow-400';
      case 'passed':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'text-green-400';
      case 'medium':
        return 'text-yellow-400';
      case 'hard':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  // 展开/收起公开测试用例
  const togglePublicCase = (id: number) => {
    setExpandedPublicCases((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // 将约束条件对象转换为数组
  const getConstraintsArray = (constraints: any) => {
    if (!constraints) return [];
    return Object.entries(constraints).map(([key, value]) => {
      const keyMap: Record<string, string> = {
        time_complexity: '时间复杂度',
        space_complexity: '空间复杂度',
        array_length: '数组长度',
        target_range: '目标值范围'
      };
      return `${keyMap[key] || key}: ${value}`;
    });
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-400">加载题目数据中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  if (!currentProblem) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">暂无题目数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* 顶部用户信息栏 */}
      <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 px-6 py-3">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-semibold text-purple-400">
            {user || '用户'} 的笔试
          </h1>
                     <div className="flex items-center space-x-4">
             <span className="text-sm text-gray-400">
               题目 {currentProblemIndex + 1}/{problemList.length}: {currentProblem?.title}
             </span>
             
                          {/* 可视化计时器（仅在开关打开时显示） */}
              {!isTyping && autoGenerateEnabled && currentProblem && !hintRequested[currentProblem.id] && (
                <div className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded-lg">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${timeRemaining <= 5 ? 'bg-red-500' : timeRemaining <= 10 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  <span className="text-xs text-gray-300">
                    提示倒计时: {timeRemaining}s
                  </span>
                  <div className="w-16 h-2 bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ease-linear ${
                        timeRemaining <= 5 ? 'bg-red-500' : timeRemaining <= 10 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${(timeRemaining / 30) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {/* 已提示状态显示 */}
              {!isTyping && currentProblem && hintRequested[currentProblem.id] && (
                <div className="flex items-center gap-2 bg-green-700 px-3 py-1 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="text-xs text-green-200">
                    已获得提示
                  </span>
                </div>
              )}
             
              {/* 自动生成开关 */}
              <label className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded text-sm select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoGenerateEnabled}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    setAutoGenerateEnabled(enabled);
                    if (enabled) {
                      resetInactivityTimer();
                    } else if (inactivityTimer) {
                      clearTimeout(inactivityTimer);
                      setInactivityTimer(null);
                    }
                  }}
                />
                自动生成代码
              </label>
              
                          <button
                onClick={() => setShowProblemList(!showProblemList)}
                className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm"
              >
                {showProblemList ? '隐藏题目列表' : '显示题目列表'}
              </button>
           </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* 左侧：题目列表切换栏 */}
        {showProblemList && (
          <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto flex-shrink-0">
            <div className="p-4">
              <h3 className="text-md font-semibold text-purple-400 mb-3">题目列表</h3>
              <div className="space-y-2">
                {problemList.map((problem) => (
                  <div
                    key={problem.id}
                    onClick={() => handleProblemChange(problem)}
                    className={`p-3 rounded cursor-pointer transition-colors ${
                      currentProblem.id === problem.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium truncate">{problem.title}</span>
                      <span className={`text-xs ${getDifficultyColor(problem.difficulty)}`}>
                        {problem.difficulty}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">{problem.category}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 题目描述区域 */}
        <div className={`bg-gray-800 p-6 overflow-y-auto border-r border-gray-700 flex-shrink-0 ${showProblemList ? 'w-80' : 'w-1/4'}`}>
          <h1 className="text-xl font-bold text-purple-400 mb-4">{currentProblem.title}</h1>
          <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap mb-4">
            {currentProblem.description}
          </div>
          
          <div className="mb-4">
            <h3 className="text-md font-semibold text-purple-300 mb-2">题目要求：</h3>
            <div className="text-sm text-gray-300 leading-relaxed">
              {currentProblem.question}
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="text-md font-semibold text-purple-300 mb-2">场景描述：</h3>
            <div className="text-sm text-gray-300 leading-relaxed">
              {currentProblem.scenario}
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="text-md font-semibold text-purple-300 mb-2">约束条件：</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              {getConstraintsArray(currentProblem.constraints).map((constraint, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  {constraint}
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <h3 className="text-md font-semibold text-purple-300 mb-2">标签：</h3>
            <div className="flex flex-wrap gap-2">
              {currentProblem.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-purple-600 text-white text-xs rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 中间：代码编辑区 */}
        <div className="flex-1 bg-gray-900 flex flex-col min-h-0">
          {/* 语言选择器 - 固定在顶部 */}
          <div className="flex-shrink-0 p-4 border-b border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-purple-400">代码编辑器</h2>
              <div className="flex items-center gap-4">
                <select
                  className="bg-gray-800 text-white border border-purple-500 rounded px-3 py-2"
                  value={languageId}
                  onChange={(e) => handleLanguageChange(parseInt(e.target.value))}
                >
                  {languages.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.name}
                    </option>
                  ))}
                </select>
                
                {/* 题目导航按钮 */}
                <div className="flex gap-2">
                  <button
                    onClick={handlePrevProblem}
                    disabled={currentProblemIndex === 0}
                    className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 px-3 py-2 rounded text-sm flex items-center gap-1"
                  >
                    <FaArrowRight className="rotate-180 text-xs" />
                    上一题
                  </button>
                  <button
                    onClick={handleNextProblem}
                    disabled={currentProblemIndex === problemList.length - 1}
                    className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 px-3 py-2 rounded text-sm flex items-center gap-1"
                  >
                    下一题
                    <FaArrowRight className="text-xs" />
                  </button>
                </div>
              </div>
            </div>
          </div>

                     {/* 代码编辑器 - 可滚动区域 */}
           <div className="flex-1 min-h-0 overflow-hidden relative">
             {/* AI输入状态指示器 */}
             {isTyping && (
               <div className="absolute top-4 right-4 z-10 bg-blue-500 text-white px-3 py-1 rounded-lg flex items-center gap-2 shadow-lg">
                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                 <span className="text-sm font-medium">AI 正在输入代码...</span>
               </div>
             )}
             
             <Editor
               height="100%"
               defaultLanguage={monacoLang}
               language={monacoLang}
               value={code}
               onChange={handleCodeChange}
               theme="vs-dark"
               options={{
                 minimap: { enabled: false },
                 fontSize: 14,
                 lineNumbers: 'on',
                 roundedSelection: false,
                 scrollBeyondLastLine: false,
                 automaticLayout: true,
               }}
             />
           </div>

          {/* 输入区域和运行按钮 - 固定在底部 */}
          <div className="flex-shrink-0 p-4 border-t border-gray-700 bg-gray-900">
            <div className="mb-3">
              <label className="text-sm text-gray-400 block mb-1">标准输入：</label>
              <textarea
                rows={2}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm text-white"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="输入测试数据..."
              />
            </div>
            
            <div className="flex gap-2 mb-3">
              <button
                onClick={handleRunCode}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                <FaPlay className="text-sm" />
                {loading ? '运行中...' : '运行代码'}
              </button>
              <button
                onClick={runAllPublicTests}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white font-semibold flex items-center gap-2"
              >
                <FaCode className="text-sm" />
                运行所有公开测试
              </button>
              <button
                onClick={handleSubmitEvaluation}
                disabled={submitting || problemList.length === 0}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                <FaPaperPlane className="text-sm" />
                {submitting ? '提交中...' : '提交评测'}
              </button>
            </div>

            {output && (
              <div className="max-h-32 overflow-y-auto">
                <label className="text-sm text-gray-400 block mb-1 flex items-center gap-2">
                  <FaTerminal className="text-sm" />
                  输出结果：
                </label>
                <pre className="bg-gray-800 p-3 rounded text-green-300 whitespace-pre-wrap text-sm border border-gray-700">
                  {output}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* 右侧：测试用例 */}
        <div className="w-1/4 bg-gray-800 p-6 overflow-y-auto border-l border-gray-700">
          <h2 className="text-lg font-semibold text-purple-400 mb-4 flex items-center gap-2">
            <FaCode className="text-lg" />
            测试用例
          </h2>
          
          {/* 公开测试用例 */}
          <div className="mb-6">
            <h3 className="text-md font-semibold text-blue-400 mb-3 flex items-center gap-2">
              <FaEye className="text-sm" />
              公开测试用例 ({publicTestCases.length})
            </h3>
            <div className="space-y-3">
              {publicTestCases.map((testCase) => {
                const expanded = expandedPublicCases.includes(testCase.id);
                return (
                  <div key={testCase.id} className="bg-gray-700 rounded-lg border border-gray-600 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer select-none hover:bg-gray-650 transition-colors"
                      onClick={() => togglePublicCase(testCase.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                          {getStatusIcon(testCase.status)}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-200">{testCase.name}</span>
                          <div className="text-xs text-gray-400 mt-1">
                            {testCase.status === 'running' && '运行中...'}
                            {testCase.status === 'passed' && '通过'}
                            {testCase.status === 'failed' && '失败'}
                            {testCase.status === 'pending' && '待运行'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {expanded ? '收起' : '展开'}
                        </span>
                        {expanded ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                      </div>
                    </div>
                    {expanded && (
                      <div className="px-4 pb-4 border-t border-gray-600 bg-gray-750">
                        <div className="py-3 space-y-2">
                          <div className="text-xs">
                            <div className="text-gray-400 mb-1">输入:</div>
                            <div className="bg-gray-800 p-2 rounded text-gray-300 font-mono">
                              {testCase.input}
                            </div>
                          </div>
                          <div className="text-xs">
                            <div className="text-gray-400 mb-1">期望输出:</div>
                            <div className="bg-gray-800 p-2 rounded text-green-300 font-mono">
                              {testCase.expectedOutput}
                            </div>
                          </div>
                          {testCase.actualOutput && (
                            <div className="text-xs">
                              <div className="text-gray-400 mb-1">实际输出:</div>
                              <div className="bg-gray-800 p-2 rounded text-blue-300 font-mono">
                                {testCase.actualOutput}
                              </div>
                            </div>
                          )}
                          {testCase.error && (
                            <div className="text-xs">
                              <div className="text-gray-400 mb-1">错误信息:</div>
                              <div className="bg-red-900/20 border border-red-500/30 p-2 rounded text-red-300 font-mono">
                                {testCase.error}
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => runTestCase(testCase, true)}
                          disabled={testCase.status === 'running'}
                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <FaPlay className="text-xs" />
                          {testCase.status === 'running' ? '运行中...' : '运行测试'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 隐藏测试用例 */}
          <div>
            <h3 className="text-md font-semibold text-orange-400 mb-3 flex items-center gap-2">
              <FaEyeSlash className="text-sm" />
              隐藏测试用例 ({hiddenTestCases.length})
            </h3>
            <div className="space-y-3">
              {hiddenTestCases.map((testCase) => (
                <div key={testCase.id} className="bg-gray-700 rounded-lg border border-gray-600 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                        {getStatusIcon(testCase.status)}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-200">{testCase.name}</span>
                        <div className="text-xs text-gray-400 mt-1">
                          {testCase.status === 'running' && '运行中...'}
                          {testCase.status === 'passed' && '通过'}
                          {testCase.status === 'failed' && '失败'}
                          {testCase.status === 'pending' && '待运行'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

                    {/* 评析弹窗 */}
       {showEvaluationModal && (
         <CodeEvaluationModal
           isOpen={showEvaluationModal}
           onClose={handleCloseEvaluationModal}
           results={evaluationResults}
         />
       )}

       
     </div>
   );
 }

// 代码评析弹窗组件
interface CodeEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: CodeProblemResult[];
}

function CodeEvaluationModal({ isOpen, onClose, results }: CodeEvaluationModalProps) {
  const [expandedTestCases, setExpandedTestCases] = useState<Record<string, boolean>>({});
  
  if (!isOpen) return null;

  const toggleTestCase = (problemId: string, testCaseIndex: number, type: 'public' | 'hidden') => {
    const key = `${problemId}-${type}-${testCaseIndex}`;
    setExpandedTestCases(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* 头部 */}
        <div className="bg-purple-400 p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">代码评测结果</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-purple-100 text-3xl transition-colors"
            >
              ×
            </button>
          </div>
        </div>
        
        {/* 内容区域 */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6 bg-gray-50">
          {results.map((result, index) => (
            <div key={result.problem_id} className="mb-8 last:mb-0 bg-white rounded-lg shadow-md overflow-hidden">
              {/* 题目标题 */}
              <div className="bg-purple-100 p-4 border-b border-purple-200">
                <h3 className="text-lg font-semibold text-purple-700">
                  {index + 1}. {result.problem_title}
                </h3>
              </div>
              
              <div className="p-6 space-y-6">
                {/* 测试结果概览 */}
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="font-semibold text-purple-700 mb-3 flex items-center gap-2">
                    <FaCheck className="text-purple-500" />
                    测试结果概览
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                                         <div className="bg-white rounded-lg p-3 border border-purple-200">
                       <div className="text-purple-600 font-medium mb-1">公开测试</div>
                       <div className="text-2xl font-bold text-green-600">
                         {result.test_results.summary.public_passed}/{result.test_results.summary.public_total}
                       </div>
                       <div className={`text-xs ${result.test_results.summary.public_passed === result.test_results.summary.public_total ? 'text-green-500' : 'text-red-500'}`}>
                         {result.test_results.summary.public_passed === result.test_results.summary.public_total ? '全部通过' : '部分通过'}
                       </div>
                     </div>
                     <div className="bg-white rounded-lg p-3 border border-purple-200">
                       <div className="text-purple-600 font-medium mb-1">隐藏测试</div>
                       <div className="text-2xl font-bold text-green-600">
                         {result.test_results.summary.hidden_passed}/{result.test_results.summary.hidden_total}
                       </div>
                       <div className={`text-xs ${result.test_results.summary.hidden_passed === result.test_results.summary.hidden_total ? 'text-green-500' : 'text-red-500'}`}>
                         {result.test_results.summary.hidden_passed === result.test_results.summary.hidden_total ? '全部通过' : '部分通过'}
                       </div>
                     </div>
                  </div>
                </div>
                
                {/* 代码评析 */}
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="font-semibold text-purple-700 mb-4 flex items-center gap-2">
                    <FaCode className="text-purple-500" />
                    代码评析
                  </h4>
                  <div className="space-y-4">
                                         {/* 得分 */}
                     <div className="bg-white rounded-lg p-3 border border-purple-200">
                       <div className="flex items-center justify-between">
                         <span className="text-purple-600 font-medium">得分</span>
                         <span className="text-3xl font-bold text-green-600">{result.evaluation.score}</span>
                       </div>
                     </div>
                    
                    {/* 测试分析 */}
                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <div className="text-purple-600 font-medium mb-2">测试分析</div>
                      <p className="text-gray-600 text-sm leading-relaxed">{result.evaluation.test_analysis}</p>
                    </div>
                    
                    {/* 优点 */}
                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <div className="text-purple-600 font-medium mb-2 flex items-center gap-2">
                        <FaCheck className="text-purple-500" />
                        优点
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">{result.evaluation.strengths}</p>
                    </div>
                    
                    {/* 问题 */}
                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <div className="text-purple-600 font-medium mb-2 flex items-center gap-2">
                        <FaTimes className="text-purple-500" />
                        问题
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">{result.evaluation.problems}</p>
                    </div>
                    
                    {/* 建议 */}
                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <div className="text-purple-600 font-medium mb-2 flex items-center gap-2">
                        <FaArrowRight className="text-purple-500" />
                        建议
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">{result.evaluation.suggestions}</p>
                    </div>
                  </div>
                </div>
                
                {/* 详细测试用例 */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700 text-lg border-b border-gray-200 pb-2">详细测试用例</h4>
                  
                  {/* 公开测试用例 */}
                  <div>
                    <h5 className="text-sm font-semibold text-purple-600 mb-3 flex items-center gap-2">
                      <FaEye className="text-purple-500" />
                      公开测试用例 ({result.test_results.public_cases.length})
                    </h5>
                    <div className="space-y-3">
                      {result.test_results.public_cases.map((testCase, idx) => {
                        const key = `${result.problem_id}-public-${idx}`;
                        const isExpanded = expandedTestCases[key];
                                                 return (
                           <div key={idx} className={`rounded-lg border overflow-hidden ${testCase.passed ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                             <div 
                               className={`px-4 py-3 cursor-pointer select-none transition-colors ${testCase.passed ? 'hover:bg-green-100 bg-green-100' : 'hover:bg-red-100 bg-red-100'}`}
                               onClick={() => toggleTestCase(result.problem_id, idx, 'public')}
                             >
                               <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                   <div className={`w-6 h-6 rounded-full flex items-center justify-center ${testCase.passed ? 'bg-green-200' : 'bg-red-200'}`}>
                                     {testCase.passed ? <FaCheck className="text-green-600 text-xs" /> : <FaTimes className="text-red-600 text-xs" />}
                                   </div>
                                   <div>
                                     <div className={`font-medium text-sm ${testCase.passed ? 'text-green-700' : 'text-red-700'}`}>
                                       {testCase.passed ? '✓ 通过' : '✗ 失败'} - 测试用例 {idx + 1}
                                     </div>
                                   </div>
                                 </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">
                                    {isExpanded ? '收起' : '展开'}
                                  </span>
                                  {isExpanded ? <FaChevronUp className="text-xs text-gray-500" /> : <FaChevronDown className="text-xs text-gray-500" />}
                                </div>
                              </div>
                            </div>
                                                         {isExpanded && (
                               <div className={`px-4 pb-4 border-t bg-white ${testCase.passed ? 'border-green-200' : 'border-red-200'}`}>
                                 <div className="py-3 space-y-3">
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                     <div>
                                       <div className="text-gray-600 font-medium mb-1">输入</div>
                                       <code className="bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono text-xs block w-full break-all">{testCase.input}</code>
                                     </div>
                                     <div>
                                       <div className="text-gray-600 font-medium mb-1">期望输出</div>
                                       <code className="bg-green-100 px-2 py-1 rounded text-green-700 font-mono text-xs block w-full break-all">{testCase.expected}</code>
                                     </div>
                                   </div>
                                   <div>
                                     <div className="text-gray-600 font-medium mb-1">实际输出</div>
                                     <code className={`px-2 py-1 rounded font-mono text-xs block w-full break-all ${testCase.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                       {testCase.actual}
                                     </code>
                                   </div>
                                   {testCase.error && (
                                     <div>
                                       <div className="text-gray-600 font-medium mb-1">错误信息</div>
                                       <code className="bg-red-100 px-2 py-1 rounded text-red-700 font-mono text-xs block w-full break-all">{testCase.error}</code>
                                     </div>
                                   )}
                                 </div>
                               </div>
                             )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* 隐藏测试用例 */}
                  <div>
                    <h5 className="text-sm font-semibold text-purple-600 mb-3 flex items-center gap-2">
                      <FaEyeSlash className="text-purple-500" />
                      隐藏测试用例 ({result.test_results.hidden_cases.length})
                    </h5>
                    <div className="space-y-3">
                      {result.test_results.hidden_cases.map((testCase, idx) => {
                        const key = `${result.problem_id}-hidden-${idx}`;
                        const isExpanded = expandedTestCases[key];
                                                 return (
                           <div key={idx} className={`rounded-lg border overflow-hidden ${testCase.passed ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                             <div 
                               className={`px-4 py-3 cursor-pointer select-none transition-colors ${testCase.passed ? 'hover:bg-green-100 bg-green-100' : 'hover:bg-red-100 bg-red-100'}`}
                               onClick={() => toggleTestCase(result.problem_id, idx, 'hidden')}
                             >
                               <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                   <div className={`w-6 h-6 rounded-full flex items-center justify-center ${testCase.passed ? 'bg-green-200' : 'bg-red-200'}`}>
                                     {testCase.passed ? <FaCheck className="text-green-600 text-xs" /> : <FaTimes className="text-red-600 text-xs" />}
                                   </div>
                                   <div>
                                     <div className={`font-medium text-sm ${testCase.passed ? 'text-green-700' : 'text-red-700'}`}>
                                       {testCase.passed ? '✓ 通过' : '✗ 失败'} - 测试用例 {idx + 1}
                                     </div>
                                   </div>
                                 </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">
                                    {isExpanded ? '收起' : '展开'}
                                  </span>
                                  {isExpanded ? <FaChevronUp className="text-xs text-gray-500" /> : <FaChevronDown className="text-xs text-gray-500" />}
                                </div>
                              </div>
                            </div>
                                                         {isExpanded && (
                               <div className={`px-4 pb-4 border-t bg-white ${testCase.passed ? 'border-green-200' : 'border-red-200'}`}>
                                 <div className="py-3 space-y-3">
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                     <div>
                                       <div className="text-gray-600 font-medium mb-1">输入</div>
                                       <code className="bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono text-xs block w-full break-all">{testCase.input}</code>
                                     </div>
                                     <div>
                                       <div className="text-gray-600 font-medium mb-1">期望输出</div>
                                       <code className="bg-green-100 px-2 py-1 rounded text-green-700 font-mono text-xs block w-full break-all">{testCase.expected}</code>
                                     </div>
                                   </div>
                                   <div>
                                     <div className="text-gray-600 font-medium mb-1">实际输出</div>
                                     <code className={`px-2 py-1 rounded font-mono text-xs block w-full break-all ${testCase.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                       {testCase.actual}
                                     </code>
                                   </div>
                                   {testCase.error && (
                                     <div>
                                       <div className="text-gray-600 font-medium mb-1">错误信息</div>
                                       <code className="bg-red-100 px-2 py-1 rounded text-red-700 font-mono text-xs block w-full break-all">{testCase.error}</code>
                                     </div>
                                   )}
                                 </div>
                               </div>
                             )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* 底部按钮 */}
        <div className="bg-gray-50 p-6 border-t border-gray-200">
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="bg-purple-400 hover:bg-purple-500 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
