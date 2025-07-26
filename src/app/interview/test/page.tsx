'use client';
import EvaluationModal from "@/components/Evaluation";
import { useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';

// 加载状态组件
function TestPageFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-purple-200 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-purple-600 text-lg">加载面试评估中...</p>
      </div>
    </div>
  );
}

export default function TestPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // 可以选择跳转到其他页面或返回上一页
    router.push('/dashboard'); // 或者 router.back() 返回上一页
  };

  return (
    <Suspense fallback={<TestPageFallback />}>
      {/* 返回首页按钮 */}
      <button
        className="fixed top-6 left-6 z-50 bg-white/80 hover:bg-purple-100 text-purple-700 border border-purple-300 rounded-lg px-4 py-2 shadow font-semibold transition-all"
        onClick={() => router.push('/')}
      >
        返回首页
      </button>
      <EvaluationModal open={isModalOpen} onClose={handleCloseModal} />
    </Suspense>
  );
}