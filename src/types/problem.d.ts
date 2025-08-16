export interface ProblemBank {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  problem_count: number;
  completed_count: number;
  completion_rate: number;
  tags: string[];
  color: string;
  is_algorithm: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProblemBankResponse {
  success: boolean;
  data: ProblemBank[];
}

export interface TestCase {
  id: number;
  name: string;
  input: string;
  expectedOutput?: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  actualOutput?: string;
  error?: string;
}

export interface TestCases {
  public: TestCase[];
  hidden: TestCase[];
}

export interface Constraints {
  time_complexity: string;
  space_complexity: string;
  array_length?: string;
  target_range?: string;
  [key: string]: string | undefined;
}

export interface AlgorithmProblem {
  id: string;
  problem_set: string;
  problem_set_title: string;
  category: string;
  title: string;
  description: string;
  scenario: string;
  difficulty: string;
  tags: string[];
  is_algorithm: boolean;
  question: string;
  reference_answer: string;
  analysis: string;
  test_cases: TestCases;
  constraints: Constraints;
  code_template: string;
  knowledge_points: string[] | null;
  scoring_criteria: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface ProblemBankDetailResponse {
  success: boolean;
  problem_bank: ProblemBank;
  problems: AlgorithmProblem[];
  total: number;
  filters: {
    difficulty: string;
    tags: string[];
  };
}

// 原有的非算法题相关类型
export interface ProblemDetail {
  id: string;
  problem_set: string;
  problem_set_title: string;
  category: string;
  title: string;
  description: string;
  scenario: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  question: string;
  reference_answer: string;
  analysis: string;
  created_at: string; // ISO 时间字符串
  updated_at: string; // ISO 时间字符串
}

export interface ProblemDetailResponse {
  success: boolean;
  problem_bank: ProblemBank;
  problems: ProblemDetail[];
  total: number;
}

/**
 * 单道题的评析结果
 */
export interface ProblemAnswerAnalysis {
  id: number;
  problem: string;
  problem_title: string;
  problem_question: string;
  reference_answer: string;
  user_answer: string;
  score: number;
  max_score: number;
  analysis: string;
  strengths: string;
  weaknesses: string;
  suggestions: string;
}

/**
 * 非算法题提交后的评析结果（单次提交）
 */
export interface NonAlgorithmSubmissionAnalysis {
  total_score: number; // 总分
  total_problems: number; // 总题数
  correct_count: number; // 正确题数
  accuracy_rate: number; // 正确率，百分比，保留一位小数
  overall_analysis: string; // 整体分析
  answers: {
    problem_question: string; // 题目内容
    user_answer: string; // 用户答案
    analysis: string; // 评析
    score: number; // 得分
    max_score: number; // 满分
  }[];
}

/**
 * 非算法题提交后的评析结果响应
 */
export interface NonAlgorithmSubmissionAnalysisResponse {
  success: boolean;
  message: string;
  data: NonAlgorithmSubmissionAnalysis;
}

/**
 * 代码题提交请求
 */
export interface CodeSubmissionRequest {
  problem_answers: {
    problem_id: string;
    source_code: string;
  }[];
}

/**
 * 测试用例结果
 */
export interface TestCaseResult {
  input: string;
  expected: string;
  actual: string;
  error: string;
  passed: boolean;
}

/**
 * 测试结果汇总
 */
export interface TestSummary {
  public_passed: number;
  public_total: number;
  hidden_passed: number;
  hidden_total: number;
}

/**
 * 测试结果
 */
export interface TestResults {
  public_cases: TestCaseResult[];
  hidden_cases: TestCaseResult[];
  summary: TestSummary;
}

/**
 * 代码评析
 */
export interface CodeEvaluation {
  score: number;
  test_analysis: string;
  strengths: string;
  problems: string;
  suggestions: string;
}

/**
 * 单道代码题的评测结果
 */
export interface CodeProblemResult {
  problem_id: string;
  problem_title: string;
  test_results: TestResults;
  evaluation: CodeEvaluation;
}

/**
 * 代码评测响应
 */
export interface CodeEvaluationResponse {
  success: boolean;
  data: CodeProblemResult[];
}

