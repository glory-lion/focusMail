import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

const SESSION_TOKEN_KEY = 'focus-mail-app/session-token';

let cachedToken: string | null | undefined;

export async function getSessionToken(): Promise<string | null> {
  if (cachedToken !== undefined) return cachedToken;
  cachedToken = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
  return cachedToken;
}

export async function setSessionToken(token: string | null): Promise<void> {
  cachedToken = token;
  if (token) {
    await AsyncStorage.setItem(SESSION_TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(SESSION_TOKEN_KEY);
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getSessionToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(response.status, body?.detail ?? `Request to ${path} failed (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
