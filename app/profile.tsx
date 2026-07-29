import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AnalyticsPanel } from '@/components/settings/analytics-panel';
import { NotificationSettingCard } from '@/components/settings/notification-setting-card';
import { ProfileAvatar } from '@/components/settings/profile-avatar';
import { ScheduleDeliveryBox } from '@/components/settings/schedule-delivery-box';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts, Palette } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getEmails, getWeeklyStats } from '@/services/mailService';
import type { WeeklyInsightsStats } from '@/types/mail';

export default function ProfileScreen() {
  const { profile, updateProfile, notificationSettings, updateNotificationSettings, account, logout } =
    useAppState();
  const colorScheme = useColorScheme() ?? 'light';
  const [stats, setStats] = useState<WeeklyInsightsStats | null>(null);

  useEffect(() => {
    getEmails().then((emails) => setStats(getWeeklyStats(emails)));
  }, []);

  const handleLogout = () => {
    logout();
    router.replace('/onboarding');
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Profile & Settings' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <ProfileAvatar name={profile.name} avatarUrl={profile.avatarUrl} size={64} />
          <View style={styles.profileFields}>
            <TextInput
              value={profile.name}
              onChangeText={(name) => updateProfile({ name })}
              style={[styles.nameInput, { color: Colors[colorScheme].text }]}
              placeholder="Your name"
              placeholderTextColor={Colors[colorScheme].icon}
            />
            <ThemedText style={[styles.email, { color: Colors[colorScheme].icon }]}>
              {profile.email}
            </ThemedText>
            {account ? (
              <ThemedText style={[styles.accountLine, { color: Colors[colorScheme].icon }]}>
                Connected via {account.provider === 'gmail' ? 'Gmail' : 'Outlook'} ({account.emailAddress})
              </ThemedText>
            ) : null}
          </View>
        </View>

        <Section title="Notifications">
          <NotificationSettingCard
            icon="bolt.fill"
            iconBackground={Palette.iconBlue}
            title="Immediate Notifications"
            description="Get notified instantly only when high-priority emails land in your inbox."
            value={notificationSettings.immediateEnabled}
            onValueChange={(value) => updateNotificationSettings({ immediateEnabled: value })}
          />
          <NotificationSettingCard
            icon="sparkles"
            iconBackground={Palette.iconPurple}
            title="Daily Insights"
            description="Receive a daily summary of email counts, important mail, and key deadlines."
            value={notificationSettings.dailyDigestEnabled}
            onValueChange={(value) => updateNotificationSettings({ dailyDigestEnabled: value })}>
            {notificationSettings.dailyDigestEnabled ? (
              <ScheduleDeliveryBox
                value={notificationSettings.digestTime}
                onChange={(digestTime) => updateNotificationSettings({ digestTime })}
              />
            ) : null}
          </NotificationSettingCard>
        </Section>

        <Section title="Your journey so far">
          {stats ? <AnalyticsPanel stats={stats} /> : null}
        </Section>

        <Pressable
          onPress={handleLogout}
          style={[styles.logoutButton, { borderColor: Palette.critical }]}>
          <ThemedText type="defaultSemiBold" lightColor={Palette.critical} darkColor={Palette.critical}>
            Log out
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 28,
    paddingBottom: 40,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileFields: {
    flex: 1,
    gap: 4,
  },
  nameInput: {
    fontSize: 20,
    fontFamily: Fonts.semiBold,
    padding: 0,
  },
  email: {
    fontSize: 14,
  },
  accountLine: {
    fontSize: 13,
    marginTop: 2,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
  },
  logoutButton: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
});
