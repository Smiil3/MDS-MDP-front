import { API_BASE_URL, API_REFRESH_PATH } from './config';
import { AuthSuccessResponse } from '../../types/auth';

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type AuthHandlers = {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  onRefreshSuccess: (data: AuthSuccessResponse) => Promise<void>;
  onAuthFailure: () => Promise<void>;
};

let authHandlers: AuthHandlers | null = null;

export function setApiAuthHandlers(handlers: AuthHandlers | null): void {
  authHandlers = handlers;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const hasJson = response.headers.get('content-type')?.includes('application/json');
  const body = hasJson ? await response.json() : null;

  if (!response.ok) {
    const message = body?.message ?? 'Request failed';
    throw new ApiError(message, response.status);
  }

  return (body ?? null) as T;
}

async function refreshAccessToken(): Promise<boolean> {
  if (!authHandlers) {
    return false;
  }

  const refreshToken = authHandlers.getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${API_REFRESH_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as AuthSuccessResponse;
    if (!data.accessToken || !data.refreshToken || !data.user) {
      return false;
    }

    await authHandlers.onRefreshSuccess(data);
    return true;
  } catch {
    return false;
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  retryOnUnauthorized = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');

  const accessToken = authHandlers?.getAccessToken();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401 && retryOnUnauthorized && path !== API_REFRESH_PATH) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiRequest<T>(path, init, false);
    }

    await authHandlers?.onAuthFailure();
    throw new ApiError('Session expired. Please log in again.', 401);
  }

  return parseResponse<T>(response);
}

export async function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: 'GET' });
}

export async function apiPost<T, B>(path: string, body: B): Promise<T> {
  return apiRequest<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

export { ApiError };
