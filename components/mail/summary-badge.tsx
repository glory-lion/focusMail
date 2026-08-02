import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function SummaryBadge({
  text,
  expanded = false,
  flush = false,
  borderColor,
}: {
  text: string;
  expanded?: boolean;
  flush?: boolean;
  borderColor?: string;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const background = colorScheme === 'dark' ? Palette.tintSoftDark : Palette.tintSoftLight;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: background },
        expanded && styles.expanded,
        flush && [styles.flush, { borderTopColor: borderColor ?? Colors[colorScheme].border }],
      ]}>
      <ThemedText type="defaultSemiBold" style={styles.label} lightColor={Colors.light.tint} darkColor={Colors.dark.tint}>
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
  flush: {
    borderRadius: 0,
    borderTopWidth: 1,
    padding: 16,
    gap: 4,
  },
  label: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  text: {
    fontSize: 13,
    lineHeight: 20,
  },
});
