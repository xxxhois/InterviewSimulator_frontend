import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import type { PostDetail, Reply } from '@/types/post';

interface PostDetailProps {
  open: boolean;
  onClose: () => void;
  post: PostDetail | null;
}

export default function PostDetailModal({ open, onClose, post }: PostDetailProps) {
  if (!post) return null;

  return (
    <Transition appear show={open} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-2xl h-[600px] bg-white rounded-2xl shadow-xl border border-purple-200 flex flex-col overflow-hidden">
              {/* 标题区 */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-purple-50">
                <div>
                  <h2 className="text-xl font-bold text-purple-800">{post.title}</h2>
                  <div className="text-xs text-gray-500 mt-1">
                    作者：{post.author} &nbsp;|&nbsp; 创建于：{post.created_at.slice(0, 16).replace('T', ' ')}
                  </div>
                </div>
                <button
                  className="text-gray-400 hover:text-purple-600 text-2xl font-bold"
                  onClick={onClose}
                  aria-label="关闭"
                >×</button>
              </div>
              {/* 内容区 */}
              <div className="flex-1 overflow-auto px-6 py-4">
                <div
                  className="prose prose-purple max-w-none mb-6"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
                <div className="text-xs text-gray-400 mb-2">
                  最后更新：{post.updated_at.slice(0, 16).replace('T', ' ')} &nbsp;|&nbsp; 回复数：{post.reply_count}
                </div>
                {/* 回复区 */}
                <div>
                  <h3 className="text-lg font-semibold text-purple-700 mb-2">回复</h3>
                  {post.replies.length === 0 ? (
                    <div className="text-gray-400 text-sm">暂无回复</div>
                  ) : (
                    <div className="space-y-4">
                      {post.replies.map(reply => (
                        <ReplyItem key={reply.id} reply={reply} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

// 递归渲染回复
function ReplyItem({ reply }: { reply: Reply }) {
  return (
    <div className="border-l-4 border-purple-200 pl-3">
      <div className="text-sm text-gray-800 mb-1">{reply.content}</div>
      <div className="text-xs text-gray-500 mb-1">
        {reply.author} · {reply.created_at.slice(0, 16).replace('T', ' ')}
      </div>
      {reply.child_replies && reply.child_replies.length > 0 && (
        <div className="ml-4 mt-2 space-y-2">
          {reply.child_replies.map(child => (
            <ReplyItem key={child.id} reply={child} />
          ))}
        </div>
      )}
    </div>
  );
}