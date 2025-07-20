import { Profile } from '@/types/profile';
import { apiRequest } from './apiRequest';

// 获取用户资料
export const getProfile = async (): Promise<Profile> => {
  const response = await apiRequest({
    method: 'GET',
    url: '/users/profile/',
  });
  return response.profile;
};

// 更新用户资料
export interface UpdateProfileRequest {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: number;
  avatar?: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  msg: string;
}

export const updateProfile = async (data: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
  const response = await apiRequest({
    method: 'POST',
    url: '/users/profile/update/',
    data: data,
  });
  return response;
};

