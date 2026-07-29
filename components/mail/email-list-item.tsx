import { Pressable, StyleSheet, View } from 'react-native';

import { ImportantTag } from '@/components/mail/important-tag';
import { SummaryBadge } from '@/components/mail/summary-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Email } from '@/types/mail';

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function EmailListItem({ email, onPress }: { email: Email; onPress: () => void }) {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <ThemedView
        style={[
          styles.card,
          { borderColor: Colors[colorScheme].border },
          !email.read && { borderLeftWidth: 4, borderLeftColor: Colors[colorScheme].tint },
        ]}>
        <View style={styles.headerRow}>
          <ThemedText type="defaultSemiBold" numberOfLines={1} style={styles.sender}>
            {email.sender.name}
          </ThemedText>
          <ThemedText style={[styles.time, { color: Colors[colorScheme].icon }]}>
            {formatTime(email.timestamp)}
          </ThemedText>
        </View>
        <ThemedText type="subtitle" style={styles.subject} numberOfLines={2}>
          {email.subject}
        </ThemedText>
        <ThemedText style={[styles.preview, { color: Colors[colorScheme].icon }]} numberOfLines={1}>
          {email.preview}
        </ThemedText>
        <View style={styles.tagRow}>
          <ImportantTag important={email.important} />
        </View>
        <SummaryBadge text={email.summary} />
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sender: {
    fontSize: 15,
    flexShrink: 1,
  },
  time: {
    fontSize: 13,
  },
  subject: {
    fontSize: 18,
    lineHeight: 23,
  },
  preview: {
    fontSize: 14,
  },
  tagRow: {
    flexDirection: 'row',
  },
});
