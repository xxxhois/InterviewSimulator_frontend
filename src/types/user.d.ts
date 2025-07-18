export type ResumeBasic = {
  id: number;
  name: string;
  age: number;
  graduation_date: string;
  education_level: string;
  expected_position: string;
}

export type ResumeDetail = ResumeBasic & {
  created_at: string;
  work_experiences: {
    id: number;
    start_date: string;
    end_date: string;
    company_name: string;
    department: string;
    position: string;
    work_content: string;
    is_internship: boolean;
  }[];
  project_experiences: {
    id: number;
    start_date: string;
    end_date: string;
    project_name: string;
    project_role: string;
    project_link: string;
    project_content: string;
  }[];
  education_experiences: {
    id: number;
    start_date: string;
    end_date: string;
    school_name: string;
    education_level: string;
    major: string;
    school_experience: string;
  }[];
  custom_sections: {
    id: number;
    title: string;
    content: string;
  }[];
}

export type User = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: number;
  avatar: string;
  date_joined: string;
  last_login: string;
  resume_basic: ResumeBasic;
}

export type LoginResponse = {
  token: string;
  message: string;
  user_id: string;
  username: string;
}