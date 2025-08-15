import { apiRequest } from '@/api/apiRequest';
import type { LoginResponse, UserRecommendations } from '@/types/user';

async function registerUser(username: string, password: string): Promise<any> {
  return await apiRequest({
    method: 'POST',
    url: '/users/register',
    data: { username, password },
  });
}

async function loginUser(username: string, password: string): Promise<LoginResponse> {
  return await apiRequest({
    method: 'POST',
    url: '/users/login',
    data: { username, password },
  });
}

// 获取个性化推荐数据
async function getUserRecommendations(): Promise<UserRecommendations> {
  const response = await apiRequest({
    method: 'GET',
    url: '/users/recommendations/',
  });
  return response.data;
}

export { getUserRecommendations, loginUser, registerUser };

