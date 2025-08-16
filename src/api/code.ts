import {
  NonAlgorithmSubmissionAnalysis,
  ProblemBankDetailResponse,
  ProblemBankResponse,
  ProblemDetailResponse
} from '@/types/problem';
import { apiRequest } from './apiRequest';

export async function getProblemBanks(): Promise<ProblemBankResponse> {
  const res = await apiRequest({
    method: 'GET',
    url: '/code/problem-banks/',
    attachToken: true,
  });
  return res;
}

export async function getProblemDetail(problemSetId: string): Promise<ProblemDetailResponse> {
  const res = await apiRequest({
    method: 'GET',
    url: `/code/problem-banks/${problemSetId}/problems/`,
    attachToken: true,
  });
  return res;
}

export async function getAlgorithmProblems(problemSetId: string): Promise<ProblemBankDetailResponse> {
  const res = await apiRequest({
    method: 'GET',
    url: `/code/problem-banks/${problemSetId}/problems/`,
    attachToken: true,
  });
  return res;
}

export async function runCode(code: string, languageId: number, input: string = '') {
  const res = await apiRequest({
    method: 'POST',
    url: '/code/run-code/',
    data: {
      source_code: code,
      language_id: languageId,
      input,
    },
    attachToken: true,
  });
  return res;
}

export async function submitProblemAnswers(
  problemSetId: string,
  answers: Record<string, string>,
  timeSpent: number,
  completionRate: number
): Promise<{ success: boolean; message: string; data: NonAlgorithmSubmissionAnalysis }> {
  const res = await apiRequest({
    method: 'POST',
    url: `/code/problem-banks/${problemSetId}/submit/`,
    data: {
      answers,
      time_spent: timeSpent,
      completion_rate: completionRate,
    },
    attachToken: true,
  });
  return res;
}
