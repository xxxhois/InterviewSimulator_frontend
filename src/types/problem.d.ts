export type ProblemBank = {
    /**
     * 题库唯一标识
     */
    id: string;
    /**
     * 题库标题
     */
    title: string;
    /**
     * 题库描述
     */
    description: string;
    /**
     * 题库所属分类
     */
    category: string;
    /**
     * 题库难度
     */
    difficulty: 'Easy' | 'Medium' | 'Hard';
    /**
     * 题库包含的题目总数
     */
    problem_count: number;
    /**
     * 已完成的题目数量
     */
    completed_count: number;
    /**
     * 完成率（百分比，保留一位小数）
     */
    completion_rate: number;
    /**
     * 题库标签
     */
    tags: string[];
    /**
     * 题库主色调（如 TailwindCSS 颜色类名）
     */
    color: string;
    /**
     * 是否为算法题库
     */
    is_algorithm: boolean;
}

export type ProblemBankResponse = {
    success: boolean;
    data: ProblemBank[];
}

export type ProblemDetail = {
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

export type ProblemDetailResponse = {
    success: boolean;
    problem_bank: ProblemBank;
    problems: ProblemDetail[];
    total: number;
}

/**
 * 单道题的评析结果
 */
export type ProblemAnswerAnalysis = {
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
};

/**
 * 非算法题提交后的评析结果项
 */
/**
 * 非算法题提交后的评析结果（单次提交）
 */
export type NonAlgorithmSubmissionAnalysis = {
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
};

/**
 * 非算法题提交后的评析结果响应
 */
export type NonAlgorithmSubmissionAnalysisResponse = {
    success: boolean;
    message: string;
    data: NonAlgorithmSubmissionAnalysis;
};

