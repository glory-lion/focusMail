import { router, Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AccountRow } from '@/components/settings/account-row';
import { AnalyticsPanel } from '@/components/settings/analytics-panel';
import { NotificationSettingCard } from '@/components/settings/notification-setting-card';
import { ProfileAvatar } from '@/components/settings/profile-avatar';
import { ScheduleDeliveryBox } from '@/components/settings/schedule-delivery-box';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TopBarTitle } from '@/components/ui/top-bar-title';
import { Colors, Fonts, Palette } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { filterEmails, getEmails, getWeeklyStats } from '@/services/mailService';
import type { Provider, WeeklyInsightsStats } from '@/types/mail';

export default function ProfileScreen() {
  const { profile, updateProfile, notificationSettings, updateNotificationSettings, account, connectAccount, logout } =
    useAppState();
  const colorScheme = useColorScheme() ?? 'light';
  const [stats, setStats] = useState<WeeklyInsightsStats | null>(null);
  const nameInputRef = useRef<TextInput>(null);

  useEffect(() => {
    getEmails().then((emails) => setStats(getWeeklyStats(filterEmails(emails, 'all'))));
  }, []);

  const handleLogout = () => {
    logout();
    router.replace('/onboarding');
  };

  const isConnected = (provider: Provider) => account?.provider === provider && account.connected;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerTitle: () => <TopBarTitle /> }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrap}>
            <ProfileAvatar name={profile.name} avatarUrl={profile.avatarUrl} size={92} ring />
          </View>
          <TextInput
            ref={nameInputRef}
            value={profile.name}
            onChangeText={(name) => updateProfile({ name })}
            style={[styles.nameInput, { color: Colors[colorScheme].text }]}
            placeholder="Your name"
            placeholderTextColor={Colors[colorScheme].icon}
            textAlign="center"
          />
          <ThemedText style={[styles.subtitle, { color: Colors[colorScheme].icon }]}>
            {profile.title} · {profile.email}
          </ThemedText>
        </View>

        <Section title="Connected Accounts">
          <View style={[styles.card, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}>
            <AccountRow
              provider="gmail"
              title="Gmail"
              subtitle={isConnected('gmail') ? account!.emailAddress : 'Not linked'}
              onPress={isConnected('gmail') ? undefined : () => connectAccount('gmail')}
              trailing={
                isConnected('gmail') ? (
                  <ConnectedPill />
                ) : (
                  <ThemedText type="defaultSemiBold" style={[styles.connectText, { color: Colors[colorScheme].tint }]}>
                    Connect
                  </ThemedText>
                )
              }
            />
            <View style={[styles.divider, { backgroundColor: Colors[colorScheme].border }]} />
            <AccountRow
              provider="outlook"
              title="Outlook"
              subtitle={isConnected('outlook') ? account!.emailAddress : 'Not linked'}
              onPress={isConnected('outlook') ? undefined : () => connectAccount('outlook')}
              trailing={
                isConnected('outlook') ? (
                  <ConnectedPill />
                ) : (
                  <ThemedText type="defaultSemiBold" style={[styles.connectText, { color: Colors[colorScheme].tint }]}>
                    Connect
                  </ThemedText>
                )
              }
            />
          </View>
        </Section>

        <Section title="Notifications">
          <NotificationSettingCard
            title="Immediate Notifications"
            description="Receive alerts as soon as a priority email arrives."
            value={notificationSettings.immediateEnabled}
            onValueChange={(value) => updateNotificationSettings({ immediateEnabled: value })}
          />
          <NotificationSettingCard
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

function ConnectedPill() {
  const colorScheme = useColorScheme() ?? 'light';
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: colorScheme === 'dark' ? 'rgba(37,99,235,0.22)' : '#DCE7FB' },
      ]}>
      <ThemedText type="defaultSemiBold" style={styles.pillText} lightColor={Colors.light.tint} darkColor={Colors.dark.tint}>
        Connected
      </ThemedText>
    </View>
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
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
  },
  avatarWrap: {
    marginBottom: 10,
  },
  nameInput: {
    fontSize: 23,
    fontFamily: Fonts.semiBold,
    padding: 0,
    minWidth: 160,
  },
  subtitle: {
    fontSize: 13,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  pill: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  pillText: {
    fontSize: 13,
  },
  connectText: {
    fontSize: 13,
  },
  logoutButton: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
});
