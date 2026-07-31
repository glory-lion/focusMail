import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NotificationSettingCard } from '@/components/settings/notification-setting-card';
import { ScheduleDeliveryBox } from '@/components/settings/schedule-delivery-box';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function NotificationSettingsScreen() {
  const { notificationSettings, updateNotificationSettings, completeOnboarding } = useAppState();
  const colorScheme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();

  const handleFinish = () => {
    completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <ThemedView style={styles.container}>
      <Pressable onPress={() => router.back()} hitSlop={10} style={[styles.backButton, { top: insets.top + 12 }]}>
        <IconSymbol name="arrow.left" size={22} color={Colors[colorScheme].text} />
      </Pressable>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title">Stay in the loop</ThemedText>
          <ThemedText style={styles.subtitle}>
            Choose how you want to hear about new mail. You can change these anytime in settings.
          </ThemedText>
        </View>

        <NotificationSettingCard
          title="Immediate Notifications"
          description="Get notified instantly only when high-priority emails land in your inbox. No more notification fatigue from newsletters or bulk updates."
          value={notificationSettings.immediateEnabled}
          onValueChange={(value) => updateNotificationSettings({ immediateEnabled: value })}
        />

        <NotificationSettingCard
          title="Daily Insights"
          description="Receive a beautifully formatted summary of your day's activity. Daily Insights include total email counts, important sender highlights, and AI-detected action items."
          value={notificationSettings.dailyDigestEnabled}
          onValueChange={(value) => updateNotificationSettings({ dailyDigestEnabled: value })}>
          {notificationSettings.dailyDigestEnabled ? (
            <ScheduleDeliveryBox
              value={notificationSettings.digestTime}
              onChange={(digestTime) => updateNotificationSettings({ digestTime })}
            />
          ) : null}
        </NotificationSettingCard>

        <Pressable
          onPress={handleFinish}
          style={[styles.finishButton, { backgroundColor: Colors[colorScheme].tint }]}>
          <ThemedText type="defaultSemiBold" style={styles.finishLabel} lightColor="#fff" darkColor="#fff">
            Finish setup
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 72,
    gap: 20,
    justifyContent: 'center',
    flexGrow: 1,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 1,
    padding: 4,
  },
  header: {
    gap: 12,
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.75,
  },
  finishButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  finishLabel: {
    fontSize: 15,
  },
});
