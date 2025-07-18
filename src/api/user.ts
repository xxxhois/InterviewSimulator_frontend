import { apiRequest } from '@/api/apiRequest';
import type { LoginResponse } from '@/types/user';
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
export { loginUser, registerUser };

