import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  useFonts,
} from '@expo-google-fonts/geist';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { ThemedView } from '@/components/themed-view';
import { AppStateProvider, useAppState } from '@/context/app-state';
import { useColorScheme } from '@/hooks/use-color-scheme';

function RootNavigator() {
  const { isHydrated, onboardingComplete } = useAppState();
  const [fontsLoaded] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
  });

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
