'use client';
import { getInterviewEvaluation } from '@/api/evaluation';
import AIbot from '@/assets/AIbot.json';
import type { EvaluationResult } from '@/types/evaluation';
import { Dialog, Transition } from '@headlessui/react';
import { Player } from '@lottiefiles/react-lottie-player';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
// 动态导入 html2canvas，避免 SSR 问题
let html2canvas: any = null;
if (typeof window !== 'undefined') {
  import('html2canvas').then(module => {
    html2canvas = module.default;
  });
}

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
              42.5,
              45.0,
              47.5,
              42.5,
              30.0,
              47.5
          ]
      },
      "comment": "语言表达能力表现突出，创新能力方面需加强。"
  },
  "pie": {
      "data": {
          "points": [
              {
                  "label": "性能优化",
                  "value": 6
              },
              {
                  "label": "并发编程",
                  "value": 3
              },
              {
                  "label": "数据库设计",
                  "value": 2
              },
              {
                  "label": "微服务设计",
                  "value": 3
              },
              {
                  "label": "分布式系统",
                  "value": 3
              },
              {
                  "label": "压力测试",
                  "value": 1
              },
              {
                  "label": "事务管理",
                  "value": 1
              },
              {
                  "label": "锁机制",
                  "value": 1
              },
              {
                  "label": "系统架构",
                  "value": 1
              }
          ]
      },
      "comment": "题目分布较均衡，建议系统性复习。"
  },
  "bar": {
      "data": {
          "labels": [
              "性能优化",
              "并发编程",
              "数据库设计",
              "分布式系统",
              "微服务设计",
              "压力测试",
              "事务管理",
              "锁机制",
              "系统架构"
          ],
          "accuracy": [
              0.44,
              0.33,
              0.6,
              0.4,
              0.4,
              0.6,
              0.4,
              0.4,
              0.6
          ]
      },
      "comment": "数据库设计掌握扎实，并发编程模块有待提高。"
  },
  "score": 42.5,
  "lastCompare": null,
  "summary": {
      "starStructure": "面试者在多个问题上表现不够理想，特别是在专业知识水平和技能匹配度方面。建议在回答技术问题时，应结合具体项目和实例来展示自己的能力。例如，通过实际项目中遇到的算法应用和性能优化案例来增强回答的可信度和说服力。此外，保持冷静，清晰地组织语言是提升面试表现的关键。",
      "technicalSummary": "面试者具备一定的技术背景，但缺乏深入的专业知识和创新思维。需加强特定领域的深入学习和实践，以更好地适应高级算法工程师的要求。"
  },
  "question_analysis": [
      {
          "question": "请描述一下你对算法复杂度的理解，并举例说明如何分析一个算法的时间和空间复杂度。",
          "answer": "[答案内容将通过音频文件转写获得]",
          "ai_analysis": "专业知识水平：2分。理由：回答内容较为模糊，没有具体解释算法复杂度的概念或分析方法。\n技能匹配度：2分。理由：回答内容与岗位要求相关，但缺乏具体实例和详细解释。\n语言表达能力：2分。理由：回答内容简洁明了，但缺乏条理性和专业性。\n逻辑思维能力：2分。理由：回答内容缺乏逻辑性，未能有效组织信息。\n创新能力：1分。理由：回答内容未展示出任何创新性的思考或解决方案。\n应变抗压能力：2分。理由：在面对问题时表现出一定的紧张感，但整体表现尚可。\n答案正确性：1分。理由：回答内容不完整且不够准确，未能全面覆盖知识点。\n\n回答建议：在回答此类问题时，可以先简要介绍算法复杂度的基本概念，然后通过具体的例子来分析时间复杂度和空间复杂度。例如，可以通过排序算法（如冒泡排序、快速排序）来说明不同算法之间的差异及其对时间和空间资源的影响。同时，在回答过程中保持冷静，确保语言表达清晰、有条理。",
          "knowledge_points": [
              "性能优化",
              "并发编程"
          ]
      },
      {
          "question": "在设计高效的算法时，你会考虑哪些因素？请结合具体的应用场景进行说明。",
          "answer": "[答案内容将通过音频文件转写获得]",
          "ai_analysis": "专业知识水平：3分。理由：提到了图最短路径算法和图优化算法，但没有深入解释这些算法如何应用于智能驾驶场景。\n技能匹配度：3分。理由：提到的算法与岗位需求相关，但缺乏具体的技能展示。\n语言表达能力：3分。理由：表达较为流畅，但不够清晰和有条理。\n逻辑思维能力：3分。理由：能够提出一些算法概念，但在逻辑上稍显混乱。\n创新能力：2分。理由：没有提出任何独特的创新想法或解决方案。\n应变抗压能力：3分。理由：面对问题时表现出一定的思考过程，但有些犹豫不决。\n答案正确性：3分。理由：回答了部分知识点，但未能全面覆盖题目要求的所有方面。\n\n回答建议：在回答此类问题时，可以先简要介绍几种常见的高效算法，如贪心算法、动态规划、回溯法等，并举例说明它们在实际应用中的优势。同时，可以强调算法的设计需要综合考虑时间复杂度、空间复杂度以及应用场景的具体需求。此外，在回答过程中保持冷静，避免过度紧张导致语速过快或表述不清。最后，注意总结归纳，确保回答完整且具有针对性。",
          "knowledge_points": [
              "性能优化",
              "并发编程",
              "数据库设计"
          ]
      },
      {
          "question": "你是否有使用过机器学习算法解决实际问题的经验？如果有，请简要描述一下你是如何应用这些算法的。",
          "answer": "[答案内容将通过音频文件转写获得]",
          "ai_analysis": "回答建议：在回答此类问题时，可以先简要介绍机器学习算法的基本概念，然后结合实际项目经验，说明如何应用这些算法解决实际问题。例如，可以举例说明在某个项目中，如何使用机器学习算法进行数据分析、预测或分类，并强调这些算法在提高工作效率和决策准确性方面的作用。同时，在回答过程中保持冷静，确保语言表达清晰、有条理。",
          "knowledge_points": [
              "性能优化",
              "微服务设计",
              "数据库设计"
          ]
      },
      {
          "question": "请你谈谈对深度学习算法的理解，以及它在阿里巴巴业务中的潜在应用场景。",
          "answer": "[答案内容将通过音频文件转写获得]",
          "ai_analysis": "专业知识水平：2分。理由：回答内容偏离了提问的主题，没有涉及到深度学习算法及其在阿里巴巴业务中的应用。\n技能匹配度：2分。理由：回答内容偏离了提问的主题，没有涉及到深度学习算法及其在阿里巴巴业务中的应用。\n语言表达能力：3分。理由：回答较为流畅，但缺乏针对性和准确性。\n逻辑思维能力：2分。理由：回答内容缺乏条理性和连贯性，未能有效组织信息。\n创新能力：1分。理由：回答内容缺乏创新性和独特性。\n应变抗压能力：3分。理由：面对问题时能够保持冷静，但回答内容未触及核心要点。\n答案正确性：1分。理由：回答内容严重偏离问题核心，未能提供正确的知识点。\n\n回答建议：首先明确问题的核心是关于深度学习算法在阿里巴巴业务中的应用场景，然后结合阿里巴巴作为电子商务平台的特点，阐述深度学习算法如何用于商品推荐等场景，并举例说明其重要性。",
          "knowledge_points": [
              "分布式系统",
              "性能优化",
              "微服务设计"
          ]
      },
      {
          "question": "在处理大规模数据集时，你通常采用哪些策略来确保算法的性能和可扩展性？",
          "answer": "[答案内容将通过音频文件转写获得]",
          "ai_analysis": "专业知识水平：3分。理由：提到了Hadoop和Spark这样的平台，但没有深入讨论性能优化或分布式系统的相关知识。\n技能匹配度：3分。理由：提到了常用的工具和技术，但缺乏具体的应用场景和实践经验描述。\n语言表达能力：3分。理由：能够清晰地表达自己的观点，但在回答过程中有些停顿和重复。\n逻辑思维能力：3分。理由：回答有一定的条理性，但缺乏深入的分析和思考。\n创新能力：2分。理由：回答主要集中在已知的工具上，缺乏创新性的解决方案。\n应变抗压能力：3分。理由：回答过程较为平稳，但在回答过程中有明显的思考时间。\n答案正确性：3分。理由：回答了问题的核心内容，但缺乏具体的细节和深入的解释。\n\n回答建议：可以进一步详细说明使用这些平台的具体方法和技巧，以及如何结合其他技术手段进行性能优化和可扩展性设计。同时，可以分享一些实际项目中的经验，以增强回答的说服力。",
          "knowledge_points": [
              "性能优化",
              "分布式系统",
              "压力测试"
          ]
      },
      {
          "question": "对于分布式系统中的数据一致性问题，你认为应该如何通过算法设计来解决？",
          "answer": "[答案内容将通过音频文件转写获得]",
          "ai_analysis": "专业知识水平：2分。理由：回答内容较为简单，没有深入讨论分布式系统的具体算法。\n技能匹配度：3分。理由：具备一定的技术背景，但未能充分展示与岗位需求相关的技能。\n语言表达能力：3分。理由：表达尚可，但在回答过程中显得有些紧张。\n逻辑思维能力：2分。理由：回答缺乏条理，未能清晰地阐述自己的观点。\n创新能力：2分。理由：未提出任何创新性的解决方案或思路。\n应变抗压能力：3分。理由：在面对问题时表现出一定的思考过程，但整体表现略显紧张。\n答案正确性：2分。理由：回答内容不够全面，未能完整覆盖题目所涉及的知识点。\n\n回答建议：在回答此类问题时，可以结合实际案例或理论知识，详细阐述如何通过算法设计解决分布式系统中的数据一致性问题，并强调不同场景下的适用性及优缺点。同时，在表达上要更加自信流畅，避免因紧张而影响答题效果。",
          "knowledge_points": [
              "分布式系统",
              "事务管理",
              "锁机制"
          ]
      },
      {
          "question": "你在以往的项目中是否遇到过性能瓶颈？你是如何解决这些问题的？",
          "answer": "[答案内容将通过音频文件转写获得]",
          "ai_analysis": "专业知识水平：2分。理由：未能明确说明在哪个项目中遇到性能瓶颈。\n技能匹配度：2分。理由：未能具体描述技能应用。\n语言表达能力：2分。理由：回答含糊不清，缺乏条理。\n逻辑思维能力：2分。理由：无法提供具体的分析或解决方案。\n创新能力：1分。理由：未展示出任何创新性的思考。\n应变抗压能力：2分。理由：面对问题时显得紧张，影响了回答质量。\n答案正确性：1分。理由：未能提供正确的知识点信息。\n\n回答建议：在回答此类问题时，请确保能够清晰地阐述自己在特定项目中的经历，并详细说明遇到的问题以及采取的解决方案。同时，保持冷静，清晰地组织语言以提高回答的质量。",
          "knowledge_points": [
              "并发编程"
          ]
      },
      {
          "question": "你如何保持自己在算法领域的知识更新，有哪些资源或途径是你经常关注的？",
          "answer": "[答案内容将通过音频文件转写获得]",
          "ai_analysis": "回答建议：我定期阅读技术博客和技术书籍，并参加线上线下的技术研讨会。此外，我还参与开源项目，与其他开发者交流经验。\n\n专业知识水平：3分。理由：提到了定期阅读技术博客和技术书籍，但没有具体提及相关领域。\n技能匹配度：3分。理由：提到的技术活动与算法领域有一定的关联，但不够深入。\n语言表达能力：3分。理由：回答较为简洁明了，但缺乏细节描述。\n逻辑思维能力：3分。理由：回答逻辑清晰，但缺乏深度思考。\n创新能力：3分。理由：提到参与开源项目，表明有一定创新能力，但未展示独特解决方案。\n应变抗压能力：3分。理由：回答中未体现应对压力的情况。\n答案正确性：3分。理由：回答涵盖了部分知识点，但不够全面。",
          "knowledge_points": [
              "性能优化",
              "微服务设计",
              "系统架构"
          ]
      }
  ]
};


