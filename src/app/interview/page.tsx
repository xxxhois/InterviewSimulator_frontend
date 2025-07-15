/**
 * 面试房间页面,待改
 * 
 * 
 * 
 * 
 * 
 * 
 */
'use client';

import { useState } from 'react';
import { FiVideo, FiMic, FiPhoneOff } from 'react-icons/fi';
import { AiOutlineFolder } from 'react-icons/ai';

export default function InterviewRoom() {
  return (
    <div className="h-screen w-screen bg-gray-900 text-white flex flex-col">
      {/* 顶部控制栏 */}
      <div className="flex justify-between items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="text-purple-400 font-semibold text-lg">王民昕的面试</div>
        <div className="space-x-2">
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1 rounded">运行</button>
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-1 rounded">选择题目</button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex flex-1">
        {/* 左侧文件栏 */}
        <div className="w-1/5 bg-gray-800 border-r border-gray-700 p-4 space-y-2">
          <div className="text-gray-400 font-semibold text-sm mb-2">📁 文件</div>
          <ul className="text-sm space-y-1">
            <li className="flex items-center text-purple-400"><AiOutlineFolder className="mr-1" /> src</li>
            <li className="ml-4">App.js</li>
            <li className="ml-4">SearchInput.js</li>
            <li className="ml-4 text-gray-400">Index.js</li>
          </ul>
        </div>

        {/* 中间代码编辑器 */}
        <div className="w-3/5 p-4 bg-gray-900 border-r border-gray-700">
          <div className="text-sm text-gray-400 mb-2">// 请修复下面代码问题</div>
          <div className="bg-gray-800 rounded p-4 font-mono text-sm whitespace-pre h-full overflow-auto leading-relaxed">
            {`import React from 'react';

export default function SearchInput({ onChange }) {
  return (
    <div className="component-search-input">
      <input onChange={onChange} />
    </div>
  );
}`}
          </div>
        </div>

        {/* 右侧运行/通话区 */}
        <div className="w-1/5 bg-gray-800 p-4 flex flex-col justify-between">
          <div>
            <div className="text-center text-xs text-gray-400 mb-2">TALK IS CHEAP, SHOW ME THE <span className="text-purple-500">CODE</span></div>
            <div className="bg-gray-900 h-32 rounded mb-4 text-xs p-2">终端输出区...</div>
            <button className="bg-purple-600 hover:bg-purple-700 w-full py-1 rounded text-sm">Code With React</button>
          </div>

          {/* 视频区域 */}
          <div className="flex space-x-2 mt-6 items-end">
            <div className="bg-black w-20 h-20 rounded-md">👨‍💻我</div>
            <div className="bg-black w-20 h-20 rounded-md">🧑‍🎓 王民昕</div>
          </div>
        </div>
      </div>

      {/* 底部控制栏 */}
      <div className="flex justify-between items-center px-4 py-2 bg-gray-800 border-t border-gray-700">
        <div>
          <button className="text-sm bg-gray-700 hover:bg-gray-600 px-4 py-1 rounded">发起通话</button>
        </div>
        <div className="flex space-x-4 text-xl text-white">
          <FiVideo />
          <FiMic />
          <FiPhoneOff className="text-red-500" />
        </div>
        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded text-sm">结束面试</button>
      </div>
    </div>
  );
}
