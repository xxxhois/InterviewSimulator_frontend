'use client';
import { createPost } from '@/api/post';
import Navigation from '@/components/Navigation';
import PostList from '@/components/PostList';
import React, { useState } from 'react';

export default function PostsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 提交发帖
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createPost({ title, content });
      setTitle('');
      setContent('');
      setSidebarOpen(false);
      // 可选：刷新帖子列表
      window.location.reload();
    } catch (err: any) {
      setError('发帖失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white relative">
      <div className="max-w-3xl mx-auto py-8 px-4">
        <Navigation />
        <div className="mt-6">
          <PostList />
        </div>
      </div>
      {/* 右下角发帖按钮 */}
      <button
        className="fixed right-8 bottom-8 z-50 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg px-6 py-3 text-lg font-bold transition"
        onClick={() => setSidebarOpen(true)}
      >
        发帖
      </button>
      {/* 右侧边栏 */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* 遮罩 */}
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setSidebarOpen(false)}
          />
          {/* 侧边栏内容 */}
          <div className="ml-auto w-full max-w-md h-full bg-white shadow-2xl p-8 flex flex-col relative animate-slide-in-right">
            <button
              className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-purple-600"
              onClick={() => setSidebarOpen(false)}
              aria-label="关闭"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-purple-700 mb-6">发布新帖子</h2>
            <form className="flex flex-col flex-1" onSubmit={handleSubmit}>
              <label className="mb-2 text-sm font-medium text-gray-700">标题</label>
              <input
                className="mb-4 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-300"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                maxLength={100}
                placeholder="请输入标题"
                disabled={submitting}
              />
              <label className="mb-2 text-sm font-medium text-gray-700">内容</label>
              <textarea
                className="mb-4 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-300 min-h-[120px] resize-vertical"
                value={content}
                onChange={e => setContent(e.target.value)}
                required
                placeholder="请输入内容，支持 HTML"
                disabled={submitting}
              />
              {error && <div className="text-red-500 mb-2">{error}</div>}
              <button
                type="submit"
                className="mt-auto bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded transition"
                disabled={submitting}
              >
                {submitting ? '发布中...' : '发布'}
              </button>
            </form>
          </div>
        </div>
      )}
      <style jsx global>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>
    </div>
  );
}