import { apiRequest } from "@/api/apiRequest";
import { CreateInterviewRequest, CreateInterviewResponse, InterviewList } from "@/types/interview";

export const createInterview = async (data: CreateInterviewRequest): Promise<CreateInterviewResponse> => {
    const response = await apiRequest({
        method: "POST",
        url: "/interviews/create/",
        data,
    });
    return response;
};

export const getInterviewList = async (): Promise<InterviewList> => {
    const response = await apiRequest({
        method: "GET",
        url: "/interviews/list/",
    });
    return response;
};