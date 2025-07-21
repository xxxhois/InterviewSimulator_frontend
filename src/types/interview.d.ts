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
    job_position_id?: number;
    resume_id: number; // 待定：简历id
    interview_time?: string;
    position_name: string;
    position_type: string;
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