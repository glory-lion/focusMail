import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet } from 'react-native';

import { EmailList } from '@/components/mail/email-list';
import { FilterChips } from '@/components/mail/filter-chips';
import { HeadsUpBanner } from '@/components/mail/heads-up-banner';
import { ProfileAvatar } from '@/components/settings/profile-avatar';
import { ThemedView } from '@/components/themed-view';
import { AppHeader } from '@/components/ui/app-header';
import { useAppState } from '@/context/app-state';
import { filterEmails, getEmails, groupEmailsByDay, type EmailFilter } from '@/services/mailService';
import type { Email } from '@/types/mail';

export default function HomeScreen() {
  const { profile } = useAppState();
  const [emails, setEmails] = useState<Email[]>([]);
  const [filter, setFilter] = useState<EmailFilter>('all');
  const hasLoadedOnce = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const load = () => getEmails().then((result) => {
        if (cancelled) return;
        if (hasLoadedOnce.current) {
          // Only animate updates after the first load — a new/reordered
          // row (e.g. a new email arriving via the poll below) smoothly
          // slides/fades in instead of the list abruptly jumping. Skipped
          // on the very first load so the initial list doesn't cascade in.
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }
        hasLoadedOnce.current = true;
        setEmails(result);
      });

      load();
      // backend/api polls Gmail every ~75s and classifies in the
      // background — without this, new mail only appears after leaving
      // and returning to this screen (which re-triggers useFocusEffect).
      const interval = setInterval(load, 30_000);
      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }, [])
  );

  const importantUnreadCount = useMemo(
    () => filterEmails(emails, 'all').filter((email) => email.important && !email.read).length,
    [emails]
  );
  const sections = useMemo(() => groupEmailsByDay(filterEmails(emails, filter)), [emails, filter]);

  return (
    <ThemedView style={styles.container}>
      <AppHeader
        leading={
          <Pressable onPress={() => router.push('/profile')} hitSlop={8}>
            <ProfileAvatar name={profile.name} avatarUrl={profile.avatarUrl} size={36} />
          </Pressable>
        }
      />
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
});
