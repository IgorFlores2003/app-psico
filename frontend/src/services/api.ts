export const API_BASE = '/api';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('psico_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('psico_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('psico_token');
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: T }> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  let data: any = null;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  }

  if (res.status === 401 && !endpoint.includes('/auth/login') && !endpoint.startsWith('/responder')) {
    clearAuthToken();
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  return { ok: res.ok, status: res.status, data };
}
