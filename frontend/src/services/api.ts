const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";
const TOKEN_KEY = "gpx_auth_token";

export type BackendError = {
  error?: string;
  code?: string;
};

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch<T>(path: string, init?: RequestInit, auth = false): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has("Content-Type") && !(init?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getToken();
    if (!token) {
      throw new ApiError(401, "Missing auth token", "unauthorized");
    }
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const err = await parseApiError(res);
    if (res.status === 402) {
      err.code = "SUBSCRIPTION_REQUIRED";
    }
    throw err;
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export async function parseApiError(res: Response): Promise<ApiError> {
  try {
    const data = (await res.json()) as BackendError;
    return new ApiError(res.status, data.error ?? `Request failed (${res.status})`, data.code);
  } catch {
    return new ApiError(res.status, `Request failed (${res.status})`);
  }
}
