'use client';

import { createInterview } from '@/api/interview';
import { getResumeList } from '@/api/resume';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// mock 岗位接口
const getJobPositionList = async () => {
  // TODO: 替换为实际接口
  return [
    { id: 1, company_name: '字节跳动', position_name: '前端开发工程师', position_type: '全职', position_description: '负责Web前端开发' },
    { id: 2, company_name: '腾讯', position_name: '后端开发工程师', position_type: '全职', position_description: '负责后端服务开发' },
    { id: 3, company_name: '阿里巴巴', position_name: '算法工程师', position_type: '全职', position_description: '负责算法研发' },
  ];
};

export default function InterviewBookingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'now' | 'reserve'>('now');
  const [reserveTime, setReserveTime] = useState('');
  const [jobPositions, setJobPositions] = useState<any[]>([]);
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedResume, setSelectedResume] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // 获取岗位列表
    getJobPositionList().then(setJobPositions);
    // 获取简历列表
    getResumeList().then(res => setResumes(res.resumes || []));
  }, []);

  const isReserveTimeValid = () => {
    if (mode !== 'reserve') return true;
    if (!reserveTime) return false;
    const now = new Date();
    const selected = new Date(reserveTime);
    return selected.getTime() > now.getTime();
  };

  const canSubmit = (mode === 'now' || (mode === 'reserve' && reserveTime && isReserveTimeValid())) && selectedPosition && selectedResume && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (mode === 'reserve' && !isReserveTimeValid()) {
      // @ts-ignore
      window.toast && window.toast('预约时间必须晚于当前时间', { type: 'error' });
      return;
    }
    setSubmitting(true);
    const position = jobPositions.find(p => String(p.id) === selectedPosition);
    const resume = resumes.find(r => String(r.resume_id) === selectedResume);
    if (!position || !resume) {
      setSubmitting(false);
      // @ts-ignore
      window.toast && window.toast('请选择岗位和简历', { type: 'error' });
      return;
    }
    const params = {
      job_position_id: position.id,
      resume_id: resume.resume_id,
      interview_time: mode === 'reserve' ? reserveTime : undefined,
      position_name: position.position_name,
      position_type: position.position_type,
      company_name: position.company_name,
      position_description: position.position_description,
    };
    try {
      const res = await createInterview(params);
      setSubmitting(false);
      // @ts-ignore
      window.toast && window.toast('预约成功！', { type: 'success' });
      if (mode === 'now' && res && res.id) {
        router.push(`/interview/room?id=${res.id}`);
      }
    } catch (err: any) {
      setSubmitting(false);
      // @ts-ignore
      window.toast && window.toast(err.message || '预约失败', { type: 'error' });
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
            <select
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={selectedPosition}
              onChange={e => setSelectedPosition(e.target.value)}
              required
            >
              <option value="">请选择目标岗位</option>
              {jobPositions.map(pos => (
                <option key={pos.id} value={pos.id}>{pos.company_name} - {pos.position_name}</option>
              ))}
            </select>
          </div>

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