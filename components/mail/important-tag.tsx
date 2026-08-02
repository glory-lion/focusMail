import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function ImportantTag({ important, size = 'sm' }: { important: boolean; size?: 'sm' | 'md' }) {
  const colorScheme = useColorScheme() ?? 'light';
  const red = Palette.importantRed;
  const isMd = size === 'md';

  return (
    <ThemedView
      style={[
        styles.tag,
        isMd && styles.tagMd,
        important
          ? { backgroundColor: colorScheme === 'dark' ? 'rgba(225,29,72,0.14)' : 'rgba(225,29,72,0.09)', borderColor: red }
          : { backgroundColor: 'transparent', borderColor: Colors[colorScheme].icon },
      ]}>
      <ThemedText
        style={[styles.label, isMd && styles.labelMd, { color: important ? red : Colors[colorScheme].icon }]}
        type="defaultSemiBold">
        {important ? 'Important' : 'Unimportant'}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagMd: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  label: {
    fontSize: 10,
    lineHeight: 14,
  },
  labelMd: {
    fontSize: 12,
    lineHeight: 16,
  },
});
