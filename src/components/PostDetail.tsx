import { createReply } from '@/api/post';
import type { PostDetail, Reply } from '@/types/post';
import { Dialog, Transition } from '@headlessui/react';
import React, { useState } from 'react';

interface PostDetailProps {
  open: boolean;
  onClose: () => void;
  post: PostDetail | null;
  onRefresh?: () => void; // 刷新回调
}

export default function PostDetailModal({ open, onClose, post, onRefresh }: PostDetailProps) {
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Reply | null>(null);

  if (!post) return null;

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setSubmitting(true);
    setError(null);
    
    try {
      const data = {
        content: replyContent,
        ...(replyingTo && { parent_reply_id: replyingTo.id })
      };
      
      await createReply(post.id, data);
      setReplyContent('');
      setReplyingTo(null);
      onRefresh?.(); // 刷新帖子列表
    } catch (err: any) {
      setError('回复失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplyTo = (reply: Reply) => {
    setReplyingTo(reply);
    // 滚动到回复框
    setTimeout(() => {
      const replyInput = document.getElementById('reply-input');
      replyInput?.focus();
    }, 100);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyContent('');
  };

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
            <Dialog.Panel className="w-full max-w-4xl h-[80vh] bg-white rounded-2xl shadow-xl border border-purple-200 flex flex-col overflow-hidden">
              {/* 标题区 */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-purple-50">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-purple-800">{post.title}</h2>
                  <div className="text-xs text-gray-500 mt-1">
                    作者：{post.author} &nbsp;|&nbsp; 创建于：{new Date(post.created_at).toLocaleString()}
                  </div>
                </div>
                <button
                  className="text-gray-400 hover:text-purple-600 text-2xl font-bold ml-4"
                  onClick={onClose}
                  aria-label="关闭"
                >×</button>
              </div>

              {/* 主内容区 */}
              <div className="flex-1 flex overflow-hidden">
                {/* 左侧：帖子内容 */}
                <div className="w-1/2 border-r border-gray-200 flex flex-col">
                  <div className="flex-1 overflow-auto px-6 py-4">
                    <div
                      className="prose prose-purple max-w-none mb-4"
                      dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                    <div className="text-xs text-gray-400">
                      最后更新：{new Date(post.updated_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* 右侧：回复区 */}
                <div className="w-1/2 flex flex-col">
                  {/* 回复列表 */}
                  <div className="flex-1 overflow-auto px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-purple-700">回复 ({post.replies?.length || 0})</h3>
                    </div>
                    
                    {!post.replies || post.replies.length === 0 ? (
                      <div className="text-gray-400 text-center py-8">暂无回复</div>
                    ) : (
                      <div className="space-y-4">
                        {post.replies.map(reply => (
                          <ReplyItem 
                            key={reply.id} 
                            reply={reply} 
                            onReply={handleReplyTo}
                            isReplying={replyingTo?.id === reply.id}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 回复输入区 */}
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    {replyingTo && (
                      <div className="mb-3 p-2 bg-purple-100 rounded-lg">
                        <div className="text-xs text-purple-600 mb-1">回复 @{replyingTo.author}</div>
                        <div className="text-xs text-gray-600 truncate">{replyingTo.content}</div>
                        <button 
                          onClick={cancelReply}
                          className="text-xs text-purple-500 hover:text-purple-700 mt-1"
                        >
                          取消回复
                        </button>
                      </div>
                    )}
                    
                    <form onSubmit={handleSubmitReply} className="space-y-3">
                      <textarea
                        id="reply-input"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
                        rows={3}
                        placeholder={replyingTo ? `回复 @${replyingTo.author}...` : "写下你的回复..."}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        disabled={submitting}
                      />
                      {error && <div className="text-red-500 text-sm">{error}</div>}
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-gray-500">
                          {replyContent.length}/500
                        </div>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                          disabled={submitting || !replyContent.trim()}
                        >
                          {submitting ? '发送中...' : '发送回复'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

// 回复项组件
function ReplyItem({ 
  reply, 
  onReply, 
  isReplying 
}: { 
  reply: Reply; 
  onReply: (reply: Reply) => void;
  isReplying: boolean;
}) {
  return (
    <div className={`border border-gray-200 rounded-lg p-4 ${isReplying ? 'border-purple-300 bg-purple-50' : 'bg-white'}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-purple-600 text-sm font-medium">
              {reply.author.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-800">{reply.author}</div>
            <div className="text-xs text-gray-500">
              {new Date(reply.created_at).toLocaleString()}
            </div>
          </div>
        </div>
        <button
          onClick={() => onReply(reply)}
          className="text-xs text-purple-600 hover:text-purple-700 px-2 py-1 rounded hover:bg-purple-100 transition"
        >
          回复
        </button>
      </div>
      
      <div className="text-sm text-gray-700 mb-3 leading-relaxed">
        {reply.content}
      </div>

      {/* 子回复 */}
      {reply.replies && reply.replies.length > 0 && (
        <div className="ml-4 space-y-3 border-l-2 border-purple-200 pl-4">
          {reply.replies.map(childReply => (
            <ReplyItem 
              key={childReply.id} 
              reply={childReply} 
              onReply={onReply}
              isReplying={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}