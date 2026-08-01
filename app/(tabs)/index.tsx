import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmailList } from '@/components/mail/email-list';
import { FilterChips } from '@/components/mail/filter-chips';
import { HeadsUpBanner } from '@/components/mail/heads-up-banner';
import { ProfileAvatar } from '@/components/settings/profile-avatar';
import { ThemedView } from '@/components/themed-view';
import { TopBarTitle } from '@/components/ui/top-bar-title';
import { useAppState } from '@/context/app-state';
import { filterEmails, getEmails, groupEmailsByDay, type EmailFilter } from '@/services/mailService';
import type { Email } from '@/types/mail';

export default function HomeScreen() {
  const { profile } = useAppState();
  const insets = useSafeAreaInsets();
  const [emails, setEmails] = useState<Email[]>([]);
  const [filter, setFilter] = useState<EmailFilter>('all');

  useFocusEffect(
    useCallback(() => {
      getEmails().then(setEmails);
    }, [])
  );

  const importantUnreadCount = useMemo(
    () => filterEmails(emails, 'all').filter((email) => email.important && !email.read).length,
    [emails]
  );
  const sections = useMemo(() => groupEmailsByDay(filterEmails(emails, filter)), [emails, filter]);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.push('/profile')} hitSlop={8}>
          <ProfileAvatar name={profile.name} avatarUrl={profile.avatarUrl} size={36} />
        </Pressable>
        <TopBarTitle />
        <View style={styles.spacer} />
      </View>
      <EmailList
        sections={sections}
        onSelect={(id) => router.push(`/mail/${id}`)}
        ListHeaderComponent={
          <>
            <FilterChips active={filter} onChange={setFilter} />
            <HeadsUpBanner count={importantUnreadCount} />
          </>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  spacer: {
    width: 36,
  },
});
