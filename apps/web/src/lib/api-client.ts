import sdk from '@farcaster/miniapp-sdk';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || '';

interface ApiError {
  error: { code: string; message?: string };
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  // Dev auth bypass
  if (process.env.NODE_ENV === 'development') {
    return { 'X-Farcaster-FID': '1' };
  }

  // Production: get Quick Auth JWT from Farcaster SDK
  try {
    const { token } = await sdk.quickAuth.getToken();
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch {
    // Not in Farcaster client environment
  }

  return {};
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeaders,
    ...(init?.headers as Record<string, string>),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({
      error: { code: 'UNKNOWN', message: res.statusText },
    }))) as ApiError;
    throw new Error(body.error?.message || body.error?.code || 'Request failed');
  }

  const json = (await res.json()) as { data: T };
  return json.data;
}

export const apiClient = {
  get<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'GET' });
  },
  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },
};
