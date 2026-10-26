import { STORAGE_KEYS } from '../constants';

export class ApiError extends Error {
  public status: number;
  public data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function getBaseUrl(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const viteUrl = import.meta.env.VITE_API_URL;
    const nextUrl = (import.meta.env as any).NEXT_PUBLIC_API_URL;
    const envUrl = viteUrl || nextUrl;
    if (envUrl && typeof envUrl === 'string') {
      return envUrl.replace(/\/+$/, '');
    }
  }
  return '';
}

export function buildUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const base = getBaseUrl();
  if (!base) {
    return endpoint;
  }
  if (base.endsWith('/api') && endpoint.startsWith('/api/')) {
    return `${base}${endpoint.substring(4)}`;
  }
  return `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
}

export async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = buildUrl(endpoint);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.error || data.message || `Request failed with status ${response.status}`,
      data
    );
  }

  return data as T;
}
