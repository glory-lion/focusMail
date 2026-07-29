import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function SummaryBadge({ text, expanded = false }: { text: string; expanded?: boolean }) {
  const colorScheme = useColorScheme() ?? 'light';
  const background = colorScheme === 'dark' ? '#0A0E18' : '#DEE6F8';

  return (
    <View style={[styles.container, { backgroundColor: background }, expanded && styles.expanded]}>
      <ThemedText type="defaultSemiBold" style={styles.label} lightColor={Colors.light.tint} darkColor="#93B4F8">
        SUMMARY:
      </ThemedText>
      <ThemedText style={styles.text}>{text}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  expanded: {
    padding: 16,
    gap: 8,
  },
  label: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
});
