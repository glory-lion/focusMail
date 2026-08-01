import { Linking, Platform } from 'react-native';

import { API_URL } from '@/services/apiClient';
import type { Account, Provider } from '@/types/mail';

const SIMULATED_DELAY_MS = 800;

/**
 * Kicks off the real Google OAuth flow against backend/api. The browser
 * navigates away entirely — on success the backend redirects back to
 * `${FRONTEND_URL}/auth/callback?token=...&email=...`, handled by
 * app/auth/callback.tsx.
 */
export function startGoogleOAuth(): void {
  const loginUrl = `${API_URL}/auth/login`;
  if (Platform.OS === 'web') {
    window.location.href = loginUrl;
  } else {
    // Opens the system browser. Note: on native, the backend's redirect
    // target (FRONTEND_URL, a plain http URL) can't deep-link back into
    // this app the way a custom scheme could — this path is only fully
    // wired up for Expo web today.
    Linking.openURL(loginUrl);
  }
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
