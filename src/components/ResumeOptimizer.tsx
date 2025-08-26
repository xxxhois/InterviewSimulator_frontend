'use client';
import { applyResumeOptimization, getResumeDetail } from '@/api/resume';
import { showToast } from '@/components/Toast';
import { useAuthStore } from '@/store/authStore';
import { AnimatePresence, motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { marked } from 'marked';
import { useEffect, useRef, useState } from 'react';

interface Resume {
  resume_id: number;
  resume_name: string;
}

interface ResumeOptimizerProps {
  isOpen: boolean;
  onClose: () => void;
  resumeList: Resume[];
  onApplyOptimization?: (optimizationData: any) => void;
}

interface OptimizationMessage {
  id: string;
  type: 'start' | 'content' | 'end';
  content?: string;
  timestamp: Date;
}

export default function ResumeOptimizer({ 
  isOpen, 
  onClose, 
  resumeList, 
  onApplyOptimization 
}: ResumeOptimizerProps) {
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [messages, setMessages] = useState<OptimizationMessage[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isOptimizationComplete, setIsOptimizationComplete] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [appliedResume, setAppliedResume] = useState<any | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const resumePrintRef = useRef<HTMLDivElement>(null);
  const { token } = useAuthStore();

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 初始化欢迎消息
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: `${Date.now()}_welcome`,
        type: 'content',
        content: '你好！我是简历优化助手。请选择一份简历，然后点击"开始优化"按钮，我将为您提供专业的优化建议。',
        timestamp: new Date()
      }]);
    }
  }, [isOpen, messages.length]);

  // 清理WebSocket连接
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // 开始优化
  const startOptimization = async () => {
    if (!selectedResumeId) {
      showToast('请先选择一份简历');
      return;
    }

    if (!token) {
      showToast('请先登录');
      return;
    }

    setIsOptimizing(true);
    setIsOptimizationComplete(false);
    setIsApplied(false);
    setMessages([{
      id: `${Date.now()}_start`,
      type: 'start',
      content: '正在分析您的简历，请稍候...',
      timestamp: new Date()
    }]);

    try {
      // 建立WebSocket连接
      const wsUrl = `ws://127.0.0.1:8000/ws/resume/optimize/?token=${token}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket连接已建立');
        // 发送简历ID
        ws.send(JSON.stringify({
          resume_id: selectedResumeId
        }));
      };

      ws.onmessage = (event) => {
        // 将任意非 start/end 的消息当作内容块追加
        let handled = false;
        try {
          const data = JSON.parse(event.data);
          if (data && typeof data === 'object' && 'type' in data) {
            if (data.type === 'start') {
              setMessages(prev => [...prev, {
                id: `${Date.now()}_start`,
                type: 'start',
                content: '开始优化分析...',
                timestamp: new Date()
              }]);
              handled = true;
            } else if (data.type === 'end') {
              setMessages(prev => [...prev, {
                id: `${Date.now()}_end`,
                type: 'end',
                content: '优化分析完成！',
                timestamp: new Date()
              }]);
              setIsOptimizationComplete(true);
              setIsOptimizing(false);
              ws.close();
              handled = true;
            } else if (data.type === 'delta' && (data.text || data.delta || data.content)) {
              const chunkText = String(data.text || data.delta || data.content);
              setMessages(prev => {
                const next = [...prev];
                if (next.length === 0 || next[next.length - 1].type !== 'content') {
                  next.push({ id: `${Date.now()}_content`, type: 'content', content: '', timestamp: new Date() });
                }
                const last = next[next.length - 1];
                next[next.length - 1] = { ...last, content: (last.content || '') + chunkText };
                return next;
              });
              handled = true;
            } else if (data.content) {
              const chunkText = String(data.content);
              setMessages(prev => {
                const next = [...prev];
                if (next.length === 0 || next[next.length - 1].type !== 'content') {
                  next.push({ id: `${Date.now()}_content`, type: 'content', content: '', timestamp: new Date() });
                }
                const last = next[next.length - 1];
                next[next.length - 1] = { ...last, content: (last.content || '') + chunkText };
                return next;
              });
              handled = true;
            }
          }
        } catch (error) {
          // 非 JSON 消息，视为内容块
        }

        if (!handled) {
          const chunkText = typeof event.data === 'string' ? event.data : '';
          if (chunkText) {
            setMessages(prev => {
              const next = [...prev];
              if (next.length === 0 || next[next.length - 1].type !== 'content') {
                next.push({ id: `${Date.now()}_content`, type: 'content', content: '', timestamp: new Date() });
              }
              const last = next[next.length - 1];
              next[next.length - 1] = { ...last, content: (last.content || '') + chunkText };
              return next;
            });
          }
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket错误:', error);
        showToast('连接失败，请重试');
        setIsOptimizing(false);
      };

      ws.onclose = () => {
        console.log('WebSocket连接已关闭');
        wsRef.current = null;
      };

    } catch (error) {
      console.error('开始优化失败:', error);
      showToast('开始优化失败，请重试');
      setIsOptimizing(false);
    }
  };

  // 应用优化建议
  const applyOptimization = async () => {
    if (!selectedResumeId) return;

    setIsApplying(true);
    try {
      await applyResumeOptimization({
        resume_id: selectedResumeId,
        apply: true
      });
      
      showToast('优化建议已成功应用');
      setIsApplied(true);
      
      // 拉取新的简历详情
      if (onApplyOptimization) {
        const updatedResume = await getResumeDetail(selectedResumeId);
        onApplyOptimization(updatedResume);
        setAppliedResume(updatedResume);
      }
      
    } catch (error) {
      console.error('应用优化建议失败:', error);
      showToast('应用优化建议失败，请重试');
    } finally {
      setIsApplying(false);
    }
  };

  // 导出PDF
  const exportPDF = async () => {
    if (!selectedResumeId) return;

    setIsExporting(true);
    try {
      if (!appliedResume) {
        const detail = await getResumeDetail(selectedResumeId);
        setAppliedResume(detail);
      }

      // 等待下一帧以确保隐藏模板渲染
      await new Promise(requestAnimationFrame);

      const target = resumePrintRef.current;
      if (!target) throw new Error('找不到简历模板节点');

      const canvas = await html2canvas(target, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        windowWidth: target.scrollWidth,
        windowHeight: target.scrollHeight,
      });

      // 动态引入 jsPDF，生成并下载 PDF（多页支持）
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pageWidthMm = pdf.internal.pageSize.getWidth();
      const pageHeightMm = pdf.internal.pageSize.getHeight();

      const pxToMm = (px: number) => (px * pageWidthMm) / canvas.width;

      const sliceHeightPx = Math.floor((canvas.width / pageWidthMm) * pageHeightMm); // 等比换算单页像素高度
      const totalPages = Math.ceil(canvas.height / sliceHeightPx);

      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = canvas.width;

      for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        const yPx = pageIndex * sliceHeightPx;
        const currentSlicePx = Math.min(sliceHeightPx, canvas.height - yPx);
        tempCanvas.height = currentSlicePx;
        if (tempCtx) {
          tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
          // 从原始画布裁切一段绘制到临时画布
          tempCtx.drawImage(
            canvas,
            0, yPx, canvas.width, currentSlicePx,
            0, 0, canvas.width, currentSlicePx
          );
        }

        const imgDataSlice = tempCanvas.toDataURL('image/png');
        const sliceHeightMm = pxToMm(currentSlicePx);

        if (pageIndex > 0) pdf.addPage();
        pdf.addImage(imgDataSlice, 'PNG', 0, 0, pageWidthMm, sliceHeightMm);
      }

      pdf.save(`简历_${selectedResumeId}.pdf`);
      showToast('PDF已生成并开始下载');
    } catch (error) {
      console.error('导出PDF失败:', error);
      showToast('导出PDF失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 right-0 h-full w-[500px] bg-white shadow-2xl z-50 flex flex-col border-l border-purple-200 overflow-y-auto"
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-purple-200">
            <h2 className="text-xl font-bold text-purple-700">智能简历优化</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="material-icons">close</span>
            </button>
          </div>

          {/* 简历选择 */}
          <div className="p-6 border-b border-purple-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择要优化的简历
            </label>
            <select
              value={selectedResumeId || ''}
              onChange={(e) => setSelectedResumeId(Number(e.target.value) || null)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500"
              disabled={isOptimizing}
            >
              <option value="">请选择简历</option>
              {resumeList.map(resume => (
                <option key={resume.resume_id} value={resume.resume_id}>
                  {resume.resume_name}
                </option>
              ))}
            </select>
          </div>

          {/* 开始优化按钮 */}
          <div className="p-6 border-b border-purple-200">
            <button
              onClick={startOptimization}
              disabled={!selectedResumeId || isOptimizing}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isOptimizing ? '优化中...' : '开始优化'}
            </button>
          </div>

          {/* 优化结果区域 */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 rounded-lg px-4 py-2 max-w-[90%]">
                    {message.type === 'content' ? (
                      <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: marked.parse(message.content || '') }} />
                    ) : (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    )}
                    {message.type === 'start' && isOptimizing && (
                      <div className="mt-2 flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                        <span className="text-sm text-gray-600">正在分析...</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* 底部操作按钮 */}
            <div className="p-6 border-t border-purple-200 space-y-3">
              {isOptimizationComplete && (
                <button
                  onClick={applyOptimization}
                  disabled={isApplying}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isApplying ? '应用中...' : '应用优化建议'}
                </button>
              )}
              
              {isApplied && (
                <button
                  onClick={exportPDF}
                  disabled={isExporting}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isExporting ? '导出中...' : '导出PDF'}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
      {/* 隐藏的简历模板（用于导出） */}
      <div style={{ position: 'fixed', left: -99999, top: 0 }}>
        <div ref={resumePrintRef} style={{ width: '794px', minHeight: '1123px', background: '#fff', color: '#111', padding: '32px', boxSizing: 'border-box' }}>
          {/* A4 96DPI 约 794x1123 */}
          <div style={{ borderBottom: '2px solid #7c3aed', paddingBottom: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>{appliedResume?.name || '姓名'}</div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{appliedResume?.expected_position || ''}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px', fontSize: '14px' }}>
            <div>年龄：{appliedResume?.age ?? '-'}</div>
            <div>学历：{appliedResume?.education_level || '-'}</div>
            <div>毕业时间：{appliedResume?.graduation_date || '-'}</div>
            <div>创建时间：{appliedResume?.created_at ? String(appliedResume.created_at).slice(0, 10) : '-'}</div>
          </div>

          {/* 工作经历 */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#7c3aed', marginBottom: '8px' }}>工作经历</div>
            {(appliedResume?.work_experiences || []).map((w: any, i: number) => (
              <div key={w.id || i} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>{w.company_name} · {w.position}</span>
                  <span style={{ color: '#6b7280' }}>{w.start_date} - {w.end_date || '至今'}</span>
                </div>
                <div style={{ color: '#374151', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{w.work_content}</div>
                {w.department ? <div style={{ color: '#6b7280', marginTop: '2px' }}>部门：{w.department}</div> : null}
              </div>
            ))}
          </div>

          {/* 项目经历 */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#7c3aed', marginBottom: '8px' }}>项目经历</div>
            {(appliedResume?.project_experiences || []).map((p: any, i: number) => (
              <div key={p.id || i} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>{p.project_name} · {p.project_role}</span>
                  <span style={{ color: '#6b7280' }}>{p.start_date} - {p.end_date || '至今'}</span>
                </div>
                {p.project_link ? <div style={{ color: '#2563eb' }}>{p.project_link}</div> : null}
                <div style={{ color: '#374151', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{p.project_content}</div>
              </div>
            ))}
          </div>

          {/* 教育经历 */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#7c3aed', marginBottom: '8px' }}>教育经历</div>
            {(appliedResume?.education_experiences || []).map((e: any, i: number) => (
              <div key={e.id || i} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>{e.school_name} · {e.education_level}</span>
                  <span style={{ color: '#6b7280' }}>{e.start_date} - {e.end_date}</span>
                </div>
                {e.major ? <div style={{ color: '#6b7280' }}>专业：{e.major}</div> : null}
                {e.school_experience ? <div style={{ color: '#374151', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{e.school_experience}</div> : null}
              </div>
            ))}
          </div>

          {/* 自定义板块 */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#7c3aed', marginBottom: '8px' }}>自定义</div>
            {(appliedResume?.custom_sections || []).map((c: any) => (
              <div key={c.id} style={{ marginBottom: '12px' }}>
                <div style={{ fontWeight: 600 }}>{c.title}</div>
                <div style={{ color: '#374151', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{c.content}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
}
