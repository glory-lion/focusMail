import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { exchangeNativeCode } from '@/services/accountService';

export default function AuthCallbackScreen() {
  const { token, email, code, error } = useLocalSearchParams<{
    token?: string;
    email?: string;
    code?: string;
    error?: string;
  }>();
  const { setGoogleAccount } = useAppState();
  const colorScheme = useColorScheme() ?? 'light';
  const handled = useRef(false);
  const [exchangeError, setExchangeError] = useState<string | null>(null);

  useEffect(() => {
    if (handled.current) return;

    if (token && email) {
      // Web flow: backend already redirected with the real session token.
      handled.current = true;
      setGoogleAccount(String(email), String(token)).then(() => {
        router.replace('/onboarding/notifications');
      });
      return;
    }

    if (code) {
      // Native flow: this is a one-time exchange code, not the session
      // token itself — trade it in via POST /auth/native/exchange.
      handled.current = true;
      exchangeNativeCode(String(code))
        .then((result) => setGoogleAccount(result.email, result.session_token))
        .then(() => router.replace('/onboarding/notifications'))
        .catch((err) => {
          handled.current = false;
          setExchangeError(err instanceof Error ? err.message : 'Could not finish connecting. Please try again.');
        });
    }
  }, [token, email, code, setGoogleAccount]);

  if (error || exchangeError) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.heading}>
          Couldn&apos;t connect
        </ThemedText>
        <ThemedText style={[styles.message, { color: Colors[colorScheme].icon }]}>
          {error ?? exchangeError}
        </ThemedText>
        <ThemedText
          type="link"
          style={{ color: Colors[colorScheme].tint }}
          onPress={() => router.replace('/onboarding')}>
          Try again
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ActivityIndicator color={Colors[colorScheme].tint} />
      <ThemedText style={styles.message}>Connecting your inbox…</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  heading: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
});
