'use client';

import { Dialog, Transition } from '@headlessui/react';
import dynamic from 'next/dynamic';
import { Fragment, useState } from 'react';

// 动态引入 Monaco Editor，避免 SSR 问题
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

// 预留：当前问题、提示、历史、视频流等接口
const mockQuestion = {
  title: '请实现一个斐波那契数列函数',
  hint: '递归或动态规划均可，注意边界条件。',
};
const mockHistory = [
  { question: '什么是闭包？', answer: '闭包是函数和其引用的变量环境的组合。' },
  { question: '手写防抖函数', answer: 'function debounce(fn, delay) { /* ... */ }' },
];

const languageOptions = [
  { label: 'Plain Text', value: 'plaintext' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Python', value: 'python' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Java', value: 'java' },
  // 可扩展更多语言
];

export default function InterviewPage() {
  // 代码内容、语言、弹窗状态
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('plaintext');
  const [historyVisible, setHistoryVisible] = useState(false);

  // 预留：当前问题、提示、历史、视频流等接口
  const currentQuestion = mockQuestion; // TODO: 替换为实际接口
  const historyList = mockHistory; // TODO: 替换为实际接口

  return (
    <div className="h-screen w-screen bg-gray-900 text-white flex flex-row">
      {/* 左侧：问题区 */}
      <div className="w-1/5 bg-gray-800 border-r border-gray-700 p-6 flex flex-col justify-between">
        <div>
          <div className="text-purple-400 font-bold text-lg mb-2">当前问题</div>
          <div className="text-base mb-4">{currentQuestion.title}</div>
          <div className="text-gray-400 text-sm font-semibold mb-1">提示</div>
          <div className="text-gray-300 text-sm">{currentQuestion.hint}</div>
        </div>
        <button
          className="mt-8 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm"
          onClick={() => setHistoryVisible(true)}
        >
          查看历史记录
        </button>
      </div>

      {/* 中间：代码编辑区 */}
      <div className="w-3/5 flex flex-col bg-gray-900 p-6">
        <div className="flex items-center mb-2">
          <span className="text-gray-400 text-sm mr-2">选择语言：</span>
          <select
            className="bg-gray-800 text-white border border-gray-700 rounded px-2 py-1 text-sm outline-none"
            value={language}
            onChange={e => setLanguage(e.target.value)}
          >
            {languageOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-h-0">
          <MonacoEditor
            height="calc(100vh - 120px)"
            defaultLanguage={language}
            language={language}
            value={code}
            theme="vs-dark"
            onChange={v => setCode(v || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 16,
              fontFamily: 'Fira Mono, monospace',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
            }}
          />
        </div>
      </div>

      {/* 右侧：视频区 */}
      <div className="w-1/5 bg-gray-800 p-6 flex flex-col justify-between items-center">
        <div className="w-full">
          <div className="text-center text-xs text-gray-400 mb-2">数字人面试官</div>
          {/* 预留：面试官视频流 */}
          <div className="bg-black w-full aspect-square rounded-md flex items-center justify-center text-3xl mb-6">🤖</div>
        </div>
        <div className="w-full">
          <div className="text-center text-xs text-gray-400 mb-2">面试者</div>
          {/* 预留：面试者视频流 */}
          <div className="bg-black w-full aspect-square rounded-md flex items-center justify-center text-3xl">🧑‍💻</div>
        </div>
      </div>

      {/* 历史记录弹窗（Tailwind + Headless UI） */}
      <Transition appear show={historyVisible} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setHistoryVisible(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/60" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-gray-900 p-6 text-left align-middle shadow-xl transition-all border border-gray-700">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-bold leading-6 text-white mb-4"
                  >
                    历史问题与回答
                  </Dialog.Title>
                  <div className="space-y-4">
                    {historyList.map((item, idx) => (
                      <div key={idx} className="bg-gray-800 rounded p-4">
                        <div className="text-purple-400 font-semibold mb-1">Q: {item.question}</div>
                        <div className="text-gray-200">A: {item.answer}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm"
                      onClick={() => setHistoryVisible(false)}
                    >
                      关闭
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
