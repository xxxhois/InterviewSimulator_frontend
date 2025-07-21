import { apiRequest } from '@/api/apiRequest';

// 1. 获取题目列表
export async function getProblemList(params?: {
  page?: number;
  size?: number;
  difficulty?: string;
  category?: string;
}) {
  let url = '/test/problems/';
  if (params) {
    const query = Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (query) url += `?${query}`;
  }
  return await apiRequest({
    method: 'GET',
    url,
  });
}

// 2. 获取题目详情
export async function getProblemDetail(problemId: number) {
  return await apiRequest({
    method: 'GET',
    url: `/problems/${problemId}/`,
  });
}

// 3. 运行代码
export async function runCode(source_code: string, language_id: number, stdin: string) {
  return await apiRequest({
    method: 'POST',
    url: '/code/run-code/',
    data: { source_code, language_id, stdin },
  });
}

// // 4. 获取支持的语言列表
// export async function getLanguages() {
//   return await apiRequest({
//     method: 'GET',
//     url: '/code/languages/',
//   });
// }

// 5. 获取题目的测试用例
export async function getTestCases(problemId: number) {
  return await apiRequest({
    method: 'GET',
    url: `/problems/${problemId}/testcases/`,
  });
}

// 6. 运行单个测试用例
export async function runTestCase(problemId: number, testcaseId: number, source_code: string, language_id: number) {
  return await apiRequest({
    method: 'POST',
    url: `/problems/${problemId}/testcases/${testcaseId}/run/`,
    data: { source_code, language_id },
  });
}

// 7. 运行所有公开测试用例
export async function runAllPublicTestCases(problemId: number, source_code: string, language_id: number) {
  return await apiRequest({
    method: 'POST',
    url: `/problems/${problemId}/testcases/run-public/`,
    data: { source_code, language_id },
  });
}

// 8. 提交最终答案
export async function submitFinalAnswer(problemId: number, source_code: string, language_id: number) {
  return await apiRequest({
    method: 'POST',
    url: `/problems/${problemId}/submit/`,
    data: { source_code, language_id },
  });
}

