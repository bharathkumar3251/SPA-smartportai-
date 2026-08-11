import axios, { AxiosError, type AxiosInstance } from "axios";

const baseURL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL) ||
  "/api";

export const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

const TOKEN_KEY = "smartport.token";

export function setAuthToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export type ApiError = {
  status: number;
  message: string;
};

export function toApiError(err: unknown): ApiError {
  if (err instanceof AxiosError) {
    return {
      status: err.response?.status ?? 0,
      message:
        (err.response?.data as { message?: string } | undefined)?.message ||
        err.message ||
        "Request failed",
    };
  }
  return { status: 0, message: "Network error" };
}

export async function getJSON<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await api.get<T>(path, { params });
  return data;
}

export async function postJSON<T>(path: string, body?: unknown): Promise<T> {
  const { data } = await api.post<T>(path, body);
  return data;
}