export default function EvaluationModal({ open, onClose }: EvaluationModalProps) {
  const searchParams = useSearchParams();
  const interview_id = searchParams.get('interview_id');
  const [evalData, setEvalData] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      if (interview_id && open) {
        setLoading(true);
        try {
          const data = await getInterviewEvaluation(Number(interview_id));
          setEvalData(data);
        } catch (error) {
          console.error('获取评价数据失败:', error);
          // 加载失败时使用Mock数据
          setEvalData(mockData);
        } finally {
          setLoading(false);
        }
      }
    };
    
    // 只有当modal打开且有interview_id时才请求数据
    if (open && interview_id) {
      fetchData();
    }
  }, [interview_id, open]);
  // 雷达图配置
  const radarOption = {
    title: { text: '能力雷达图', left: 'center', textStyle: { color: '#7c3aed', fontWeight: 'bold', fontSize: 16 } },
    tooltip: {},
    radar: {
      indicator: evalData?.radar?.data?.dimensions?.map((d) => ({ name: d, max: 100 })) || [],
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
        value: evalData?.radar?.data?.scores || [],
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
      data: evalData?.pie?.data?.points?.map((p, i) => ({
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
      data: evalData?.bar?.data?.labels || [],
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
      data: evalData?.bar?.data?.accuracy || [],
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
    if (!contentRef.current || typeof window === 'undefined') return;
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
      
      // 确保 html2canvas 已加载
      if (!html2canvas) {
        const module = await import('html2canvas');
        html2canvas = module.default;
      }
      
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
            <Dialog.Panel className="w-full max-w-7xl h-[85vh] bg-gradient-to-br from-purple-100 to-purple-200 rounded-3xl shadow-2xl border-2 border-purple-200 flex flex-col overflow-hidden relative">
              {/* 关闭按钮 */}
              <button
                className="absolute top-4 right-6 text-3xl text-purple-400 hover:text-purple-700 font-bold z-10 transition-colors"
                onClick={onClose}
                aria-label="关闭"
              >×</button>
              {/* 导出按钮
              <button
                className="absolute top-4 right-16 bg-purple-600 hover:bg-purple-700 text-white px-4 py-1 rounded-lg shadow font-semibold text-sm z-10 transition-all disabled:opacity-60"
                onClick={handleExport}
                disabled={exporting}
              >{exporting ? '导出中...' : '导出图片'}</button> */}
              {/* 内容主体 */}
              <div ref={contentRef} className="flex flex-1 min-h-0 flex-col md:flex-row gap-6 p-8 pt-14 md:pt-10">
                {loading ? (
                  // 加载状态
                  <div className="flex flex-col items-center justify-center w-full py-20">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mb-4"></div>
                    <div className="text-purple-600 font-medium">正在生成面试评价...</div>
                  </div>
                ) : evalData ? (
                  <div className="flex flex-1 min-h-0 gap-6 w-full">
                    {/* 左侧：分数 + 图表 + 总结（纵向堆叠，可滚动） */}
                    <motion.div
                      className="flex-1 min-h-0 overflow-y-auto pr-2 flex flex-col gap-6"
                      initial={{ x: -40, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      {/* 分数与动画 */}
                      <div className="bg-white/90 rounded-2xl p-6 border border-purple-200 shadow flex flex-col items-center">
                        <Player autoplay loop src={AIbot} style={{ height: '120px', width: '120px' }} />
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
                      </div>

                      {/* 雷达图 */}
                      <div className="bg-white/90 rounded-2xl p-4 border border-purple-200 shadow flex flex-col">
                        <ReactECharts option={radarOption} style={{ height: 240 }} opts={{ renderer: 'canvas' }} />
                        <div className="text-xs text-purple-500 mt-2 text-center min-h-[32px]">{evalData.radar?.comment || ''}</div>
                      </div>
                      {/* 饼图 */}
                      <div className="bg-white/90 rounded-2xl p-4 border border-purple-200 shadow flex flex-col">
                        <ReactECharts option={pieOption} style={{ height: 240 }} opts={{ renderer: 'canvas' }} />
                        <div className="text-xs text-purple-500 mt-2 text-center min-h-[32px]">{evalData.pie?.comment || ''}</div>
                      </div>
                      {/* 柱状图 */}
                      <div className="bg-white/90 rounded-2xl p-4 border border-purple-200 shadow flex flex-col">
                        <ReactECharts option={barOption} style={{ height: 240 }} opts={{ renderer: 'canvas' }} />
                        <div className="text-xs text-purple-500 mt-2 text-center min-h-[32px]">{evalData.bar?.comment || ''}</div>
                      </div>

                      {/* STAR结构与技术总结 */}
                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-2xl px-6 py-5 flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                          <div className="text-sm font-bold text-purple-700 mb-1">STAR结构总结</div>
                          <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{evalData.summary?.starStructure || ''}</div>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-purple-700 mb-1">技术能力总结</div>
                          <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{evalData.summary?.technicalSummary || ''}</div>
                        </div>
                      </div>
                    </motion.div>

                    {/* 右侧：问题与AI评析（可滚动） */}
                    <motion.div
                      className="w-full md:basis-1/3 flex-1 min-h-0 overflow-y-auto pl-2 flex flex-col gap-4"
                      initial={{ x: 40, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.15 }}
                    >
                      <div className="text-sm font-bold text-purple-700">问题分析</div>
                      {Array.isArray(evalData.question_analysis) && evalData.question_analysis.length > 0 ? (
                        evalData.question_analysis.map((qa, idx) => (
                          <div key={idx} className="bg-white/90 rounded-2xl p-4 border border-purple-200 shadow">
                            <div className="text-sm font-semibold text-purple-700 mb-2">Q{idx + 1}. {qa.question}</div>
                            {/* {qa.answer ? (
                              <div className="mb-2">
                                <div className="text-xs text-purple-600 font-medium mb-1">候选人回答</div>
                                <div className="text-xs text-gray-700 whitespace-pre-line">{qa.answer}</div>
                              </div>
                            ) : null} */}
                            <div>
                              <div className="text-xs text-purple-600 font-medium mb-1">AI 评析</div>
                              <div className="text-xs text-gray-700 whitespace-pre-line">{qa.ai_analysis || '暂无评析'}</div>
                            </div>
                            {qa.knowledge_points?.length ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {qa.knowledge_points.map((kp, kidx) => (
                                  <span key={kidx} className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] border border-purple-200">{kp}</span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-gray-500">暂无问题分析</div>
                      )}
                    </motion.div>
                  </div>
                ) : (
                  // 错误状态
                  <div className="flex flex-col items-center justify-center w-full py-20">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <div className="text-red-600 font-medium mb-2">加载失败</div>
                    <div className="text-gray-500 text-sm">无法获取评价数据，请稍后重试</div>
                  </div>
                )}
              </div>

            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
