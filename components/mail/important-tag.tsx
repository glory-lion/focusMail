import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function ImportantTag({ important }: { important: boolean }) {
  const colorScheme = useColorScheme() ?? 'light';
  const tint = Colors[colorScheme].tint;

  return (
    <ThemedView
      style={[
        styles.tag,
        important
          ? { backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.15)' : `${tint}1A`, borderColor: tint }
          : { backgroundColor: 'transparent', borderColor: Colors[colorScheme].icon },
      ]}>
      <ThemedText
        style={[styles.label, { color: important ? tint : Colors[colorScheme].icon }]}
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
  label: {
    fontSize: 11,
    lineHeight: 14,
  },
});
