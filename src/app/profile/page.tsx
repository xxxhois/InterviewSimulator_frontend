'use client';

import { getPositionList, searchPositionList } from '@/api/position';
import { getProfile, updateProfile } from '@/api/profile';
import { recognizeResume } from '@/api/resume';
import defaultAvatar from '@/assets/企鹅.jpg';
import Navigation from '@/components/Navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { showToast } from '@/components/Toast';
import type { Position } from '@/types/postion';
import { Profile } from '@/types/profile';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// 动态导入echarts组件
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [resumes, setResumes] = useState<any[]>([]);
  const [practiceRecords, setPracticeRecords] = useState<any[]>([]);
  const [interviewRecords, setInterviewRecords] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('interview'); // 'interview' or 'practice'
  const [comment, setComment] = useState<string | null>(null);
  const [commentLoading, setCommentLoading] = useState(true);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [editProfile, setEditProfile] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    avatar: '',
    expected_position_id: '',
    expected_salary: '',
  });
  const [positionOptions, setPositionOptions] = useState<Position[]>([]);
  const [positionPage, setPositionPage] = useState(1);
  const [positionTotal, setPositionTotal] = useState(0);
  const [positionSearch, setPositionSearch] = useState('');
  const [positionLoading, setPositionLoading] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setProfileLoading(true);
        // 获取用户资料
        const profileData = await getProfile();
        setProfile(profileData);
        
        // 从profile中提取简历信息
        if (Array.isArray(profileData.resume) && profileData.resume.length > 0) {
          setResumes(
            profileData.resume.map(r => ({
              resume_id: r.resume_id,
              resume_name: r.resume_name || '未命名简历',
              expected_position: r.expected_position || '未设置',
              completed: r.completed || false,
              updated: r.updated_at ? r.updated_at.slice(0, 10) : '未知'
            }))
          );
        } else {
          setResumes([]);
        }
        
        // TODO: 这些数据需要额外的API接口获取
        // 暂时保留模拟数据，等待对应的API接口
        setPracticeRecords([
          { id: 1, title: '算法与数据结构', date: '2024-04-10', score: 85 },
          { id: 2, title: 'React Hooks详解', date: '2024-04-08', score: 90 }
        ]);
        setInterviewRecords([
          { id: 1, company: '字节跳动', position: '前端开发', date: '2024-04-05', result: '通过' },
          { id: 2, company: '腾讯', position: '前端开发', date: '2024-03-28', result: '未通过' }
        ]);

        // 模拟异步获取能力评估评语
        setCommentLoading(true);
        setCommentError(null);
        setTimeout(() => {
          // 假设接口返回如下内容
          setComment(
            '基础知识扎实，算法能力较强，能够独立解决中等难度问题。\n' +
            '面试通过率较高，具备良好的沟通表达能力。\n' +
            '建议继续加强高频算法题训练，提升代码优化能力。'
          );
          setCommentLoading(false);
        }, 800);
        
      } catch (error) {
        console.error('获取用户资料失败:', error);
        showToast('获取用户资料失败，请稍后重试');
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  useEffect(() => {
    fetchPositions(1, '');
  }, []);

  const fetchPositions = async (page = 1, keyword = '') => {
    setPositionLoading(true);
    try {
      let res;
      if (keyword) {
        res = await searchPositionList({ keyword, page });
      } else {
        res = await getPositionList({ page });
      }
      setPositionOptions(res.results);
      setPositionTotal(res.count);
      setPositionPage(page);
    } finally {
      setPositionLoading(false);
    }
  };

  // 能力评估图表配置（可根据实际数据动态生成）
  const skillMatchOption = {
    title: { text: '能力雷达图', left: 'center', textStyle: { color: '#7c3aed', fontSize: 14, fontWeight: 'bold' } },
    radar: {
      indicator: [
        { name: '表达能力', max: 100 },
        { name: '技术知识', max: 100 },
        { name: '情绪稳定', max: 100 },
        { name: '逻辑思维', max: 100 },
        { name: '肢体语言', max: 100 },
        { name: '应变能力', max: 100 }
      ],
      shape: 'circle',
      splitNumber: 5,
      axisName: { color: '#7c3aed', fontSize: 10 },
      splitLine: { lineStyle: { color: ['#e9d5ff'] } },
      splitArea: { show: false }
    },
    series: [{
      name: '能力评估',
      type: 'radar',
      data: [
        { value: [75, 85, 70, 80, 65, 72], name: '当前能力', areaStyle: { color: 'rgba(147, 51, 234, 0.4)' }, lineStyle: { color: '#9333ea', width: 3 }, itemStyle: { color: '#9333ea' } },
        { value: [90, 95, 85, 90, 80, 88], name: '目标能力', areaStyle: { color: 'rgba(236, 72, 153, 0.4)' }, lineStyle: { color: '#ec4899', width: 3, type: 'dashed' }, itemStyle: { color: '#ec4899' } }
      ]
    }]
  };

  const pieOption = {
    title: { text: '技能分布', left: 'center', textStyle: { color: '#7c3aed', fontSize: 14, fontWeight: 'bold' } },
    series: [{
      name: '技能掌握',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['60%', '50%'],
      data: [
        { value: 35, name: '前端开发', itemStyle: { color: '#8b5cf6' } },
        { value: 25, name: '后端开发', itemStyle: { color: '#a855f7' } },
        { value: 20, name: '算法设计', itemStyle: { color: '#c084fc' } },
        { value: 15, name: '系统设计', itemStyle: { color: '#ec4899' } },
        { value: 5, name: '其他技能', itemStyle: { color: '#f59e0b' } }
      ]
    }]
  };

  const trendOption = {
    title: { text: '能力提升趋势', left: 'center', textStyle: { color: '#7c3aed', fontSize: 14, fontWeight: 'bold' } },
    xAxis: { type: 'category', data: ['第1次', '第2次', '第3次', '第4次', '第5次', '第6次'], axisLine: { lineStyle: { color: '#7c3aed' } }, axisLabel: { color: '#7c3aed' } },
    yAxis: { type: 'value', min: 0, max: 100, axisLine: { lineStyle: { color: '#7c3aed' } }, axisLabel: { color: '#7c3aed' } },
    series: [{
      name: '综合评分',
      type: 'line',
      smooth: true,
      data: [65, 70, 78, 80, 85, 88],
      lineStyle: { color: '#8b5cf6', width: 4 },
      itemStyle: { color: '#8b5cf6', borderWidth: 3, borderColor: '#fff' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(139, 92, 246, 0.7)' },
            { offset: 0.5, color: 'rgba(168, 85, 247, 0.4)' },
            { offset: 1, color: 'rgba(236, 72, 153, 0.1)' }
          ]
        }
      }
    }]
  };

  // 上传简历
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg', 'image/png', 'image/bmp', 'image/gif'
    ];
    if (!allowedTypes.includes(file.type)) {
      showToast('请上传PDF、Word或图片格式的简历');
      return;
    }
    try {
      showToast('简历识别中...');
      const result = await recognizeResume(file);
      if (result.raw) {
        showToast('识别失败：' + result.raw);
      } else {
        showToast('识别成功：' + (result?.msg || JSON.stringify(result).slice(0, 100)));
      }
    } catch (err: any) {
      console.error(err);
      showToast('识别失败：' + (err?.message || '未知错误'));
    }
  };

  if (profileLoading) return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-purple-200 flex items-center justify-center">
        <div className="text-purple-600 text-lg">加载中...</div>
      </div>
    </ProtectedRoute>
  );

  if (!profile) return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-purple-200 flex items-center justify-center">
        <div className="text-red-600 text-lg">加载失败，请刷新页面重试</div>
      </div>
    </ProtectedRoute>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-purple-200 relative overflow-hidden">
        <Navigation />
        <div className="container mx-auto px-4 py-8 pt-20">
          {/* 基本信息 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col md:flex-row items-center mb-8 border border-purple-200">
            <img src={profile.avatar || defaultAvatar.src} alt="avatar" className="w-24 h-24 rounded-full border-4 border-purple-300 object-cover mr-8" onError={(e) => {
              e.currentTarget.src = defaultAvatar.src;
            }} />
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:space-x-6">
                <h2 className="text-2xl font-bold text-purple-800">{profile.first_name || ''}{profile.last_name || ''} <span className="text-base text-gray-500 ml-2">({profile.username || '未知用户'})</span></h2>
                <span className="text-sm text-gray-500 mt-2 md:mt-0">注册时间：{profile.date_joined ? profile.date_joined.slice(0, 10) : '未知'}</span>
                <span className="text-sm text-gray-500 mt-2 md:mt-0">上次登录：{profile.last_login ? profile.last_login.slice(0, 10) : '未知'}</span>
              </div>
              <div className="mt-2 text-gray-700">邮箱：{profile.email || '未设置'} | 手机：{profile.phone || '未设置'}</div>
              <div className="mt-2 text-gray-700">目标职位：{profile.target_position?.company_name || '未设置'} - {profile.target_position?.position_name || '未设置'} | 期望薪资：{profile.target_position?.expected_salary ? profile.target_position.expected_salary.join('-') : '未设置'}K</div>
              <div className="mt-4 flex space-x-4">
                <button
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg shadow hover:bg-purple-600 transition"
                  onClick={() => {
                    setEditProfile({
                      email: profile.email || '',
                      first_name: profile.first_name || '',
                      last_name: profile.last_name || '',
                      phone: profile.phone || '',
                      avatar: profile.avatar || '',
                      expected_position_id: String(profile.target_position?.job_position_id) || '',
                      expected_salary: profile.target_position?.expected_salary ? profile.target_position.expected_salary.join('-') : '',
                    });
                    setShowSidebar(true);
                  }}
                >
                  完善/更新资料
                </button>
                <label className="px-4 py-2 bg-purple-100 text-purple-700 border border-purple-400 rounded-lg shadow hover:bg-purple-200 transition cursor-pointer">
                  上传新简历
                  <input type="file" accept="application/pdf" className="hidden" onChange={handleResumeUpload} />
                </label>
              </div>
            </div>
          </div>

          {/* 简历和记录两列布局 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* 简历列表 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-purple-200">
              <h3 className="text-xl font-bold text-purple-700 mb-4">我的简历</h3>
              {resumes.length > 0 ? (
                <ul>
                  {resumes.map(resume => (
                    <li key={resume.resume_id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <span className="font-semibold text-purple-800">{resume.resume_name}</span>
                        <span className="ml-4 text-gray-500">{resume.expected_position}</span>
                        <span className={`ml-4 px-2 py-1 rounded text-xs ${resume.completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{resume.completed ? '已完善' : '未完善'}</span>
                      </div>
                      <span className="text-xs text-gray-400">更新于 {resume.updated}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-gray-500 text-center py-4">还没有简历</div>
              )}
            </div>
            {/* 刷题/面试记录Tab */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-purple-200">
              <h3 className="text-xl font-bold text-purple-700 mb-4">学习与面试记录</h3>
              <div className="flex space-x-4 mb-4">
                <button
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'interview' ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-700'}`}
                  onClick={() => setActiveTab('interview')}
                >
                  面试记录
                </button>
                <button
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'practice' ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-700'}`}
                  onClick={() => setActiveTab('practice')}
                >
                  刷题记录
                </button>
              </div>
              {activeTab === 'interview' ? (
                <ul>
                  {interviewRecords.map(record => (
                    <li key={record.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <span className="font-semibold text-purple-800">{record.company}</span>
                        <span className="ml-4 text-gray-500">{record.position}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-gray-500">{record.date}</span>
                        <span className={`font-bold ${record.result === '通过' ? 'text-green-600' : 'text-red-600'}`}>{record.result}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul>
                  {practiceRecords.map(record => (
                    <li key={record.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <span className="font-semibold text-purple-800">{record.title}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-gray-500">{record.date}</span>
                        <span className="text-purple-600 font-bold">{record.score}分</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {/* 能力评估 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-purple-200">
            <h3 className="text-xl font-bold text-purple-700 mb-4">能力评估</h3>
            {/* 评语区域 */}
            <div className="mb-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-gray-700">
                {commentLoading ? (
                  <span className="text-gray-400">评语加载中...</span>
                ) : commentError ? (
                  <span className="text-red-500">{commentError}</span>
                ) : profile && comment ? (
                  <>
                    <p>你好，{profile.first_name || ''}{profile.last_name || ''}，根据你的刷题和面试表现，系统对你的能力做出如下评估：</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      {comment.split('\n').map((line, idx) => (
                        <li key={idx}>{line}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p>暂无评语数据。</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <ReactECharts option={skillMatchOption} style={{ height: '260px' }} opts={{ renderer: 'canvas' }} />
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <ReactECharts option={pieOption} style={{ height: '260px' }} opts={{ renderer: 'canvas' }} />
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <ReactECharts option={trendOption} style={{ height: '260px' }} opts={{ renderer: 'canvas' }} />
              </div>
            </div>
          </div>
        </div>
        {showSidebar && (
          <div className="fixed top-0 right-0 h-full w-[350px] bg-white shadow-2xl z-50 flex flex-col p-8 border-l border-purple-200">
            <h2 className="text-xl font-bold text-purple-700 mb-4">编辑资料</h2>
            <label className="block mb-2 text-sm font-medium">邮箱</label>
            <input
              className="w-full mb-3 border rounded px-3 py-2"
              value={editProfile.email}
              onChange={e => setEditProfile(p => ({ ...p, email: e.target.value }))}
            />
            <label className="block mb-2 text-sm font-medium">姓</label>
            <input
              className="w-full mb-3 border rounded px-3 py-2"
              value={editProfile.first_name}
              onChange={e => setEditProfile(p => ({ ...p, first_name: e.target.value }))}
            />
            <label className="block mb-2 text-sm font-medium">名</label>
            <input
              className="w-full mb-3 border rounded px-3 py-2"
              value={editProfile.last_name}
              onChange={e => setEditProfile(p => ({ ...p, last_name: e.target.value }))}
            />
            <label className="block mb-2 text-sm font-medium">手机号</label>
            <input
              className="w-full mb-3 border rounded px-3 py-2"
              value={String(editProfile.phone ?? '')}
              onChange={e => setEditProfile(p => ({ ...p, phone: e.target.value }))}
            />
            <label className="block mb-2 text-sm font-medium">目标岗位</label>
            <div className="flex gap-2 mb-3">
              <input
                className="flex-1 border rounded px-3 py-2"
                placeholder="输入关键词搜索岗位"
                value={positionSearch}
                onChange={e => {
                  setPositionSearch(e.target.value);
                  fetchPositions(1, e.target.value);
                }}
              />
              <button
                className="px-2 py-1 bg-gray-200 rounded"
                onClick={() => { setPositionSearch(''); fetchPositions(1, ''); }}
                type="button"
              >重置</button>
            </div>
            <select
              className="w-full border rounded px-3 py-2 mb-3"
              value={editProfile.expected_position_id || ''}
              onChange={e => setEditProfile(p => ({ ...p, expected_position_id: e.target.value }))}
            >
              <option value="">请选择目标岗位</option>
              {positionOptions.map(pos => (
                <option key={pos.id} value={pos.id}>
                  {pos.company_name} - {pos.position_name}
                </option>
              ))}
            </select>
            <div className="flex justify-between items-center mb-2">
              <button
                className="px-2 py-1 text-xs"
                disabled={positionPage <= 1 || positionLoading}
                onClick={() => fetchPositions(positionPage - 1, positionSearch)}
                type="button"
              >上一页</button>
              <span className="text-xs text-gray-500">第 {positionPage} 页 / 共 {Math.ceil(positionTotal / 10) || 1} 页</span>
              <button
                className="px-2 py-1 text-xs"
                disabled={positionOptions.length < 10 || positionPage >= Math.ceil(positionTotal / 10) || positionLoading}
                onClick={() => fetchPositions(positionPage + 1, positionSearch)}
                type="button"
              >下一页</button>
            </div>
            <label className="block mb-2 text-sm font-medium">期望薪资（K/月）</label>
            <input
              className="w-full mb-3 border rounded px-3 py-2"
              placeholder="如：10-20"
              value={editProfile.expected_salary}
              onChange={e => setEditProfile(p => ({ ...p, expected_salary: e.target.value }))}
              type="text"
            />
            {/* 头像等其它字段同理 */}
            <div className="flex gap-2 mt-6">
              <button
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded font-bold"
                onClick={async () => {
                  await updateProfile({
                    ...editProfile,
                    phone: editProfile.phone ? editProfile.phone : undefined,
                    expected_position_id: editProfile.expected_position_id ? Number(editProfile.expected_position_id) : undefined,
                    expected_salary: editProfile.expected_salary
                      ? editProfile.expected_salary.split('-').map(s => Number(s.trim())).filter(Boolean)
                      : undefined,
                  });
                  setShowSidebar(false);
                  // 刷新资料
                  window.location.reload();
                }}
              >
                更新资料
              </button>
              <button
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded font-bold"
                onClick={() => setShowSidebar(false)}
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

