import { apiRequest } from '@/api/apiRequest';

async function runCode(source_code: string, language_id: number, stdin: string): Promise<any> {
  return await apiRequest({
    method: 'POST',
    url: '/code/run-code/',
    data: { source_code, language_id, stdin },
  });
}

export { runCode };