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
import { AppHeader, HeaderIconButton } from '@/components/ui/app-header';
import { GlassCard } from '@/components/ui/glass-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
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
      <Stack.Screen
        options={{
          header: () => (
            <AppHeader
              leading={
                <HeaderIconButton onPress={() => router.back()}>
                  <IconSymbol name="chevron.left" size={18} color={Colors[colorScheme].text} />
                </HeaderIconButton>
              }
            />
          ),
        }}
      />
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
            {profile.title ? `${profile.title} · ` : ''}
            {profile.email}
          </ThemedText>
        </View>

        <Section title="Connected Accounts">
          <GlassCard radius={16}>
            <View style={styles.card}>
              <AccountRow
                provider="gmail"
                title="Gmail"
                subtitle={isConnected('gmail') ? account!.emailAddress : 'Not linked'}
                onPress={isConnected('gmail') ? undefined : () => connectAccount('gmail')}
                trailing={isConnected('gmail') ? <ConnectedPill /> : <ConnectPill />}
              />
              <View style={[styles.divider, { backgroundColor: Colors[colorScheme].border }]} />
              <AccountRow
                provider="outlook"
                title="Outlook"
                subtitle="Not available yet"
                disabled
                trailing={<ComingSoonPill />}
              />
            </View>
          </GlassCard>
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
        { backgroundColor: colorScheme === 'dark' ? Palette.tintSoftDark : Palette.tintSoftLight },
      ]}>
      <ThemedText type="defaultSemiBold" style={styles.pillText} lightColor={Colors.light.tint} darkColor={Colors.dark.tint}>
        Connected
      </ThemedText>
    </View>
  );
}

function ConnectPill() {
  const colorScheme = useColorScheme() ?? 'light';
  return (
    <View style={[styles.pill, styles.outlinedPill, { borderColor: Colors[colorScheme].tint }]}>
      <ThemedText type="defaultSemiBold" style={styles.pillText} lightColor={Colors.light.tint} darkColor={Colors.dark.tint}>
        Connect
      </ThemedText>
    </View>
  );
}

function ComingSoonPill() {
  const colorScheme = useColorScheme() ?? 'light';
  return (
    <View style={[styles.pill, { backgroundColor: Colors[colorScheme].border }]}>
      <ThemedText type="defaultSemiBold" style={[styles.pillText, { color: Colors[colorScheme].icon }]}>
        Coming soon
      </ThemedText>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
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
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 44,
    gap: 30,
  },
  profileHeader: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 6,
    paddingBottom: 6,
  },
  avatarWrap: {
    marginBottom: 8,
  },
  nameInput: {
    fontSize: 24,
    fontFamily: Fonts.semiBold,
    lineHeight: 30,
    padding: 0,
    width: '100%',
    maxWidth: 320,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  section: {
    gap: 13,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  card: {
    paddingHorizontal: 18,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  pill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 13,
  },
  outlinedPill: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  pillText: {
    fontSize: 12,
    lineHeight: 16,
  },
  logoutButton: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
});
