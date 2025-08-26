import { useAuthStore } from '@/store/authStore';

// 自定义未授权错误类型
export class UnauthorizedError extends Error {
  constructor(message = '未授权') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

// API配置
const API_CONFIG = {
  baseUrl: 'http://localhost:8000',
  //baseUrl: 'https://blueprint.mingjia.tech:2004',
  
};

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  method: RequestMethod;
  url: string;
  data?: any;
  headers?: Record<string, string>;
  attachToken?: boolean;
  isFullUrl?: boolean; // 是否为完整URL，默认false
}

// 构建完整URL
function buildFullUrl(url: string, isFullUrl: boolean = false): string {
  if (isFullUrl || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${API_CONFIG.baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
}

// 请求拦截器
function requestInterceptor(options: RequestOptions): RequestOptions {
  const fullUrl = buildFullUrl(options.url, options.isFullUrl);
  console.log('🚀 Request:', {
    method: options.method,
    url: fullUrl,
    originalUrl: options.url,
    data: options.data,
    headers: options.headers
  });
  return { ...options, url: fullUrl };
}

// 响应拦截器
async function responseInterceptor(response: Response): Promise<any> {
  console.log('📥 Response:', {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries())
  });

  if (response.status === 200 || response.status === 201) {
    const data = await response.json();
    console.log('✅ Success Response:', data);
    return data;
  } else if (response.status === 401) {
    console.log('响应检测到401无权限');
    // 未授权，自动登出
    useAuthStore.getState().logout();
    window.location.href = '/auth/login';
    throw new UnauthorizedError();
  } else {
    // 非200状态码，检查响应内容是否有error字段
    try {
      const errorData = await response.json();
      if (errorData.error) {
        console.error('❌ API Error:', errorData.error);
      }
      throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
    } catch (parseError) {
      // 如果无法解析JSON，使用默认错误信息
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }
}

export async function apiRequest({ method, url, data, headers = {}, attachToken = true, isFullUrl = false }: RequestOptions): Promise<any> {
  try {
    //console.log('apiRequest:', method, url, data, headers, attachToken, isFullUrl);
    // 请求拦截器
    const interceptedOptions = requestInterceptor({ method, url, data, headers, attachToken, isFullUrl });
    
    // 自动获取token
    const token = interceptedOptions.attachToken ? await getToken() : null;
    console.log('🚀 Token:', token);
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };

    const response = await fetch(interceptedOptions.url, {
      method: interceptedOptions.method,
      headers: { ...defaultHeaders, ...interceptedOptions.headers },
      body: interceptedOptions.method !== 'GET' ? JSON.stringify(interceptedOptions.data) : undefined,
    });

    console.log('fetch response:', response);
    // 响应拦截器
    return await responseInterceptor(response);
  } catch (error) {
    console.error('💥 API request error:', error, typeof error, error instanceof TypeError);
    throw error;
  }
}

async function getToken(): Promise<string | null> {
  return localStorage.getItem('auth_token');
}

