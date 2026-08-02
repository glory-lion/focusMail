import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  useFonts,
} from '@expo-google-fonts/geist';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { ThemedView } from '@/components/themed-view';
import { AppStateProvider, useAppState } from '@/context/app-state';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { addNotificationTapListener } from '@/services/notificationService';

function RootNavigator() {
  const { isHydrated, onboardingComplete } = useAppState();
  const [fontsLoaded] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
  });

  // App-wide: tapping a push notification (foreground, backgrounded, or
  // killed) jumps straight to that email's detail screen.
  useEffect(
    () =>
      addNotificationTapListener((data) => {
        if (typeof data.email_id === 'string') {
          router.push(`/mail/${data.email_id}`);
        }
      }),
    []
  );

  if (!isHydrated || !fontsLoaded) {
    return <ThemedView style={{ flex: 1 }} />;
  }

  return (
    <Stack screenOptions={{ animation: 'none' }}>
      <Stack.Protected guard={!onboardingComplete}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={onboardingComplete}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="mail/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ presentation: 'card' }} />
      </Stack.Protected>
      <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AppStateProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootNavigator />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AppStateProvider>
  );
}
