'use client';

import { createInterview } from '@/api/interview';
import { getPositionList, searchPositionList } from '@/api/position';
import { getResumeList } from '@/api/resume';
import type { Position } from '@/types/postion';
import { Dialog, Transition } from '@headlessui/react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';


export default function InterviewBookingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'now' | 'reserve'>('now');
  const [reserveTime, setReserveTime] = useState('');
  const [jobPositions, setJobPositions] = useState<any[]>([]);
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedResume, setSelectedResume] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [positionModalOpen, setPositionModalOpen] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [positionPage, setPositionPage] = useState(1);
  const [positionTotal, setPositionTotal] = useState(0);
  const [positionSearch, setPositionSearch] = useState('');
  const [positionLoading, setPositionLoading] = useState(false);
  const [positionSearchMode, setPositionSearchMode] = useState(false);
  const [selectedPositionObj, setSelectedPositionObj] = useState<Position | null>(null);

  // useEffect(() => {
  //   // 获取岗位列表
  //   getJobPositionList().then(setJobPositions);
  //   // 获取简历列表
  //   getResumeList().then(res => setResumes(res.resumes || []));
  // }, []);
  const fetchPositions = async (page = 1, keyword = '') => {
    setPositionLoading(true);
    try {
      let res;
      if (keyword) {
        res = await searchPositionList({ keyword, page });
        setPositionSearchMode(true);
      } else {
        res = await getPositionList({ page });
        setPositionSearchMode(false);
      }
      setPositions(res.results);
      setPositionTotal(res.count);
      setPositionPage(page);
    } finally {
      setPositionLoading(false);
    }
  };
  useEffect(() => {
    fetchPositions(1);
    getResumeList().then(res => setResumes(res.resumes || []));
  }, []);

  const canSubmit = (mode === 'now' || (mode === 'reserve' && reserveTime /* && isReserveTimeValid() */)) && selectedPosition && selectedResume && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit called');
    if (!canSubmit) {
      console.log('canSubmit is false', { mode, reserveTime, selectedPosition, selectedResume, submitting });
      return;
    }
    setSubmitting(true);
    // 这里 jobPositions 已经不用了，直接用 selectedPositionObj
    const resume = resumes.find(r => String(r.resume_id) === selectedResume);
    if (!selectedPositionObj || !resume) {
      setSubmitting(false);
      // @ts-ignore
      window.toast && window.toast('请选择岗位和简历', { type: 'error' });
      console.log('岗位或简历未选', { selectedPositionObj, resume });
      return;
    }
    const params = {
      job_position_id: Number(selectedPosition),
      resume_id: resume.resume_id,
      interview_time: mode === 'reserve' ? reserveTime : undefined,
      position_name: selectedPositionObj.position_name,
      // position_type: selectedPositionObj.position_type,
      //company_name: selectedPositionObj.company_name,
      position_description: '暂无',
    };
    console.log('即将发送创建面试请求', params);
    try {
      const res = await createInterview(params);
      setSubmitting(false);
      console.log('创建面试返回', res);
      // @ts-ignore
      window.toast && window.toast('预约成功！', { type: 'success' });
      if (mode === 'now' && res && res.id) {
        router.push(`/interview/room/?id=${res.id}&resume_id=${resume.resume_id}`);
      }
    } catch (err: any) {
      setSubmitting(false);
      // @ts-ignore
      window.toast && window.toast(err.message || '预约失败', { type: 'error' });
      console.error('创建面试失败', err);
    }
  };

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

          {/* 目标岗位选择 */}
          <div>
            <label className="block text-gray-300 font-semibold mb-2">目标岗位</label>
            <div>
              <label className="block text-gray-300 font-semibold mb-2">目标岗位</label>
              <button
                type="button"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-left"
                onClick={() => setPositionModalOpen(true)}
              >
                {selectedPositionObj
                  ? `${selectedPositionObj.company_name} - ${selectedPositionObj.position_name}`
                  : '请选择目标岗位'}
              </button>
            </div>
          </div>
          <Transition appear show={positionModalOpen} as={React.Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => setPositionModalOpen(false)}>
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-gray-900/80" />
              </Transition.Child>
              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                  <Transition.Child
                    as={React.Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl border border-gray-700">
                      <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-white mb-4">选择目标岗位</Dialog.Title>
                      <div className="mb-4 flex gap-2">
                        <input
                          type="text"
                          className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="输入关键词搜索岗位/公司"
                          value={positionSearch}
                          onChange={e => setPositionSearch(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { fetchPositions(1, positionSearch); } }}
                        />
                        <button
                          type="button"
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                          onClick={() => fetchPositions(1, positionSearch)}
                        >搜索</button>
                        <button
                          type="button"
                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                          onClick={() => { setPositionSearch(''); fetchPositions(1); }}
                        >重置</button>
                      </div>
                      <div className="max-h-64 overflow-y-auto border border-gray-700 rounded mb-4 bg-gray-900">
                        {positionLoading ? (
                          <div className="text-center text-gray-400 py-8">加载中...</div>
                        ) : positions.length === 0 ? (
                          <div className="text-center text-gray-400 py-8">暂无岗位</div>
                        ) : (
                          <ul>
                            {positions.map(pos => (
                              <li
                                key={pos.id}
                                className={`px-4 py-2 cursor-pointer hover:bg-purple-700/30 ${selectedPositionObj?.id === pos.id ? 'bg-purple-700/60 text-white' : 'text-gray-200'}`}
                                onClick={() => {
                                  setSelectedPosition(String(pos.id));
                                  setSelectedPositionObj(pos);
                                  setPositionModalOpen(false);
                                }}
                              >
                                {pos.company_name} - {pos.position_name}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      {/* 分页 */}
                      <div className="flex justify-between items-center">
                        <button
                          type="button"
                          className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
                          disabled={positionPage <= 1 || positionLoading}
                          onClick={() => fetchPositions(positionPage - 1, positionSearchMode ? positionSearch : '')}
                        >上一页</button>
                        <span className="text-gray-300">第 {positionPage} 页 / 共 {Math.ceil(positionTotal / 10) || 1} 页</span>
                        <button
                          type="button"
                          className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
                          disabled={positions.length < 10 || positionPage >= Math.ceil(positionTotal / 10) || positionLoading}
                          onClick={() => fetchPositions(positionPage + 1, positionSearchMode ? positionSearch : '')}
                        >下一页</button>
                      </div>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>
          {/* 简历选择 */}
          <div>
            <label className="block text-gray-300 font-semibold mb-2">选择简历</label>
            <select
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={selectedResume}
              onChange={e => setSelectedResume(e.target.value)}
              required
            >
              <option value="">请选择简历</option>
              {resumes.map(resume => (
                <option key={resume.resume_id} value={resume.resume_id}>{resume.resume_name}</option>
              ))}
            </select>
          </div>

          {/* 简历缺失提示与跳转 */}
          {(!resumes.length) && (
            <div className="bg-yellow-900/60 border border-yellow-700 text-yellow-200 rounded p-3 flex items-center justify-between">
              <span>简历未创建，请先创建简历</span>
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