import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { defaultNotificationSettings, defaultProfile } from '@/data/mockProfile';
import { connectAccount as connectAccountService } from '@/services/accountService';
import { setSessionToken } from '@/services/apiClient';
import { getSettings, updateSettings as updateSettingsService } from '@/services/settingsService';
import type { Account, NotificationSettings, Provider, UserProfile } from '@/types/mail';

const STORAGE_KEY = 'focus-mail-app/state';

// Google doesn't give us a display name from the scopes we request (Gmail
// API's own profile endpoint only returns the email address) — derive
// something reasonable from the local part rather than showing a
// leftover placeholder name that belongs to nobody using this session.
function deriveNameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? email;
  const cleaned = local.replace(/[0-9]+$/, '').replace(/[._-]+/g, ' ').trim();
  const words = (cleaned || local).split(' ').filter(Boolean);
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

interface PersistedState {
  account: Account | null;
  notificationSettings: NotificationSettings;
  profile: UserProfile;
  onboardingComplete: boolean;
}

interface AppStateContextValue extends PersistedState {
  isHydrated: boolean;
  connectAccount: (provider: Provider) => Promise<void>;
  setGoogleAccount: (email: string, token: string) => Promise<void>;
  updateNotificationSettings: (partial: Partial<NotificationSettings>) => void;
  updateProfile: (partial: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  logout: () => void;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(
    defaultNotificationSettings
  );
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: PersistedState = JSON.parse(raw);
          setAccount(parsed.account);
          setNotificationSettings(parsed.notificationSettings);
          setProfile(parsed.profile);
          setOnboardingComplete(parsed.onboardingComplete);
        }
      } finally {
        setIsHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const state: PersistedState = { account, notificationSettings, profile, onboardingComplete };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [isHydrated, account, notificationSettings, profile, onboardingComplete]);

  // Pull the real notification prefs from backend/api once a Gmail account
  // with a real session token is connected. Best-effort: if this is a mock
  // account (no live backend), the request just fails silently and the
  // locally-persisted settings keep being used.
  useEffect(() => {
    if (!account?.connected || account.provider !== 'gmail') return;
    getSettings()
      .then(setNotificationSettings)
      .catch(() => {});
  }, [account?.connected, account?.provider]);

  const value = useMemo<AppStateContextValue>(
    () => ({
      account,
      notificationSettings,
      profile,
      onboardingComplete,
      isHydrated,
      connectAccount: async (provider: Provider) => {
        const connected = await connectAccountService(provider);
        setAccount(connected);
      },
      setGoogleAccount: async (email: string, token: string) => {
        await setSessionToken(token);
        setAccount({ provider: 'gmail', connected: true, emailAddress: email });
        setProfile((prev) => ({ ...prev, email, name: deriveNameFromEmail(email) }));
      },
      updateNotificationSettings: (partial) =>
        setNotificationSettings((prev) => {
          const next = { ...prev, ...partial };
          updateSettingsService(next).catch(() => {});
          return next;
        }),
      updateProfile: (partial) => setProfile((prev) => ({ ...prev, ...partial })),
      completeOnboarding: () => setOnboardingComplete(true),
      logout: () => {
        setSessionToken(null).catch(() => {});
        setAccount(null);
        setOnboardingComplete(false);
      },
    }),
    [account, notificationSettings, profile, onboardingComplete, isHydrated]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
