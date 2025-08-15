export type LoginResponse = {
  token: string;
  message: string;
  user_id: string;
  username: string;
}

// 个性化推荐数据类型
export type CurrentGoal = {
  title: string;
  company: string;
  salary: string;
  matchRate: number;
}

export type RecommendedCompany = {
  name: string;
  matchRate: number;
  position: string;
}

export type RecommendedTopic = {
  name: string;
  difficulty: '简单' | '中等' | '困难';
  matchRate: number;
  count: number;
}

export type UserRecommendations = {
  currentGoal: CurrentGoal;
  recommendedCompanies: RecommendedCompany[];
  recommendedTopics: RecommendedTopic[];
}