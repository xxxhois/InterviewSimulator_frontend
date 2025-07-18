'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

// mock 数据，后续可替换为接口
const mockPositions = [
  { id: '1', name: '前端开发工程师' },
  { id: '2', name: '后端开发工程师' },
  { id: '3', name: '算法工程师' },
];

// 假设有无简历/职位的判断，实际可用接口替换
const hasResume = true; // TODO: 替换为实际判断
const hasPosition = mockPositions.length > 0;

export default function InterviewBookingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'now' | 'reserve'>('now');
  const [reserveTime, setReserveTime] = useState('');
  const [position, setPosition] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 校验预约时间不能早于当前时间
  const isReserveTimeValid = () => {
    if (mode !== 'reserve') return true;
    if (!reserveTime) return false;
    const now = new Date();
    const selected = new Date(reserveTime);
    return selected.getTime() > now.getTime();
  };

  // 校验
  const canSubmit = (mode === 'now' || (mode === 'reserve' && reserveTime && isReserveTimeValid())) && position && hasResume && hasPosition && !submitting;

  // 提交处理（预留接口）
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    // TODO: 调用预约接口
    setTimeout(() => {
      setSubmitting(false);
      alert('预约成功！');
      // 跳转到面试房间或其他页面
      // router.push('/interview/room');
    }, 1000);
  };

  // 跳转去简历模块
  const goToResume = () => router.push('/resume');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-md border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">预约一场面试</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 面试时间选择 */}
          <div>
            <label className="block text-gray-300 font-semibold mb-2">面试时间</label>
            <div className="flex space-x-4">
              <button
                type="button"
                className={`px-4 py-2 rounded font-medium transition-colors ${mode === 'now' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                onClick={() => setMode('now')}
              >
                现在开始
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded font-medium transition-colors ${mode === 'reserve' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                onClick={() => setMode('reserve')}
              >
                预约时间
              </button>
            </div>
            {mode === 'reserve' && (
              <div className="mt-4">
                <input
                  type="datetime-local"
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={reserveTime}
                  onChange={e => setReserveTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
              </div>
            )}
          </div>

          {/* 目标职位选择 */}
          <div>
            <label className="block text-gray-300 font-semibold mb-2">目标职位</label>
            {hasPosition ? (
              <select
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={position}
                onChange={e => setPosition(e.target.value)}
                required
              >
                <option value="">请选择目标职位</option>
                {mockPositions.map(pos => (
                  <option key={pos.id} value={pos.id}>{pos.name}</option>
                ))}
              </select>
            ) : (
              <div className="text-red-400 text-sm">暂无可选职位，请先创建职位。</div>
            )}
          </div>

          {/* 简历/职位缺失提示与跳转 */}
          {(!hasResume || !hasPosition) && (
            <div className="bg-yellow-900/60 border border-yellow-700 text-yellow-200 rounded p-3 flex items-center justify-between">
              <span>请先完善简历和目标职位</span>
              <button
                type="button"
                className="ml-4 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
                onClick={goToResume}
              >
                去创建
              </button>
            </div>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            className={`w-full py-2 rounded font-bold transition-colors ${canSubmit ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
            disabled={!canSubmit}
          >
            {submitting
              ? '提交中...'
              : mode === 'now'
                ? '开始面试'
                : '预约面试'}
          </button>
        </form>
      </div>
    </div>
  );
} 