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