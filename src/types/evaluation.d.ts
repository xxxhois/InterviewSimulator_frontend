// 单次面试能力评估结果类型定义

export type EvaluationRadar = {
  data: {
    dimensions: string[]; // 维度名称，如“专业知识水平”等
    scores: number[];     // 各维度得分
  };
  comment: string;         // 雷达图评语
};

export type EvaluationPie = {
  data: {
    points: {
      label: string;      // 模块名称，如“算法”
      value: number;      // 分值
    }[];
  };
  comment: string;         // 饼图评语
};

export type EvaluationBar = {
  data: {
    labels: string[];     // 模块名称
    accuracy: number[];   // 各模块正确率（0-1）
  };
  comment: string;         // 柱状图评语
};

export type EvaluationLastCompare = {
  scoreChange: number;    // 总分变化
  radarDelta: number[];   // 各维度分数变化
};

export type EvaluationSummary = {
  starStructure: string;      // STAR结构总结
  technicalSummary: string;   // 技术总结
};

export type EvaluationResult = {
  radar: EvaluationRadar;
  pie: EvaluationPie;
  bar: EvaluationBar;
  score: number;                  // 总分
  lastCompare: EvaluationLastCompare;
  summary: EvaluationSummary;
};

// 用户总体能力评估（个人主页展示）类型定义

export type UserEvaluationOverviewRadar = {
  dimensions: string[]; // 能力维度名称
  scores: number[];     // 各维度平均分
};

export type UserEvaluationOverviewMasteryProgress = {
  labels: string[];     // 知识点名称
  progress: number[];   // 各知识点平均正确率（0-1）
};

export type UserEvaluationOverviewTrend = {
  dates: string[];      // 日期（如 "2025-06-01"）
  scores: number[];     // 各日期对应的总分
};

export type UserEvaluationOverview = {
  radar: UserEvaluationOverviewRadar;
  masteryProgress: UserEvaluationOverviewMasteryProgress;
  trend: UserEvaluationOverviewTrend;
  summary: string;      // 综合评语
};
