import { CreateReplyRequest, CreateReplyResponse, PostDetail } from '@/types/post';
import { apiRequest } from './apiRequest';

export async function fetchPosts({ pageParam = 1, pageSize = 10 }) {
    const url = `/posts/list/?page=${pageParam}&page_size=${pageSize}`;
    const res = await apiRequest({
        method: 'GET',
        url,
        attachToken: true,
    });
    return res;
}

export async function fetchPostDetail(post_id: number): Promise<PostDetail> {
    const url = `/posts/detail/${post_id}/`;
    const res = await apiRequest({
        method: 'GET',
        url,
        attachToken: false,
    });
    return res.post;
}

/**
 * 创建新帖子
 * @param {Object} params
 * @param {string} params.title 帖子标题
 * @param {string} params.content 帖子内容
 * @returns {Promise<any>} 创建结果
 */
export async function createPost({ title, content }: { title: string; content: string }) {
    const url = '/posts/create/';
    const res = await apiRequest({
        method: 'POST',
        url,
        data: {
            title,
            content,
        },
        attachToken: true, // 需要JWT认证
    });
    return res;
}

/**
 * 创建回复
 * @param {number} post_id 帖子ID
 * @param {CreateReplyRequest} data 回复数据
 * @returns {Promise<CreateReplyResponse>} 创建结果
 */
export async function createReply(post_id: number, data: CreateReplyRequest): Promise<CreateReplyResponse> {
    const url = `/posts/reply/create/${post_id}/`;
    const res = await apiRequest({
        method: 'POST',
        url,
        data,
        attachToken: true, // 需要JWT认证
    });
    return res;
}


