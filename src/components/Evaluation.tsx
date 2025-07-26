'use client';
import { getInterviewEvaluation } from '@/api/evaluation';
import AIbot from '@/assets/AIbot.json';
import type { EvaluationResult } from '@/types/evaluation';
import { Dialog, Transition } from '@headlessui/react';
import { Player } from '@lottiefiles/react-lottie-player';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, Suspense } from 'react';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface EvaluationModalProps {
  open: boolean;
  onClose: () => void;
  data?: EvaluationResult; // 可传入真实数据，默认用mock
}


const mockData: EvaluationResult = {
  "radar": {
    "data": {
      "dimensions": [
        "专业知识水平",
        "技能匹配度",
        "语言表达能力",
        "逻辑思维能力",
        "创新能力",
        "应变抗压能力"
      ],
      "scores": [
        80, 75, 70, 68, 60, 85
      ]
    },
    "comment": "应变抗压能力表现突出，表达与创新方面需加强。"
  },
  "pie": {
    "data": {
      "points": [
        { "label": "算法", "value": 40 },
        { "label": "网络", "value": 30 },
        { "label": "系统设计", "value": 30 }
      ]
    },
    "comment": "题目分布较均衡，建议重点巩固算法模块。"
  },
  "bar": {
    "data": {
      "labels": ["算法", "网络", "系统设计"],
      "accuracy": [0.9, 0.6, 0.7]
    },
    "comment": "算法掌握扎实，网络模块有待提高。"
  },
  "score": 78,
  "lastCompare": {
    "scoreChange": 2,
    "radarDelta": [5, -2, 1, -1, 0, 3]
  },
  "summary": {
    "starStructure": "S: 遇到系统设计题；T: 需要高并发分析；A: 正确使用缓存和分布式锁；R: 得到面试官好评。",
    "technicalSummary": "系统设计能力进步明显，表达清晰。"
  }
};

