import { apiRequest } from '@/api/apiRequest';
import { NonAlgorithmSubmissionAnalysis, ProblemBankResponse, ProblemDetailResponse } from '@/types/problem';

// 1. 获取题目列表
// 获取题库列表（仅支持分类和难度筛选，参数拼接简化）
// 响应类型：Promise<ProblemBankResponse>
export async function getProblemBanks(params?: { category?: string; difficulty?: string }): Promise<ProblemBankResponse> {
  let url = '/code/problem-banks/';
  const queryArr: string[] = [];
  if (params?.category) {
    queryArr.push(`category=${encodeURIComponent(params.category)}`);
  }
  if (params?.difficulty) {
    queryArr.push(`difficulty=${encodeURIComponent(params.difficulty)}`);
  }
  if (queryArr.length > 0) {
    url += '?' + queryArr.join('&');
  }
  return await apiRequest({
    method: 'GET',
    url,
  });
}

// 2. 获取题目详情
// 获取题库下的题目列表
// 响应类型：Promise<ProblemDetailResponse>
export async function getProblemDetail(problemSetId: string): Promise<ProblemDetailResponse> {
  return await apiRequest({
    method: 'GET',
    url: `/code/problem-banks/${problemSetId}/problems/`,
  });
}

// 提交答题评析
// 提交非算法题答案（主观题/非编程题）
// 参数：problemSetId（题库ID），answers（{ [problemId]: string }），timeSpent（用时，秒），completionRate（完成率，百分比）
// 返回：Promise<any>
export async function submitProblemAnswers(
  problemSetId: string,
  answers: { [key: string]: string },
  timeSpent: number,
  completionRate: number
): Promise<{
  success: boolean;
  message: string;
  data: NonAlgorithmSubmissionAnalysis;
}> {
  return await apiRequest({
    method: 'POST',
    url: `/code/problem-banks/${problemSetId}/submit/`,
    data: {
      answers,
      time_spent: timeSpent,
      completion_rate: completionRate,
    },
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
