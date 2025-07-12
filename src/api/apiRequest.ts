// API配置
const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api',
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

  if (response.status === 200) {
    const data = await response.json();
    console.log('✅ Success Response:', data);
    return data;
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
    // 请求拦截器
    const interceptedOptions = requestInterceptor({ method, url, data, headers, attachToken, isFullUrl });
    
    // 自动获取token
    const token = interceptedOptions.attachToken ? await getToken() : null;
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };

    const response = await fetch(url, {
      method: interceptedOptions.method,
      headers: { ...defaultHeaders, ...interceptedOptions.headers },
      body: interceptedOptions.method !== 'GET' ? JSON.stringify(interceptedOptions.data) : undefined,
    });

    // 响应拦截器
    return await responseInterceptor(response);
  } catch (error) {
    console.error('💥 API request error:', error);
    throw error;
  }
}

async function getToken(): Promise<string | null> {
  return localStorage.getItem('auth_token');
}

