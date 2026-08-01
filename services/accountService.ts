import { Linking, Platform } from 'react-native';

import { API_URL, apiFetch } from '@/services/apiClient';
import type { Account, Provider } from '@/types/mail';

const SIMULATED_DELAY_MS = 800;

/**
 * Kicks off the real Google OAuth flow against backend/api.
 *
 * Web: full page navigation to /auth/login; on success the backend
 * redirects to `${FRONTEND_URL}/auth/callback?token=...&email=...`.
 *
 * Native: passes platform=native so the backend routes through the
 * exchange-code + custom-scheme redirect instead (a plain http redirect
 * target can't deep-link back into a native app). The app's own
 * `focusmailapp://` scheme (see app.json) then reopens this app at
 * /auth/callback?code=..., which app/auth/callback.tsx exchanges for a
 * real session token via exchangeNativeCode below. Note: this deep link
 * back into the app only works from a custom dev client / standalone
 * build — plain Expo Go can't claim a project-specific URL scheme.
 */
export function startGoogleOAuth(): void {
  if (Platform.OS === 'web') {
    window.location.href = `${API_URL}/auth/login`;
  } else {
    Linking.openURL(`${API_URL}/auth/login?platform=native`);
  }
}

export interface NativeExchangeResult {
  session_token: string;
  email: string;
}

export function exchangeNativeCode(code: string): Promise<NativeExchangeResult> {
  return apiFetch<NativeExchangeResult>('/auth/native/exchange', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_DELAY_MS));
}

const MOCK_ADDRESS: Record<Provider, string> = {
  gmail: 'chelseagratiaa@gmail.com',
  outlook: 'chelseagratiaa@outlook.com',
};

export function connectAccount(provider: Provider): Promise<Account> {
  return delay({ provider, connected: true, emailAddress: MOCK_ADDRESS[provider] });
}

export function disconnectAccount(): Promise<void> {
  return delay(undefined);
}
