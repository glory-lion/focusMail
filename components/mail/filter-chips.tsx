import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { EmailFilter } from '@/services/mailService';

const FILTERS: { key: EmailFilter; label: string }[] = [
  { key: 'all', label: 'All Messages' },
  { key: 'unread', label: 'Unread' },
  { key: 'attachments', label: 'Attachments' },
  { key: 'urgent', label: 'Important' },
  { key: 'archived', label: 'Archived' },
  { key: 'deleted', label: 'Deleted' },
];

export function FilterChips({
  active,
  onChange,
}: {
  active: EmailFilter;
  onChange: (filter: EmailFilter) => void;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const tint = Colors[colorScheme].tint;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}>
      {FILTERS.map((filter) => {
        const selected = filter.key === active;
        return (
          <Pressable
            key={filter.key}
            onPress={() => onChange(filter.key)}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? tint : 'transparent',
                borderColor: selected ? tint : Colors[colorScheme].border,
              },
            ]}>
            <ThemedText
              type="defaultSemiBold"
              style={styles.label}
              lightColor={selected ? '#fff' : Colors[colorScheme].text}
              darkColor={selected ? '#fff' : Colors[colorScheme].text}>
              {filter.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 8,
  },
  chip: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 13,
  },
});
