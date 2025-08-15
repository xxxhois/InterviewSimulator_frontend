'use client';
import { fetchPostDetail, fetchPosts } from '@/api/post';
import PostCard from '@/components/PostCard';
import PostDetailModal from '@/components/PostDetail';
import type { Post, PostDetail, PostListResponse } from '@/types/post';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useInView } from 'react-intersection-observer';

export default function PostList() {
  const queryClient = useQueryClient();
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch,
  } = useInfiniteQuery<PostListResponse, Error>({
    queryKey: ['posts'],
    queryFn: ({ pageParam = 1 }) => fetchPosts({ pageParam: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage && lastPage.current_page < lastPage.num_pages) {
        return lastPage.current_page + 1;
      }
      return undefined;
    },
  });

  const { ref, inView } = useInView();

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 详情弹窗状态
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // 刷新帖子列表
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] });
    refetch();
  };

  // 弹窗改用详情数据
  const handleCardClick = async (post: Post) => {
    setLoadingDetail(true);
    setDetailOpen(true);
    try {
      const detail = await fetchPostDetail(post.id);
      setSelectedPost(detail);
    } catch (e) {
      setSelectedPost(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 16 }}>
      {data?.pages.map((page, i) => (
        <React.Fragment key={i}>
          {page.results.map((post) => (
            <div key={post.id} onClick={() => handleCardClick(post)} style={{ cursor: 'pointer' }}>
              <PostCard post={post} />
            </div>
          ))}
        </React.Fragment>
      ))}
      <div ref={ref} style={{ height: 40 }} />
      {isFetchingNextPage && <div style={{ textAlign: 'center', color: '#888' }}>加载更多...</div>}
      {!hasNextPage && !isFetchingNextPage && <div style={{ textAlign: 'center', color: '#aaa' }}>没有更多了</div>}
      {status === 'pending' && <div>加载中...</div>}
      {status === 'error' && <div>加载失败</div>}

      {/* 详情弹窗 */}
      <PostDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        post={selectedPost}
        onRefresh={handleRefresh}
      />
    </div>
  );
}

