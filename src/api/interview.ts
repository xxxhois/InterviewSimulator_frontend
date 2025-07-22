import { apiRequest } from "@/api/apiRequest";
import { CreateInterviewRequest, CreateInterviewResponse, InterviewList } from "@/types/interview";
import { EvaluationResult, UserEvaluationOverview } from "@/types/evaluation";

export const createInterview = async (data: CreateInterviewRequest): Promise<CreateInterviewResponse> => {
    const response = await apiRequest({
        method: "POST",
        url: "/interview/create/",
        data,
    });
    return response;
};

export const getInterviewList = async (): Promise<InterviewList> => {
    const response = await apiRequest({
        method: "GET",
        url: "/interview/list/",
    });
    return response;
};

/**
 * 获取单次面试能力评估结果
 * @param interview_id 面试ID
 * @returns 能力评估结果
 */
export const getInterviewEvaluation = async (
    interview_id: number
): Promise<EvaluationResult> => {
    const response = await apiRequest({
        method: "GET",
        url: `/interview/evaluation/?interview_id=${interview_id}`,
    });
    return response;
};

/**
 * 获取用户总体能力评估（个人主页展示）
 * @returns 用户总体能力评估数据
 */
export const getUserEvaluationOverview = async (): Promise<UserEvaluationOverview> => {
    const response = await apiRequest({
        method: "GET",
        url: "/user/evaluation/overview/",
    });
    return response;
};