export default function EvaluationModal({ open, onClose }: EvaluationModalProps) {
  const searchParams = useSearchParams();
  const interview_id = searchParams.get('interview_id');
  const [evalData, setEvalData] = useState<EvaluationResult>(mockData);

  const contentRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      if (interview_id) {
        const data = await getInterviewEvaluation(Number(interview_id));
        setEvalData(data);
      }
    };
    fetchData();
  }, [interview_id]);
  // 雷达图配置
  const radarOption = {
    title: { text: '能力雷达图', left: 'center', textStyle: { color: '#7c3aed', fontWeight: 'bold', fontSize: 16 } },
    tooltip: {},
    radar: {
      indicator: evalData.radar?.data?.dimensions?.map((d) => ({ name: d, max: 100 })) || [],
      shape: 'circle',
      splitNumber: 5,
      axisName: { color: '#7c3aed', fontSize: 12 },
      splitLine: { lineStyle: { color: ['#e9d5ff'] } },
      splitArea: { show: false },
      axisLine: { lineStyle: { color: '#c4b5fd' } }
    },
    series: [{
      type: 'radar',
      data: [{
        value: evalData.radar?.data?.scores || [],
        name: '本次得分',
        areaStyle: { color: 'rgba(139,92,246,0.25)' },
        lineStyle: { color: '#7c3aed', width: 3 },
        itemStyle: { color: '#a78bfa' }
      }]
    }],
    animation: true,
    animationDuration: 1200
  };

  // 饼图配置
  const pieOption = {
    title: { text: '题型分布', left: 'center', textStyle: { color: '#7c3aed', fontWeight: 'bold', fontSize: 16 } },
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { color: '#7c3aed' } },
    series: [{
      name: '题型分布',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold', color: '#7c3aed' } },
      labelLine: { show: false },
      data: evalData.pie?.data?.points?.map((p, i) => ({
        value: p.value,
        name: p.label,
        itemStyle: { color: ['#a78bfa', '#c4b5fd', '#7c3aed'][i % 3] }
      })) || []
    }],
    animation: true,
    animationDuration: 1200
  };

  // 柱状图配置
  const barOption = {
    title: { text: '各模块正确率', left: 'center', textStyle: { color: '#7c3aed', fontWeight: 'bold', fontSize: 16 } },
    tooltip: { trigger: 'axis', formatter: (params: any) => `${params[0].name}: ${(params[0].value * 100).toFixed(1)}%` },
    xAxis: {
      type: 'category',
      data: evalData.bar?.data?.labels || [],
      axisLine: { lineStyle: { color: '#a78bfa' } },
      axisLabel: { color: '#7c3aed', fontWeight: 500 }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 1,
      axisLabel: { formatter: (v: number) => `${(v * 100).toFixed(0)}%`, color: '#7c3aed' },
      splitLine: { lineStyle: { color: '#ede9fe' } }
    },
    series: [{
      data: evalData.bar?.data?.accuracy || [],
      type: 'bar',
      barWidth: 32,
      itemStyle: {
        color: (params: any) => ['#a78bfa', '#c4b5fd', '#7c3aed'][params.dataIndex % 3],
        borderRadius: [8, 8, 0, 0]
      },
      label: {
        show: true,
        position: 'top',
        formatter: (v: any) => `${(v.value * 100).toFixed(0)}%`,
        color: '#7c3aed',
        fontWeight: 600
      }
    }],
    animation: true,
    animationDuration: 1200
  };

  // 导出图片
  const handleExport = async () => {
    if (!contentRef.current) return;
    setExporting(true);
    const panel = contentRef.current;
    // 递归替换所有oklch为rgb
    const replaced: Array<{el: Element, attr: string, value: string}> = [];
    const walk = (el: Element) => {
      // 替换style属性
      if (el instanceof HTMLElement || el instanceof SVGElement) {
        ['color', 'backgroundColor', 'borderColor', 'fill', 'stroke'].forEach((prop) => {
          if (el.style && (el.style as any)[prop]) {
            const styleVal = (el.style as any)[prop];
            if (typeof styleVal === 'string' && styleVal.includes('oklch')) {
              replaced.push({el, attr: prop, value: styleVal});
              (el.style as any)[prop] = 'rgb(34,34,34)';
            }
          }
        });
      }
      // 替换SVG属性
      if (el instanceof SVGElement) {
        ['fill', 'stroke'].forEach((attr) => {
          const val = el.getAttribute(attr);
          if (val && val.includes('oklch')) {
            replaced.push({el, attr, value: val});
            el.setAttribute(attr, 'rgb(34,34,34)');
          }
        });
      }
      Array.from(el.children).forEach(child => walk(child));
    };
    walk(panel);
    try {
      await new Promise(res => setTimeout(res, 300));
      const canvas = await html2canvas(panel, { backgroundColor: null, useCORS: true });
      const link = document.createElement('a');
      link.download = '面评报告.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      alert('导出失败，请检查浏览器兼容性或控制台报错');
      console.error('导出图片失败', err);
    }
    // 恢复原色
    replaced.forEach(({el, attr, value}) => {
      if (el instanceof HTMLElement || el instanceof SVGElement) {
        if (el.style && (el.style as any)[attr] !== undefined) {
          (el.style as any)[attr] = value;
        }
        if (el instanceof SVGElement && (attr === 'fill' || attr === 'stroke')) {
          el.setAttribute(attr, value);
        }
      }
    });
    setExporting(false);
  };

  return (
    <Transition appear show={open} as={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Dialog as="div" className="fixed inset-0 z-50 flex items-center justify-center" onClose={onClose}>
        {/* 遮罩层 */}
        <Transition.Child
          as={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>
        {/* 内容区 */}
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <Transition.Child
            as={motion.div}
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 40 }}
            // 修复：Transition.Child 的 transition 属性应为 boolean 或 undefined，不能传对象
          >
            <Dialog.Panel className="w-full max-w-4xl bg-gradient-to-br from-purple-100 to-purple-200 rounded-3xl shadow-2xl border-2 border-purple-200 flex flex-col overflow-hidden relative">
              {/* 关闭按钮 */}
              <button
                className="absolute top-4 right-6 text-3xl text-purple-400 hover:text-purple-700 font-bold z-10 transition-colors"
                onClick={onClose}
                aria-label="关闭"
              >×</button>
              {/* 导出按钮 */}
              <button
                className="absolute top-4 right-16 bg-purple-600 hover:bg-purple-700 text-white px-4 py-1 rounded-lg shadow font-semibold text-sm z-10 transition-all disabled:opacity-60"
                onClick={handleExport}
                disabled={exporting}
              >{exporting ? '导出中...' : '导出图片'}</button>
              {/* 内容主体 */}
              <div ref={contentRef} className="flex flex-col md:flex-row gap-6 p-8 pt-14 md:pt-10">
                {/* 左侧动画与分数 */}
                <motion.div
                  className="flex flex-col items-center justify-center md:w-1/4 w-full gap-4"
                  initial={{ x: -40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Player
                    autoplay
                    loop
                    src={AIbot}
                    style={{ height: '120px', width: '120px' }}
                  />
                  <div className="text-5xl font-extrabold text-purple-700 drop-shadow mb-2 flex items-end gap-2">
                    {evalData.score || 0}
                    <span className="text-lg font-medium text-purple-400 mb-1">分</span>
                  </div>
                  <div className="text-sm text-purple-600 font-semibold mb-1">本次综合得分</div>
                  <div className="text-xs text-purple-500">
                    {evalData.lastCompare?.scoreChange !== undefined ? (
                      <>
                        较上次{evalData.lastCompare.scoreChange >= 0 ? '提升' : '下降'}
                        <span className={evalData.lastCompare.scoreChange >= 0 ? 'text-green-600' : 'text-red-500'}>
                          {evalData.lastCompare.scoreChange >= 0 ? '+' : ''}{evalData.lastCompare.scoreChange}
                        </span>分
                      </>
                    ) : (
                      '暂无对比数据'
                    )}
                  </div>
                </motion.div>
                {/* 右侧图表与评语 */}
                <motion.div
                  className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6"
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  {/* 雷达图 */}
                  <div className="bg-white/90 rounded-2xl p-4 border border-purple-200 shadow flex flex-col">
                    <ReactECharts option={radarOption} style={{ height: 220 }} opts={{ renderer: 'canvas' }} />
                    <div className="text-xs text-purple-500 mt-2 text-center min-h-[32px]">{evalData.radar?.comment || ''}</div>
                  </div>
                  {/* 饼图 */}
                  <div className="bg-white/90 rounded-2xl p-4 border border-purple-200 shadow flex flex-col">
                    <ReactECharts option={pieOption} style={{ height: 220 }} opts={{ renderer: 'canvas' }} />
                    <div className="text-xs text-purple-500 mt-2 text-center min-h-[32px]">{evalData.pie?.comment || ''}</div>
                  </div>
                  {/* 柱状图 */}
                  <div className="bg-white/90 rounded-2xl p-4 border border-purple-200 shadow flex flex-col">
                    <ReactECharts option={barOption} style={{ height: 220 }} opts={{ renderer: 'canvas' }} />
                    <div className="text-xs text-purple-500 mt-2 text-center min-h-[32px]">{evalData.bar?.comment || ''}</div>
                  </div>
                </motion.div>
              </div>
              {/* STAR结构与技术总结 */}
              <motion.div
                className="bg-gradient-to-r from-purple-50 to-purple-100 border-t border-purple-200 px-8 py-6 flex flex-col md:flex-row gap-6"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                <div className="flex-1">
                  <div className="text-sm font-bold text-purple-700 mb-1">STAR结构总结</div>
                  <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{evalData.summary?.starStructure || ''}</div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-purple-700 mb-1">技术能力总结</div>
                  <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{evalData.summary?.technicalSummary || ''}</div>
                </div>
              </motion.div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
