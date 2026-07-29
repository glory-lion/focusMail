import { SectionList, StyleSheet } from 'react-native';

import { DaySectionHeader } from '@/components/mail/day-section-header';
import { EmailListItem } from '@/components/mail/email-list-item';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { EmailSection } from '@/services/mailService';

export function EmailList({
  sections,
  onSelect,
  ListHeaderComponent,
}: {
  sections: EmailSection[];
  onSelect: (id: string) => void;
  ListHeaderComponent?: React.ComponentType | React.ReactElement | null;
}) {
  return (
    <SectionList
      sections={sections.map((s) => ({ title: s.dayBucket, data: s.data }))}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <EmailListItem email={item} onPress={() => onSelect(item.id)} />}
      renderSectionHeader={({ section }) => <DaySectionHeader label={section.title} />}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        <ThemedView style={styles.empty}>
          <ThemedText style={styles.emptyText}>No emails match this filter.</ThemedText>
        </ThemedView>
      }
      contentContainerStyle={styles.content}
      stickySectionHeadersEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 24,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    opacity: 0.6,
  },
});
