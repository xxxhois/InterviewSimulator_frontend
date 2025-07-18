'use client';
import React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { fetchPosts } from '@/api/post';
import type { Post, PostListResponse } from '@/types/post';
import PostCard from './PostCard';

export default function PostList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
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

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
      {data?.pages.map((page, i) => (
        <React.Fragment key={i}>
          {page.results.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </React.Fragment>
      ))}
      <div ref={ref} style={{ height: 40 }} />
      {isFetchingNextPage && <div style={{ textAlign: 'center', color: '#888' }}>加载更多...</div>}
      {!hasNextPage && !isFetchingNextPage && <div style={{ textAlign: 'center', color: '#aaa' }}>没有更多了</div>}
      {status === 'pending' && <div>加载中...</div>}
      {status === 'error' && <div>加载失败</div>}
    </div>
  );
}
