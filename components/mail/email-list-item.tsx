import { Pressable, StyleSheet, View } from 'react-native';

import { ImportantTag } from '@/components/mail/important-tag';
import { SummaryBadge } from '@/components/mail/summary-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts, Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Email } from '@/types/mail';

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function EmailListItem({ email, onPress }: { email: Email; onPress: () => void }) {
  const colorScheme = useColorScheme() ?? 'light';
  const unread = !email.read;
  const unreadBackground = colorScheme === 'dark' ? Palette.unreadBackgroundDark : Palette.unreadBackgroundLight;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <ThemedView
        style={[
          styles.card,
          {
            backgroundColor: unread ? unreadBackground : Colors[colorScheme].card,
            borderColor: Colors[colorScheme].border,
            borderLeftWidth: unread ? 4 : 1,
            borderLeftColor: unread ? Colors[colorScheme].tint : Colors[colorScheme].border,
          },
        ]}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <ThemedText
              type="defaultSemiBold"
              numberOfLines={1}
              style={styles.sender}
              lightColor={unread ? Colors.light.tint : undefined}
              darkColor={unread ? Colors.dark.tint : undefined}>
              {email.sender.name}
            </ThemedText>
            <ThemedText style={[styles.time, { color: unread ? Colors[colorScheme].tint : Colors[colorScheme].icon }]}>
              {formatTime(email.timestamp)}
            </ThemedText>
          </View>
          <View style={styles.subjectRow}>
            <ThemedText type="subtitle" style={styles.subject} numberOfLines={2}>
              {email.subject}
            </ThemedText>
            <ImportantTag important={email.important} />
          </View>
          <ThemedText style={[styles.preview, { color: Colors[colorScheme].icon }]} numberOfLines={1}>
            {email.preview}
          </ThemedText>
        </View>
        <SummaryBadge text={email.summary} flush borderColor={Colors[colorScheme].border} />
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
    marginHorizontal: 16,
    marginBottom: 14,
    overflow: 'hidden',
  },
  content: {
    padding: 16,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sender: {
    fontSize: 14,
    flexShrink: 1,
  },
  time: {
    fontFamily: Fonts.bold,
    fontSize: 12,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  subject: {
    flex: 1,
    fontSize: 17,
    lineHeight: 23,
  },
  preview: {
    fontSize: 13,
  },
});
