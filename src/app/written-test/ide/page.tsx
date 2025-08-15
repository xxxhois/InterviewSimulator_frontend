'use client';

import { getAlgorithmProblems, runCode } from '@/api/code';
import { useAuthStore } from '@/store/authStore';
import { AlgorithmProblem, TestCase } from '@/types/problem';
import Editor from '@monaco-editor/react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaClock,
  FaCode,
  FaEye,
  FaEyeSlash,
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
  const problemSetId = searchParams.get('id') || 'basic-algorithm';
  
  const [problemList, setProblemList] = useState<AlgorithmProblem[]>([]);
  const [currentProblem, setCurrentProblem] = useState<AlgorithmProblem | null>(null);
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
            setCode(getDefaultCode(languageId, response.problems[0].code_template));
            setPublicTestCases(response.problems[0].test_cases.public);
            setHiddenTestCases(response.problems[0].test_cases.hidden);
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

  const handleLanguageChange = (langId: number) => {
    const lang = languages.find((l) => l.id === langId);
    setLanguageId(langId);
    setMonacoLang(lang?.monacoLang || 'python');
    if (currentProblem) {
      setCode(getDefaultCode(langId, currentProblem.code_template));
    }
  };

  const handleProblemChange = (problem: AlgorithmProblem) => {
    setCurrentProblem(problem);
    setCode(getDefaultCode(languageId, problem.code_template));
    setInput('');
    setOutput('');
    setPublicTestCases(problem.test_cases.public.map(tc => ({ ...tc, status: 'pending' as const, actualOutput: '', error: '' })));
    setHiddenTestCases(problem.test_cases.hidden.map(tc => ({ ...tc, status: 'pending' as const })));
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
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* 顶部用户信息栏 */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-semibold text-purple-400">
            {user || '用户'} 的笔试
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">当前题目: {currentProblem.title}</span>
            <button
              onClick={() => setShowProblemList(!showProblemList)}
              className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm"
            >
              {showProblemList ? '隐藏题目列表' : '显示题目列表'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* 左侧：题目列表切换栏 */}
        {showProblemList && (
          <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto">
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
        <div className={`bg-gray-800 p-6 overflow-y-auto border-r border-gray-700 ${showProblemList ? 'w-80' : 'w-1/4'}`}>
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
        <div className="flex-1 bg-gray-900 flex flex-col">
          {/* 语言选择器 */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-purple-400">代码编辑器</h2>
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
            </div>
          </div>

          {/* 代码编辑器 */}
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage={monacoLang}
              language={monacoLang}
              value={code}
              onChange={(value) => setCode(value || '')}
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

          {/* 输入区域和运行按钮 */}
          <div className="p-4 border-t border-gray-700">
            <div className="mb-3">
              <label className="text-sm text-gray-400 block mb-1">标准输入：</label>
              <textarea
                rows={2}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="输入测试数据..."
              />
            </div>
            
            <div className="flex gap-2">
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
            </div>

            {output && (
              <div className="mt-3">
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
    </div>
  );
}
