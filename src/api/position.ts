import { apiRequest } from "./apiRequest";
import type { PositionList } from "@/types/postion";

// 分页获取岗位列表
export const getPositionList = async ({ page = 1, ordering = '' }: { page?: number; ordering?: string } = {}): Promise<PositionList> => {
  const params = new URLSearchParams();
  params.append('page', String(page));
  if (ordering) params.append('ordering', ordering);
  const url = `/positions/positions/?${params.toString()}`;
  return await apiRequest({ method: 'GET', url });
};

// 关键词搜索岗位
export const searchPositionList = async ({ keyword, page = 1 }: { keyword: string; page?: number }): Promise<PositionList> => {
  const params = new URLSearchParams();
  params.append('keyword', keyword);
  params.append('page', String(page));
  const url = `/positions/positions/search/?${params.toString()}`;
  return await apiRequest({ method: 'GET', url });
};
