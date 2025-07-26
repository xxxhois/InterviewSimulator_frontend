import { apiRequest } from "./apiRequest";
import { EvaluationResult, UserEvaluationOverview } from "@/types/evaluation";

/**
 * 获取单次面试能力评估结果
 * @param interview_id 面试ID
 * @returns 能力评估结果
 */
export const getInterviewEvaluation = async (interview_id: number): Promise<EvaluationResult> => {
  return await apiRequest({
    method: "GET",
    url: `/interview/evaluation/?interview_id=${interview_id}`,
  });
};

/**
 * 获取用户总体能力评估（个人主页展示）
 * @returns 用户总体能力评估数据
 */
export const getUserEvaluationOverview = async (): Promise<UserEvaluationOverview> => {
  return await apiRequest({
    method: "GET",
    url: "/interview/evaluation/overview/",
  });
};
