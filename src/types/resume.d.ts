// 简历基本信息
export type ResumeBasic = {
  id: number;
  name: string;
  age: number;
  graduation_date: string;
  education_level: string;
  expected_position: string;
  created_at: string;
  updated_at: string;
};

// 工作经历
export type WorkExperience = {
  id: number;
  start_date: string;
  end_date: string;
  company_name: string;
  department: string;
  position: string;
  work_content: string;
  is_internship: boolean;
};

// 项目经历
export type ProjectExperience = {
  id: number;
  start_date: string;
  end_date: string;
  project_name: string;
  project_role: string;
  project_link: string;
  project_content: string;
};

// 教育经历
export type EducationExperience = {
  id: number;
  start_date: string;
  end_date: string;
  school_name: string;
  education_level: string;
  major: string;
  school_experience: string;
};

// 自定义部分
export type CustomSection = {
  id: number;
  title: string;
  content: string;
};

// 简历完整信息
export type Resume = ResumeBasic & {
  work_experiences: WorkExperience[];
  project_experiences: ProjectExperience[];
  education_experiences: EducationExperience[];
  custom_sections: CustomSection[];
};