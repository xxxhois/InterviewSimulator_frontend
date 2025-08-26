import { showToast } from "@/components/Toast";
import { Resume } from "@/types/resume";
import { apiRequest } from "./apiRequest";
/**
 * 识别简历内容
 * @param file 上传的文件对象
 * @returns 识别结果
 */
export async function recognizeResume(file: File): Promise<any> {
  const appcode = '24daa66d82c04560bbd6a6c8a1378d1d';
  const url = 'http://jljxjk.market.alicloudapi.com/aliyunapp/aliyunservice.aspx';

  // 支持的扩展名
  const extMap: Record<string, string> = {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/bmp': '.bmp',
    'image/gif': '.gif',
  };
  const ext = extMap[file.type];
  if (!ext) throw new Error('暂不支持该文件类型');

  // 读取文件为base64
  const base64Content = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // 去掉data:前缀
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // body结构
  const body = `cid=1&content=${base64Content}&ext=${ext}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'APPCODE ' + appcode,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: body,
  });

  if (!response.ok) {
    throw new Error('简历识别接口请求失败');
  }

  return await response.json();
}

// src/api/resume.ts

export const handleResumeUpload = async (
  e: React.ChangeEvent<HTMLInputElement>
): Promise<Resume | null> => {
  const file = e.target.files?.[0];
  if (!file) return null;
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg', 'image/png', 'image/bmp', 'image/gif'
  ];
  if (!allowedTypes.includes(file.type)) {
    showToast('请上传PDF、Word或图片格式的简历');
    return null;
  }
  try {
    showToast('简历识别中...');
    const result = await recognizeResume(file);
    if (result.raw) {
      showToast('识别失败：' + result.raw);
      return null;
    } else {
      showToast('识别成功：' + (result?.msg || JSON.stringify(result).slice(0, 100)));
      const mapped = mapThirdPartyResume(result);
      return mapped;
    }
  } catch (err: any) {
    console.error(err);
    showToast('识别失败：' + (err?.message || '未知错误'));
    return null;
  }
};

  // 获取简历详情
  export const getResumeDetail = async (resume_id: number) => {
    const response = await apiRequest({
      method: 'GET',
      url: `/users/resume/?resume_id=${resume_id}`,
      attachToken: true,
    });
    return response.resume;
  };

  export const getResumeList = async () => {
    const response = await apiRequest({
      method: 'GET',
      url: '/users/resume/list/',
      attachToken: true,
    });
    return response;
  };

/**
 * 创建或更新简历基本信息
 * @param data 简历信息对象
 * @returns Promise<any>
 */
export const createOrUpdateResume = async (data: {
  resume_id?: number;//创建时不传，更新时传
  resume_name?: string;
  name: string;
  age: number;
  graduation_date: string;
  education_level: string;
  expected_position: string;
  completed: boolean;
}) => {
  return await apiRequest({
    method: "POST",
    url: "/users/resume/create/",
    data,
  });
};

/**
 * 创建或更新工作经历
 * @param data 工作经历信息对象
 * @returns Promise<any>
 */
export const createOrUpdateWorkExperience = async (data: {
  resume_id: number;
  work_id?: number;
  start_date?: string;
  end_date?: string;
  company_name?: string;
  department?: string;
  position?: string;
  work_content?: string;
  is_internship?: boolean;
}) => {
  return await apiRequest({
    method: "POST",
    url: "/users/resume/work/",
    data,
  });
};

/**
 * 删除指定的工作经历
 * @param params 包含 resume_id 和 work_id 的对象
 * @returns Promise<any>
 */
export const deleteWorkExperience = async (params: { resume_id: number; work_id: number }) => {
  return await apiRequest({
    method: "DELETE",
    url: "/users/resume/work/delete/",
    data: params,
  });
};

/**
 * 创建或更新项目经历
 * @param data 项目经历信息对象
 * @returns Promise<any>
 */
export const createOrUpdateProjectExperience = async (data: {
  project_id?: number;
  start_date?: string;
  end_date?: string;
  project_name?: string;
  project_role?: string;
  project_link?: string;
  project_content?: string;
  resume_id: number;
}) => {
  return await apiRequest({
    method: "POST",
    url: "/users/resume/project/",
    data,
  });
};

/**
 * 删除指定的项目经历
 * @param params 包含 resume_id 和 project_id 的对象
 * @returns Promise<any>
 */
export const deleteProjectExperience = async (params: { resume_id: number; project_id: number }) => {
  //调用后端接口删除项目经历
  return await apiRequest({
    method: "DELETE",
    url: "/users/resume/project/delete/",
    data: params,
  });
};

/**
 * 创建或更新教育经历
 * @param data 教育经历信息对象
 * @returns Promise<any>
 */
export const createOrUpdateEducationExperience = async (data: {
  resume_id: number;
  education_id?: number;
  start_date?: string;
  end_date?: string;
  school_name?: string;
  education_level?: string;
  major?: string;
  school_experience?: string;
}) => {
  // 中文注释：调用后端接口创建或更新教育经历
  return await apiRequest({
    method: "POST",
    url: "/users/resume/education/",
    data,
  });
};

/**
 * 删除指定的教育经历
 * @param params 包含 resume_id 和 education_id 的对象
 * @returns Promise<any>
 */
export const deleteEducationExperience = async (params: { resume_id: number; education_id: number }) => {
  // 中文注释：调用后端接口删除教育经历
  return await apiRequest({
    method: "DELETE",
    url: "/users/resume/education/delete/",
    data: params,
  });
};

/**
 * 创建或更新自定义部分
 * @param data 自定义部分信息对象
 *  - resume_id: number 必填，简历ID
 *  - custom_id?: number 可选，自定义部分ID（更新时必传，创建时不传）
 *  - title?: string 可选，标题
 *  - content?: string 可选，内容
 * @returns Promise<any>
 */
export const createOrUpdateCustomSection = async (data: {
  resume_id: number;
  custom_id?: number;
  title?: string;
  content?: string;
}) => {
  // 中文注释：调用后端接口创建或更新自定义部分
  return await apiRequest({
    method: "POST",
    url: "/users/resume/custom/",
    data,
  });
};

/**
 * 删除指定的自定义部分
 * @param params 包含 resume_id 和 custom_id 的对象
 * @returns Promise<any>
 */
export const deleteCustomSection = async (params: { resume_id: number; custom_id: number }) => {
  // 中文注释：调用后端接口删除自定义部分
  return await apiRequest({
    method: "DELETE",
    url: "/users/resume/custom/delete/",
    data: params,
  });
};

export function mapThirdPartyResume(data: any): Resume {
  return {
    // 基本信息
    name: data.Name || '',
    age: Number(data.Age) || 0,
    graduation_date: data.Graduatetime || '',
    education_level: data.Education || '',
    expected_position: data.TitleStandard || '',
    created_at: data.LastUpdate || '',
    updated_at: data.LastUpdate || '',

    // 工作经历
    work_experiences: Array.isArray(data.ExperienceInfo) ? data.ExperienceInfo.map((exp: any, idx: number) => ({
      start_date: exp.StartDate || '',
      end_date: exp.EndDate || '',
      company_name: exp.Company || '',
      department: exp.Department || '',
      position: exp.Title || '',
      work_content: exp.Summary || '',
      is_internship: exp.WorkType === '实习'
    })) : [],

    // 项目经历
    project_experiences: Array.isArray(data.ProjectInfo) ? data.ProjectInfo.map((proj: any, idx: number) => ({
      start_date: proj.StartDate || '',
      end_date: proj.EndDate || '',
      project_name: proj.Project || '',
      project_role: proj.Title || '',
      project_link: proj.ProjectLink || '',
      project_content: proj.Summary || ''
    })) : [],

    // 教育经历
    education_experiences: Array.isArray(data.EducationInfo) ? data.EducationInfo.map((edu: any, idx: number) => ({
      start_date: edu.StartDate || '',
      end_date: edu.EndDate || '',
      school_name: edu.School || '',
      education_level: edu.Education || '',
      major: edu.Speciality || '',
      school_experience: edu.Summary || ''
    })) : [],

    // 自定义部分
    custom_sections: [
      ...(data.Personal ? [{ id: 1, title: '自我评价', content: data.Personal }] : []),
      ...(data.Certificate ? [{ id: 2, title: '证书/荣誉', content: data.Certificate }] : []),
      ...(data.Encouragement ? [{ id: 3, title: '获奖情况', content: data.Encouragement }] : []),
      ...(data.Skill ? [{ id: 4, title: '技能特长', content: data.Skill }] : []),
      ...(data.PersonalInterests ? [{ id: 5, title: '兴趣爱好', content: data.PersonalInterests }] : []),
    ]
  };
}