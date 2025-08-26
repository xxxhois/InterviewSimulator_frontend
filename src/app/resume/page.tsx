'use client';
import {
  createOrUpdateCustomSection,
  createOrUpdateEducationExperience,
  createOrUpdateProjectExperience,
  createOrUpdateResume,
  createOrUpdateWorkExperience,
  deleteCustomSection,
  deleteEducationExperience,
  deleteProjectExperience,
  deleteWorkExperience,
  getResumeDetail,
  getResumeList,
  handleResumeUpload
} from '@/api/resume';
import Navigation from '@/components/Navigation';
import ResumeOptimizer from '@/components/ResumeOptimizer';
import { showToast } from '@/components/Toast';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const emptyForm = {
  resume_name: '',
  real_name: '',
  age: '',
  graduation_date: '',
  education_level: '',
  expected_position: '',
};

// 生成唯一简历名称的辅助函数
const generateUniqueResumeName = (baseName: string = '我的简历') => {
  const timestamp = new Date().toLocaleString('zh-CN', { 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  }).replace(/[\/\s:]/g, '');
  return `${baseName}_${timestamp}`;
};

export default function ResumePage() {
  const [resumeList, setResumeList] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [formBasic, setFormBasic] = useState({ ...emptyForm });
  const [basicSubmitted, setBasicSubmitted] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showResumeOptimizer, setShowResumeOptimizer] = useState(false);
  const [workExperiences, setWorkExperiences] = useState<any[]>([]);
  const [projectExperiences, setProjectExperiences] = useState<any[]>([]);
  const [educationExperiences, setEducationExperiences] = useState<any[]>([]);
  const [customSections, setCustomSections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [resumeParsed, setResumeParsed] = useState<any>(null);
  const [skipDetailFetch, setSkipDetailFetch] = useState(false);
  // 其他分区略，实际可用 useState 管理

  // const mockResumeList = [
  //   { resume_id: 1, resume_name: '简历1' },
  //   { resume_id: 2, resume_name: '简历2' },
  // ];
  //获取简历列表
  useEffect(() => {
    getResumeList().then((res: any) => {
      setResumeList(res.resumes || []);
      if (res.resumes && res.resumes.length > 0) setSelectedResumeId(res.resumes[0].resume_id);
    });
  }, []);
  // useEffect(() => {
  //   setResumeList(mockResumeList);
  //   if (mockResumeList && mockResumeList.length > 0) setSelectedResumeId(mockResumeList[0].resume_id);
  // }, []);

  // 切换简历时拉取详情
  useEffect(() => {
    if (!selectedResumeId) {
      setFormBasic({ ...emptyForm });
      setBasicSubmitted(false);
      setWorkExperiences([]);
      setProjectExperiences([]);
      setEducationExperiences([]);
      setCustomSections([]);
      return;
    }
    
    // 如果是新建简历且正在创建中，或者需要跳过详情拉取，则不拉取详情
    if (isCreating || skipDetailFetch) {
      setSkipDetailFetch(false); // 重置标记
      return;
    }
    
    setIsLoading(true);
    console.log('拉取简历详情',selectedResumeId)
    getResumeDetail(selectedResumeId).then(detail => {
      console.log('detail',detail)
      const basicData = {
        resume_name: detail.resume_name || '',
        age: detail.age !== undefined && detail.age !== null ? String(detail.age) : '',
        graduation_date: detail.graduation_date || '',
        education_level: detail.education_level || '',
        expected_position: detail.expected_position || '',
        real_name: detail.name || '',
      };
      console.log('setFormBasic 填充值:', basicData);
      setFormBasic(basicData); 
      setWorkExperiences(detail.work_experiences || []);
      setProjectExperiences(detail.project_experiences || []);
      setEducationExperiences(detail.education_experiences || []);
      setCustomSections(detail.custom_sections || []);
      setBasicSubmitted(true);
      setIsLoading(false);
    });
  }, [selectedResumeId, isCreating]);

  // 新建简历
  const handleCreateNew = () => {
    setSelectedResumeId(null);
    // 生成唯一的简历名称
    const uniqueResumeName = generateUniqueResumeName();
    
    setFormBasic({ 
      ...emptyForm, 
      resume_name: uniqueResumeName 
    });
    setBasicSubmitted(false);
    setIsCreating(true);
  };

// useEffect(() => {
//   console.log('resumeParsed',resumeParsed)
//   if (resumeParsed) {
//     const mapped = mapThirdPartyResume(resumeParsed);
//     setFormBasic({
//       resume_name: mapped.name || '',
//       real_name: mapped.name || '',
//       age: mapped.age ? String(mapped.age) : '',
//       graduation_date: mapped.graduation_date || '',
//       education_level: mapped.education_level || '',
//       expected_position: mapped.expected_position || '',
//     });
//     setWorkExperiences(mapped.work_experiences || []);
//     setProjectExperiences(mapped.project_experiences || []);
//     setEducationExperiences(mapped.education_experiences || []);
//     setCustomSections(mapped.custom_sections || []);
//     setBasicSubmitted(false);
//     setIsCreating(true);
//   }
// }, [resumeParsed]);

const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const parsed = await handleResumeUpload(e);
  console.log('parsed',parsed)
  if (parsed) {
    setResumeParsed(parsed);
    setSelectedResumeId(null);
    setSkipDetailFetch(true); // 设置跳过详情拉取标记
    
    // 生成唯一的简历名称，避免重复
    const baseName = parsed.name || '我的简历';
    const uniqueResumeName = generateUniqueResumeName(baseName);
    
    setFormBasic({
      resume_name: uniqueResumeName,
      real_name: parsed.name || '',
      age: parsed.age ? String(parsed.age) : '',
      graduation_date: parsed.graduation_date || '',
      education_level: parsed.education_level || '',
      expected_position: parsed.expected_position || '',
    });
    setWorkExperiences(parsed.work_experiences || []);
    setProjectExperiences(parsed.project_experiences || []);
    setEducationExperiences(parsed.education_experiences || []);
    setCustomSections(parsed.custom_sections || []);
    setBasicSubmitted(false);
    setIsCreating(true);
  }
};
  // 提交基本信息
  const handleBasicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBasic.resume_name) {
      showToast('简历名称必须填写');
      return;
    }
    // 创建或更新简历
    try {
      const res = await createOrUpdateResume({
        resume_id: selectedResumeId || undefined,
        resume_name: formBasic.resume_name,
        name: formBasic.real_name,//兼容旧接口name
        age: Number(formBasic.age),
        graduation_date: formBasic.graduation_date,
        education_level: formBasic.education_level,
        expected_position: formBasic.expected_position,
        completed: !!( formBasic.age && formBasic.graduation_date && formBasic.education_level && formBasic.expected_position),
      });
      showToast('基础信息已保存');
      setBasicSubmitted(true);
      setIsCreating(false);
      
      // 如果是新建简历（OCR解析后的情况），直接选中新建的resumeId
      if (!selectedResumeId && res.resume_id) {
        // 更新本地简历列表，添加新建的简历
        const newResume = {
          resume_id: res.resume_id,
          resume_name: formBasic.resume_name
        };
        setResumeList(prev => [...prev, newResume]);
        // 设置跳过详情拉取标记，然后设置selectedResumeId
        setSkipDetailFetch(true);
        setSelectedResumeId(res.resume_id);
      } else if (!selectedResumeId && res.resume && res.resume.resume_id) {
        // 如果API返回的是嵌套结构
        const newResume = {
          resume_id: res.resume.resume_id,
          resume_name: formBasic.resume_name
        };
        setResumeList(prev => [...prev, newResume]);
        // 设置跳过详情拉取标记，然后设置selectedResumeId
        setSkipDetailFetch(true);
        setSelectedResumeId(res.resume.resume_id);
      }
    } catch (err: any) {
      console.error('保存失败:', err);
      // 检查是否是重复名称错误
      if (err.message && err.message.includes('Duplicate entry') && err.message.includes('resume_name')) {
        showToast('简历名称已存在，请修改简历名称后重试');
        // 自动生成新的简历名称
        const newResumeName = generateUniqueResumeName(formBasic.resume_name.split('_')[0]);
        setFormBasic(prev => ({ ...prev, resume_name: newResumeName }));
      } else {
        showToast('保存失败: ' + (err.message || '未知错误'));
      }
    }
  };

  const handleWorkChange = (idx: number, key: string, value: any) => {
    setWorkExperiences(prev => {
      const newList = [...prev];
      newList[idx] = { ...newList[idx], [key]: value };
      return newList;
    });
  };
  
  const handleAddWork = () => {
    setWorkExperiences(prev => [
      ...prev,
      {
        company_name: '',
        department: '',
        position: '',
        is_internship: false,
        start_date: '',
        end_date: '',
        work_content: '',
      },
    ]);
  };

  const handleDeleteWork = (idx: number) => {
    if (!selectedResumeId) {
      showToast('请先提交基本信息');
      return;
    }
    const work = workExperiences[idx];
    console.log('work',work)
    // 如果该工作经历有 work_id，说明已保存过，才调用删除接口
    if (work.id) {
      deleteWorkExperience({
        resume_id: selectedResumeId,
        work_id: work.id,
      });
    }
    setWorkExperiences(prev => prev.filter((_, i) => i !== idx));
  };
  
  const handleSaveSingleWork = async (idx: number) => {
    if (!selectedResumeId) {
      showToast('请先新建或选择一份简历');
      return;
    }
    const exp = workExperiences[idx];
    try {
      const res = await createOrUpdateWorkExperience({
        resume_id: selectedResumeId,
        work_id: exp.id,
        start_date: exp.start_date,
        end_date: exp.end_date,
        company_name: exp.company_name,
        department: exp.department,
        position: exp.position,
        work_content: exp.work_content,
        is_internship: exp.is_internship,
      });
      // 更新本地数据，添加或更新work_id
      if (res.work_id) {
        setWorkExperiences(prev => {
          const newList = [...prev];
          newList[idx] = { ...newList[idx], id: res.work_id };
          return newList;
        });
      }
      showToast('工作经历已保存');
    } catch (err) {
      showToast('保存失败');
    }
  };

  // 项目经历相关
  const handleProjectChange = (idx: number, key: string, value: any) => {
    setProjectExperiences(prev => {
      const newList = [...prev];
      newList[idx] = { ...newList[idx], [key]: value };
      return newList;
    });
  };

  const handleAddProject = () => {
    setProjectExperiences(prev => [
      ...prev,
      {
        project_name: '',
        project_role: '',
        project_link: '',
        start_date: '',
        end_date: '',
        project_content: '',
      },
    ]);
  };

  const handleDeleteProject = (idx: number) => {
    if (!selectedResumeId) {
      showToast('请先新建或选择一份简历');
      return;
    }
    const project = projectExperiences[idx];
    if (project.id) {
      deleteProjectExperience({
        resume_id: selectedResumeId,
        project_id: project.id,
      });
    }
    setProjectExperiences(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveSingleProject = async (idx: number) => {
    if (!selectedResumeId) {
      showToast('请先新建或选择一份简历');
      return;
    }
    const exp = projectExperiences[idx];
    try {
      const res = await createOrUpdateProjectExperience({
        resume_id: selectedResumeId,
        project_id: exp.id,
        start_date: exp.start_date,
        end_date: exp.end_date,
        project_name: exp.project_name,
        project_role: exp.project_role,
        project_link: exp.project_link,
        project_content: exp.project_content,
      });
      // 更新本地数据，添加或更新project_id
      if (res.project_id) {
        setProjectExperiences(prev => {
          const newList = [...prev];
          newList[idx] = { ...newList[idx], id: res.project_id };
          return newList;
        });
      }
      showToast('项目经历已保存');
    } catch (err) {
      showToast('保存失败');
    }
  };

  // 教育经历相关
  const handleEducationChange = (idx: number, key: string, value: any) => {
    setEducationExperiences(prev => {
      const newList = [...prev];
      newList[idx] = { ...newList[idx], [key]: value };
      return newList;
    });
  };
  const handleAddEducation = () => {
    setEducationExperiences(prev => [
      ...prev,
      {
        start_date: '',
        end_date: '',
        school_name: '',
        education_level: '',
        major: '',
        school_experience: '',
      },
    ]);
  };
  const handleDeleteEducation = (idx: number) => {
    if (!selectedResumeId) {
      showToast('请先新建或选择一份简历');
      return;
    }
    const edu = educationExperiences[idx];
    if (edu.id) {
      deleteEducationExperience({ resume_id: selectedResumeId, education_id: edu.id });
    }
    setEducationExperiences(prev => prev.filter((_, i) => i !== idx));
  };
  const handleSaveSingleEducation = async (idx: number) => {
    if (!selectedResumeId) {
      showToast('请先新建或选择一份简历');
      return;
    }
    const exp = educationExperiences[idx];
    try {
      const res = await createOrUpdateEducationExperience({
        resume_id: selectedResumeId,
        education_id: exp.id,
        start_date: exp.start_date,
        end_date: exp.end_date,
        school_name: exp.school_name,
        education_level: exp.education_level,
        major: exp.major,
        school_experience: exp.school_experience,
      });
      // 更新本地数据，添加或更新education_id
      if (res.education_id) {
        setEducationExperiences(prev => {
          const newList = [...prev];
          newList[idx] = { ...newList[idx], id: res.education_id };
          return newList;
        });
      }
      showToast('教育经历已保存');
    } catch (err) {
      showToast('保存失败');
    }
  };

  // 自定义分区相关
  const handleCustomChange = (idx: number, key: string, value: any) => {
    setCustomSections(prev => {
      const newList = [...prev];
      newList[idx] = { ...newList[idx], [key]: value };
      return newList;
    });
  };
  const handleAddCustom = () => {
    setCustomSections(prev => [
      ...prev,
      {
        title: '',
        content: '',
      },
    ]);
  };
  const handleDeleteCustom = (idx: number) => {
    if (!selectedResumeId) {
      showToast('请先新建或选择一份简历');
      return;
    }
    const custom = customSections[idx];
    if (custom.id) {
      deleteCustomSection({ resume_id: selectedResumeId, custom_id: custom.id });
    }
    setCustomSections(prev => prev.filter((_, i) => i !== idx));
  };
  const handleSaveSingleCustom = async (idx: number) => {
    if (!selectedResumeId) {
      showToast('请先新建或选择一份简历');
      return;
    }
    const exp = customSections[idx];
    try {
      const res = await createOrUpdateCustomSection({
        resume_id: selectedResumeId,
        custom_id: exp.id,
        title: exp.title,
        content: exp.content,
      });
      // 更新本地数据，添加或更新custom_id
      if (res.custom_id) {
        setCustomSections(prev => {
          const newList = [...prev];
          newList[idx] = { ...newList[idx], id: res.custom_id };
          return newList;
        });
      }
      showToast('自定义分区已保存');
    } catch (err) {
      showToast('保存失败');
    }
  };

  // 处理应用优化建议
  const handleApplyOptimization = (optimizationData: any) => {
    console.log('应用优化建议:', optimizationData);
    // 这里可以添加具体的优化逻辑
    // 例如：根据优化建议自动修改简历内容
    showToast('优化建议已应用，请查看更新后的简历内容');
  };

  // // 上传附件（解析接口预留）
  // const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (!file) return;
  //   showToast('解析功能开发中...');
  // };

  // 卡片分区折叠
  const [openSections, setOpenSections] = useState<string[]>(['basic']);
  const toggleSection = (key: string) => {
    setOpenSections(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const [showAllResumes, setShowAllResumes] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-purple-200 flex flex-col">
      <Navigation />
      <div className="flex-1 flex flex-col items-center w-full pt-16">
        {/* 顶部简历卡片横向列表 */}
        <div className="w-full max-w-7xl mx-auto px-4 pt-8 pb-4 flex items-center gap-4 overflow-x-auto scrollbar-hide">
          {(() => {
            const maxShow = 3;
            const showList = showAllResumes ? resumeList : resumeList.slice(0, maxShow);
            return <>
              {showList.map(r => (
                <motion.button
                  key={r.resume_id}
                  className={`min-w-[200px] px-8 py-5 rounded-2xl border-2 transition-all font-bold shadow-md flex-shrink-0 ${selectedResumeId === r.resume_id ? 'border-purple-500 bg-purple-50 text-purple-700 scale-105' : 'border-purple-200 bg-white text-gray-700 hover:border-purple-400 hover:bg-purple-100'}`}
                  whileHover={{ scale: 1.07 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setSelectedResumeId(r.resume_id); setIsCreating(false); }}
                >
                  {r.resume_name}
                </motion.button>
              ))}
              {resumeList.length > maxShow && !showAllResumes && (
                <motion.button
                  className="min-w-[120px] px-4 py-4 rounded-2xl border-2 border-dashed border-purple-300 bg-white text-purple-400 font-bold shadow-md flex-shrink-0 hover:border-purple-500 hover:text-purple-600 transition-all"
                  whileHover={{ scale: 1.07 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAllResumes(true)}
                >
                  更多
                </motion.button>
              )}
              <motion.button
                className="min-w-[180px] px-6 py-4 rounded-2xl border-2 border-dashed border-purple-300 bg-white text-purple-400 font-bold shadow-md flex-shrink-0 hover:border-purple-500 hover:text-purple-600 transition-all"
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateNew}
              >
                + 新建简历
              </motion.button>
              {resumeList.length > maxShow && showAllResumes && (
                <motion.button
                  className="min-w-[120px] px-4 py-4 rounded-2xl border-2 border-dashed border-purple-300 bg-white text-purple-400 font-bold shadow-md flex-shrink-0 hover:border-purple-500 hover:text-purple-600 transition-all"
                  whileHover={{ scale: 1.07 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAllResumes(false)}
                >
                  收起
                </motion.button>
              )}
            </>;
          })()}
        </div>

        {/* 主内容两栏布局 */}
        <div className="w-full max-w-7xl mx-auto px-4 pb-12 flex gap-10">
          {/* 主卡片 */}
          <motion.div layout className="flex-1 bg-white rounded-2xl shadow-xl border border-purple-200 p-12 mt-2">
            {/* 分区卡片折叠/展开 */}
            {/* 基本信息 */}
            <motion.section layout className="mb-6">
              <motion.div layout className="flex items-center justify-between cursor-pointer select-none" onClick={() => toggleSection('basic')}>
                <h2 className="text-lg font-bold text-purple-700">基本信息</h2>
                <motion.span animate={{ rotate: openSections.includes('basic') ? 90 : 0 }} className="material-icons text-purple-400">Expand</motion.span>
              </motion.div>
              <AnimatePresence>
                {openSections.includes('basic') && !isLoading && (
                  <motion.form
                    key="basic"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="pt-4"
                    onSubmit={handleBasicSubmit}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">简历名称 <span className="text-red-500">*</span></label>
                        <input
                          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 shadow-sm"
                          value={formBasic.resume_name}
                          onChange={e => setFormBasic({ ...formBasic, resume_name: e.target.value })}
                          required
                          disabled={basicSubmitted && !isCreating}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">姓名 <span className="text-red-500">*</span></label>
                        <input
                          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 shadow-sm"
                          value={formBasic.real_name || ''}
                          onChange={e => setFormBasic({ ...formBasic, real_name: e.target.value })}
                          required
                          disabled={basicSubmitted && !isCreating}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">年龄</label>
                        <input
                          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 shadow-sm"
                          value={formBasic.age}
                          onChange={e => setFormBasic({ ...formBasic, age: e.target.value })}
                          disabled={basicSubmitted && !isCreating}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">毕业时间</label>
                        <input
                          type="date"
                          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 shadow-sm"
                          value={formBasic.graduation_date}
                          onChange={e => setFormBasic({ ...formBasic, graduation_date: e.target.value })}
                          disabled={basicSubmitted && !isCreating}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">学历</label>
                        <select
                          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 shadow-sm"
                          value={formBasic.education_level}
                          onChange={e => setFormBasic({ ...formBasic, education_level: e.target.value })}
                          disabled={basicSubmitted && !isCreating}
                        >
                          <option value="">请选择学历</option>
                          <option value="高中及以下">高中及以下</option>
                          <option value="大专">大专</option>
                          <option value="本科">本科</option>
                          <option value="硕士">硕士</option>
                          <option value="博士">博士</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">期望职位</label>
                        <input
                          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 shadow-sm"
                          value={formBasic.expected_position}
                          onChange={e => setFormBasic({ ...formBasic, expected_position: e.target.value })}
                          disabled={basicSubmitted && !isCreating}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                      <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded font-bold" disabled={basicSubmitted && !isCreating}>提交基本信息</button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.section>
            {/* 工作经历 */}
            <motion.section layout className="mb-6">
              <motion.div layout className="flex items-center justify-between cursor-pointer select-none" onClick={() => toggleSection('work')}>
                <h2 className="text-lg font-bold text-purple-700">工作经历</h2>
                <motion.span animate={{ rotate: openSections.includes('work') ? 90 : 0 }} className="material-icons text-purple-400">Expand</motion.span>
              </motion.div>
              <AnimatePresence>
                {openSections.includes('work') && !isLoading && (
                  <motion.div
                    key="work"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="pt-4 text-gray-400"
                  >
                    {workExperiences.map((exp, idx) => (
                    <div key={exp.id || idx} className="mb-6 p-4 border rounded-lg bg-white shadow-sm relative">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">公司名称</label>
                            <input
                            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 shadow-sm"
                            value={exp.company_name}
                            onChange={e => handleWorkChange(idx, 'company_name', e.target.value)}
                            placeholder="请输入公司名称"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">部门</label>
                            <input
                            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 shadow-sm"
                            value={exp.department}
                            onChange={e => handleWorkChange(idx, 'department', e.target.value)}
                            placeholder="请输入部门"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">职位</label>
                            <input
                            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 shadow-sm"
                            value={exp.position}
                            onChange={e => handleWorkChange(idx, 'position', e.target.value)}
                            placeholder="请输入职位"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">实习经历</label>
                            <select
                            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 shadow-sm"
                            value={exp.is_internship ? 'true' : 'false'}
                            onChange={e => handleWorkChange(idx, 'is_internship', e.target.value === 'true')}
                            >
                            <option value="false">否</option>
                            <option value="true">是</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">开始时间</label>
                            <input
                            type="date"
                            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 shadow-sm"
                            value={exp.start_date}
                            onChange={e => handleWorkChange(idx, 'start_date', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">结束时间</label>
                            <input
                            type="date"
                            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 shadow-sm"
                            value={exp.end_date}
                            onChange={e => handleWorkChange(idx, 'end_date', e.target.value)}
                            />
                        </div>
                        </div>
                        <div className="mt-4">
                        <label className="block text-sm font-medium mb-1">工作内容</label>
                        <textarea
                            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 shadow-sm"
                            value={exp.work_content}
                            onChange={e => handleWorkChange(idx, 'work_content', e.target.value)}
                            placeholder="请简要描述主要工作内容"
                            rows={3}
                        />
                        </div>
                        <div className="flex justify-end mt-2">
                            <button
                                type="button"
                                className="bg-purple-500 text-white px-4 py-1 rounded font-bold hover:bg-purple-600"
                                onClick={() => handleSaveSingleWork(idx)}
                            >
                                保存本条
                            </button>
                        </div>
                        <button
                        type="button"
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteWork(idx)}
                        title="删除该工作经历"
                        >
                        删除
                        </button>
                    </div>
                    ))}
                    <button
                    type="button"
                    className="bg-purple-100 text-purple-700 px-4 py-2 rounded font-bold hover:bg-purple-200"
                    onClick={handleAddWork}
                    >
                    + 添加工作经历
                    </button>
                    {/* <button
                    type="button"
                    className="bg-purple-600 text-white px-6 py-2 rounded font-bold mt-2 ml-4"
                    onClick={handleWorkSubmit}
                    >
                    保存工作经历
                    </button> */}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
            {/* 项目经历 */}
            <motion.section layout className="mb-6">
              <motion.div layout className="flex items-center justify-between cursor-pointer select-none" onClick={() => toggleSection('project')}>
                <h2 className="text-lg font-bold text-purple-700">项目经历</h2>
                <motion.span animate={{ rotate: openSections.includes('project') ? 90 : 0 }} className="material-icons text-purple-400">Expand</motion.span>
              </motion.div>
              <AnimatePresence>
                {openSections.includes('project') && !isLoading && (
                  <motion.div
                    key="project"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="pt-4 text-gray-400"
                  >
                    {projectExperiences.map((exp, idx) => (
                      <div key={exp.id || idx} className="mb-6 p-4 border rounded-lg bg-white shadow-sm relative">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">项目名称</label>
                            <input
                              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 shadow-sm"
                              value={exp.project_name}
                              onChange={e => handleProjectChange(idx, 'project_name', e.target.value)}
                              placeholder="请输入项目名称"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">项目角色</label>
                            <input
                              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 shadow-sm"
                              value={exp.project_role}
                              onChange={e => handleProjectChange(idx, 'project_role', e.target.value)}
                              placeholder="请输入项目角色"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">项目链接</label>
                            <input
                              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 shadow-sm"
                              value={exp.project_link}
                              onChange={e => handleProjectChange(idx, 'project_link', e.target.value)}
                              placeholder="如：https://github.com/example/forum"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">开始时间</label>
                            <input
                              type="date"
                              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 shadow-sm"
                              value={exp.start_date}
                              onChange={e => handleProjectChange(idx, 'start_date', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">结束时间</label>
                            <input
                              type="date"
                              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 shadow-sm"
                              value={exp.end_date}
                              onChange={e => handleProjectChange(idx, 'end_date', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="block text-sm font-medium mb-1">项目内容</label>
                          <textarea
                            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 shadow-sm"
                            value={exp.project_content}
                            onChange={e => handleProjectChange(idx, 'project_content', e.target.value)}
                            placeholder="请简要描述项目内容"
                            rows={3}
                          />
                        </div>
                        <div className="flex justify-end mt-2">
                          <button
                            type="button"
                            className="bg-purple-500 text-white px-4 py-1 rounded font-bold hover:bg-purple-600"
                            onClick={() => handleSaveSingleProject(idx)}
                          >
                            保存本条
                          </button>
                        </div>
                        <button
                          type="button"
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteProject(idx)}
                          title="删除该项目经历"
                        >
                          删除
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="bg-purple-100 text-purple-700 px-4 py-2 rounded font-bold hover:bg-purple-200"
                      onClick={handleAddProject}
                    >
                      + 添加项目经历
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
            {/* 教育经历 */}
            <motion.section layout className="mb-6">
              <motion.div layout className="flex items-center justify-between cursor-pointer select-none" onClick={() => toggleSection('education')}>
                <h2 className="text-lg font-bold text-purple-700">教育经历</h2>
                <motion.span animate={{ rotate: openSections.includes('education') ? 90 : 0 }} className="material-icons text-purple-400">Expand</motion.span>
              </motion.div>
              <AnimatePresence>
                {openSections.includes('education') && !isLoading && (
                  <motion.div
                    key="education"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="pt-4 text-gray-400"
                  >
                    {educationExperiences.map((exp, idx) => (
                      <div key={exp.id || idx} className="mb-6 p-4 border rounded-lg bg-white shadow-sm relative">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">学校名称</label>
                            <input
                              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 shadow-sm"
                              value={exp.school_name}
                              onChange={e => handleEducationChange(idx, 'school_name', e.target.value)}
                              placeholder="请输入学校名称"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">学历</label>
                            <input
                              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 shadow-sm"
                              value={exp.education_level}
                              onChange={e => handleEducationChange(idx, 'education_level', e.target.value)}
                              placeholder="如：本科、硕士"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">专业</label>
                            <input
                              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 shadow-sm"
                              value={exp.major}
                              onChange={e => handleEducationChange(idx, 'major', e.target.value)}
                              placeholder="请输入专业"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">开始时间</label>
                            <input
                              type="date"
                              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 shadow-sm"
                              value={exp.start_date}
                              onChange={e => handleEducationChange(idx, 'start_date', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">结束时间</label>
                            <input
                              type="date"
                              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 shadow-sm"
                              value={exp.end_date}
                              onChange={e => handleEducationChange(idx, 'end_date', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="block text-sm font-medium mb-1">在校经历/荣誉</label>
                          <textarea
                            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 shadow-sm"
                            value={exp.school_experience}
                            onChange={e => handleEducationChange(idx, 'school_experience', e.target.value)}
                            placeholder="如：获得优秀毕业生称号"
                            rows={2}
                          />
                        </div>
                        <div className="flex justify-end mt-2">
                          <button
                            type="button"
                            className="bg-purple-500 text-white px-4 py-1 rounded font-bold hover:bg-purple-600"
                            onClick={() => handleSaveSingleEducation(idx)}
                          >
                            保存本条
                          </button>
                        </div>
                        <button
                          type="button"
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteEducation(idx)}
                          title="删除该教育经历"
                        >
                          删除
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="bg-purple-100 text-purple-700 px-4 py-2 rounded font-bold hover:bg-purple-200"
                      onClick={handleAddEducation}
                    >
                      + 添加教育经历
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
            {/* 自定义分区 */}
            <motion.section layout className="mb-6">
              <motion.div layout className="flex items-center justify-between cursor-pointer select-none" onClick={() => toggleSection('custom')}>
                <h2 className="text-lg font-bold text-purple-700">自定义分区</h2>
                <motion.span animate={{ rotate: openSections.includes('custom') ? 90 : 0 }} className="material-icons text-purple-400">Expand</motion.span>
              </motion.div>
              <AnimatePresence>
                {openSections.includes('custom') && !isLoading && (
                  <motion.div
                    key="custom"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="pt-4 text-gray-400"
                  >
                    {customSections.map((exp, idx) => (
                      <div key={exp.id || idx} className="mb-6 p-4 border rounded-lg bg-white shadow-sm relative">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">分区标题</label>
                            <input
                              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 shadow-sm"
                              value={exp.title}
                              onChange={e => handleCustomChange(idx, 'title', e.target.value)}
                              placeholder="如：技能证书、兴趣爱好等"
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="block text-sm font-medium mb-1">内容</label>
                          <textarea
                            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 shadow-sm"
                            value={exp.content}
                            onChange={e => handleCustomChange(idx, 'content', e.target.value)}
                            placeholder="如：获得Python开发工程师认证"
                            rows={2}
                          />
                        </div>
                        <div className="flex justify-end mt-2">
                          <button
                            type="button"
                            className="bg-purple-500 text-white px-4 py-1 rounded font-bold hover:bg-purple-600"
                            onClick={() => handleSaveSingleCustom(idx)}
                          >
                            保存本条
                          </button>
                        </div>
                        <button
                          type="button"
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteCustom(idx)}
                          title="删除该自定义分区"
                        >
                          删除
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="bg-purple-100 text-purple-700 px-4 py-2 rounded font-bold hover:bg-purple-200"
                      onClick={handleAddCustom}
                    >
                      + 添加自定义分区
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          </motion.div>

          {/* 工具卡片 */}
          <div className="w-80 flex-shrink-0">
            <motion.div layout className="bg-white rounded-2xl shadow-lg p-6 border border-purple-200 flex flex-col items-center mt-2">
              <h2 className="text-lg font-bold text-purple-700 mb-4">简历工具</h2>
              <motion.label
                className="block w-full bg-white rounded-lg border border-purple-200 px-4 py-2 mb-4 text-purple-700 font-medium cursor-pointer hover:bg-purple-50 hover:border-purple-400 transition-all flex items-center gap-2"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <input type="file" accept=".pdf,.doc,.docx,.jpg,.png,.bmp,.gif" onChange={e => handleFileChange(e)} className="hidden" />
                <span className="material-icons">upload_file</span> 上传附件
              </motion.label>
              <motion.button
                className="bg-gradient-to-r from-purple-400 to-purple-600 text-white px-6 py-2 rounded-lg font-bold w-full mt-2"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowResumeOptimizer(true)}
              >
                智能优化简历
              </motion.button>
            </motion.div>
          </div>
          {/* 简历优化组件 */}
          <ResumeOptimizer
            isOpen={showResumeOptimizer}
            onClose={() => setShowResumeOptimizer(false)}
            resumeList={resumeList}
            onApplyOptimization={handleApplyOptimization}
          />
        </div>
      </div>
    </div>
  );
}
