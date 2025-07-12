import { apiRequest } from '@/api/apiRequest';
async function registerUser(username: string, password: string): Promise<any> {
  return await apiRequest({
    method: 'POST',
    url: '/users/register',
    data: { username, password },
  });
}

async function loginUser(username: string, password: string): Promise<any> {
  return await apiRequest({
    method: 'POST',
    url: '/users/login',
    data: { username, password },
  });
}
export { loginUser, registerUser };

