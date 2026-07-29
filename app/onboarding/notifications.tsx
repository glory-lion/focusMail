import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { NotificationSettingCard } from '@/components/settings/notification-setting-card';
import { ScheduleDeliveryBox } from '@/components/settings/schedule-delivery-box';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Palette } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function NotificationSettingsScreen() {
  const { notificationSettings, updateNotificationSettings, completeOnboarding } = useAppState();
  const colorScheme = useColorScheme() ?? 'light';

  const handleFinish = () => {
    completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title">Stay in the loop</ThemedText>
          <ThemedText style={styles.subtitle}>
            Choose how you want to hear about new mail. You can change these anytime in settings.
          </ThemedText>
        </View>

        <NotificationSettingCard
          icon="bolt.fill"
          iconBackground={Palette.iconBlue}
          title="Immediate Notifications"
          description="Get notified instantly only when high-priority emails land in your inbox. No more notification fatigue from newsletters or bulk updates."
          value={notificationSettings.immediateEnabled}
          onValueChange={(value) => updateNotificationSettings({ immediateEnabled: value })}
        />

        <NotificationSettingCard
          icon="sparkles"
          iconBackground={Palette.iconPurple}
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
    gap: 20,
    justifyContent: 'center',
    flexGrow: 1,
  },
  header: {
    gap: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
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
    fontSize: 16,
  },
});
