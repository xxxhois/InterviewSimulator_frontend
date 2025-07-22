export type Profile = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  avatar: string;
  target_position: {
    job_position_id: number;
    position_name: string;
    company_name: string;
    expected_salary: number[];
  };
  date_joined: string;
  last_login: string;
  resume: {
    resume_id: number;
    resume_name: string;
    expected_position: string;
    updated_at: string;
    completed: boolean;
  };
}
