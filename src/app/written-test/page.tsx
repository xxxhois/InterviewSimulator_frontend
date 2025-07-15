'use client';

import { runCode, getProblemDetail } from '@/api/test';
import Editor from '@monaco-editor/react';
import { useState } from 'react';

const languages = [
  { name: 'C++', id: 54, monacoLang: 'cpp' },
  { name: 'Java', id: 62, monacoLang: 'java' },
  { name: 'Python', id: 71, monacoLang: 'python' },
  { name: 'JavaScript', id: 63, monacoLang: 'javascript' },
];

// 默认代码模板
const getDefaultCode = (languageId: number) => {
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

// 示例题目数据
const testProblemData = {
  title: "两数之和",
  description: `给定一个整数数组 nums 和一个整数目标值 target，请你在该数组中找出和为目标值 target 的那两个整数，并返回它们的数组下标。

你可以假设每种输入只会对应一个答案。但是，数组中同一个元素在答案里不能重复出现。

你可以按任意顺序返回答案。

示例 1：
输入：nums = [2,7,11,15], target = 9
输出：[0,1]
解释：因为 nums[0] + nums[1] == 9 ，返回 [0, 1] 。

示例 2：
输入：nums = [3,2,4], target = 6
输出：[1,2]

示例 3：
输入：nums = [3,3], target = 6
输出：[0,1]

提示：
- 2 <= nums.length <= 104
- -109 <= nums[i] <= 109
- -109 <= target <= 109
- 只会存在一个有效答案`,
  constraints: [
    "2 <= nums.length <= 104",
    "-109 <= nums[i] <= 109", 
    "-109 <= target <= 109",
    "只会存在一个有效答案"
  ]
};
const problemData = testProblemData;//模拟数据
//const problemData = getProblemDetail(problemId);//实际数据
// 示例测试用例
const testCases = {
  public: [
    {
      id: 1,
      name: "示例 1",
      input: "[2,7,11,15]\n9",
      expectedOutput: "[0,1]",
      status: 'pending' as 'pending' | 'running' | 'passed' | 'failed',
      actualOutput: '',
      error: ''
    },
    {
      id: 2,
      name: "示例 2", 
      input: "[3,2,4]\n6",
      expectedOutput: "[1,2]",
      status: 'pending' as 'pending' | 'running' | 'passed' | 'failed',
      actualOutput: '',
      error: ''
    },
    {
      id: 3,
      name: "示例 3",
      input: "[3,3]\n6", 
      expectedOutput: "[0,1]",
      status: 'pending' as 'pending' | 'running' | 'passed' | 'failed',
      actualOutput: '',
      error: ''
    }
  ],
  hidden: [
    {
      id: 4,
      name: "隐藏测试用例 1",
      status: 'pending' as 'pending' | 'running' | 'passed' | 'failed'
    },
    {
      id: 5,
      name: "隐藏测试用例 2",
      status: 'pending' as 'pending' | 'running' | 'passed' | 'failed'
    },
    {
      id: 6,
      name: "隐藏测试用例 3",
      status: 'pending' as 'pending' | 'running' | 'passed' | 'failed'
    }
  ]
};

export default function WrittenTestPage() {
  const [languageId, setLanguageId] = useState(71);
  const [monacoLang, setMonacoLang] = useState('python');
  const [code, setCode] = useState(getDefaultCode(71));
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [publicTestCases, setPublicTestCases] = useState(testCases.public);
  const [hiddenTestCases, setHiddenTestCases] = useState(testCases.hidden);

  const handleLanguageChange = (langId: number) => {
    const lang = languages.find((l) => l.id === langId);
    setLanguageId(langId);
    setMonacoLang(lang?.monacoLang || 'python');
    setCode(getDefaultCode(langId));
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

  const runTestCase = async (testCase: any, isPublic: boolean) => {
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
      const passed = actualOutput.trim() === testCase.expectedOutput.trim() && !error;
      
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
        return '⏳';
      case 'passed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '⏸️';
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

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* 左侧：题目描述 */}
      <div className="w-1/4 bg-gray-800 p-6 overflow-y-auto border-r border-gray-700">
        <h1 className="text-xl font-bold text-purple-400 mb-4">{problemData.title}</h1>
        <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
          {problemData.description}
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-purple-300 mb-2">约束条件：</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            {problemData.constraints.map((constraint, index) => (
              <li key={index} className="flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                {constraint}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 中间：代码编辑区 */}
      <div className="w-1/2 bg-gray-900 flex flex-col">
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
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white font-semibold disabled:opacity-50"
            >
              {loading ? '运行中...' : '运行代码'}
            </button>
            <button
              onClick={runAllPublicTests}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white font-semibold"
            >
              运行所有公开测试
            </button>
          </div>

          {output && (
            <div className="mt-3">
              <label className="text-sm text-gray-400 block mb-1">输出结果：</label>
              <pre className="bg-gray-800 p-3 rounded text-green-300 whitespace-pre-wrap text-sm border border-gray-700">
                {output}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* 右侧：测试用例 */}
      <div className="w-1/4 bg-gray-800 p-6 overflow-y-auto border-l border-gray-700">
        <h2 className="text-lg font-semibold text-purple-400 mb-4">测试用例</h2>
        
        {/* 公开测试用例 */}
        <div className="mb-6">
          <h3 className="text-md font-semibold text-blue-400 mb-3">公开测试用例</h3>
          <div className="space-y-2">
            {publicTestCases.map((testCase) => (
              <div key={testCase.id} className="bg-gray-700 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{testCase.name}</span>
                  <span className={`text-lg ${getStatusColor(testCase.status)}`}>
                    {getStatusIcon(testCase.status)}
                  </span>
                </div>
                
                <div className="text-xs text-gray-400 mb-2">
                  <div>输入: {testCase.input}</div>
                  <div>期望: {testCase.expectedOutput}</div>
                </div>
                
                {testCase.actualOutput && (
                  <div className="text-xs mb-2">
                    <div className="text-green-400">实际输出: {testCase.actualOutput}</div>
                  </div>
                )}
                
                {testCase.error && (
                  <div className="text-xs text-red-400 mb-2">
                    错误: {testCase.error}
                  </div>
                )}
                
                <button
                  onClick={() => runTestCase(testCase, true)}
                  disabled={testCase.status === 'running'}
                  className="w-full bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs disabled:opacity-50"
                >
                  {testCase.status === 'running' ? '运行中...' : '运行测试'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 隐藏测试用例 */}
        <div>
          <h3 className="text-md font-semibold text-orange-400 mb-3">隐藏测试用例</h3>
          <div className="space-y-2">
            {hiddenTestCases.map((testCase) => (
              <div key={testCase.id} className="bg-gray-700 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{testCase.name}</span>
                  <span className={`text-lg ${getStatusColor(testCase.status)}`}>
                    {getStatusIcon(testCase.status)}
                  </span>
                </div>
                
                <button
                  onClick={() => runTestCase(testCase, false)}
                  disabled={testCase.status === 'running'}
                  className="w-full bg-orange-600 hover:bg-orange-700 px-2 py-1 rounded text-xs disabled:opacity-50"
                >
                  {testCase.status === 'running' ? '运行中...' : '运行测试'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
