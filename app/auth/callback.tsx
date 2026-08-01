import * as Linking from 'expo-linking';
console.log('REDIRECT URI:', Linking.createURL('auth/callback'));

import { Platform } from 'react-native';
console.log('PLATFORM:', Platform.OS);

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AuthCallbackScreen() {
  const { token, email, error } = useLocalSearchParams<{ token?: string; email?: string; error?: string }>();
  const { setGoogleAccount } = useAppState();
  const colorScheme = useColorScheme() ?? 'light';
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    if (token && email) {
      handled.current = true;
      setGoogleAccount(String(email), String(token)).then(() => {
        router.replace('/onboarding/notifications');
      });
    }
  }, [token, email, setGoogleAccount]);

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.heading}>
          Couldn&apos;t connect
        </ThemedText>
        <ThemedText style={[styles.message, { color: Colors[colorScheme].icon }]}>{error}</ThemedText>
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
