'use client';

import { runCode } from '@/api/code';
import Editor from '@monaco-editor/react';
import { useState } from 'react';

const languages = [
  { name: 'C++', id: 54, monacoLang: 'cpp' },
  { name: 'Java', id: 62, monacoLang: 'java' },
  { name: 'Python', id: 71, monacoLang: 'python' },
  { name: 'JavaScript', id: 63, monacoLang: 'javascript' },
];

export default function RunCodePage() {
  const [languageId, setLanguageId] = useState(71);
  const [monacoLang, setMonacoLang] = useState('python');
  const [code, setCode] = useState(`print("Hello, Judge0!")`);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRunCode = async () => {
    setLoading(true);
    const res = await runCode(code, languageId, input);
    setOutput(res.stdout || res.stderr || '无输出');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-purple-400">在线运行代码 - Judge0 Demo</h1>
        <select
          className="bg-gray-800 text-white border border-purple-500 rounded px-2 py-1"
          value={languageId}
          onChange={(e) => {
            const langId = parseInt(e.target.value);
            const lang = languages.find((l) => l.id === langId);
            setLanguageId(langId);
            setMonacoLang(lang?.monacoLang || 'python');
          }}
        >
          {languages.map((lang) => (
            <option key={lang.id} value={lang.id}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      <Editor
        height="300px"
        defaultLanguage={monacoLang}
        language={monacoLang}
        value={code}
        onChange={(value) => setCode(value || '')}
        theme="vs-dark"
      />

      <div className="mt-4">
        <label className="text-sm text-gray-400">标准输入：</label>
        <textarea
          rows={3}
          className="w-full mt-1 p-2 bg-gray-800 border border-gray-700 rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>

      <button
        onClick={handleRunCode}
        disabled={loading}
        className="mt-4 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white font-semibold"
      >
        {loading ? '运行中...' : '运行代码'}
      </button>

      <div className="mt-6">
        <label className="text-sm text-gray-400">输出结果：</label>
        <pre className="bg-gray-800 p-4 rounded text-green-300 whitespace-pre-wrap mt-2">
          {output}
        </pre>
      </div>
    </div>
  );
}
