export type Interview = {
    id: number;
    interview_time: string;
    position_name: string;
    company_name: string;
    position_type: string;
    created_at: string;
    updated_at: string;
};

export type InterviewList = {
    interviews: Interview[];
    total: number;
};

export type CreateInterviewRequest = {
    job_position_id: number;
    resume_id: number; // 简历id
    interview_time?: string;
    position_name: string;
    position_type?: string;
    company_name?: string;
    position_description: string;
    position_requirements?: string;
};

export type CreateInterviewResponse = {
    id: number; // 面试id
    interview_time: string;
    position_name: string;
    company_name: string;
    position_type: string;
}

// 编程题目相关类型定义
export type CodingExample = {
    input: string;
    output: string;
    explanation?: string;
};

export type CodingProblem = {
    id: number;
    number: string; // 题目编号，如 "LC001"
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    tags: string[];
    example: CodingExample;
};

export type CodingProblemMessage = {
    type: 'coding_problem';
    phase: 'code' | 'review' | 'discuss';
    problem: CodingProblem;
};