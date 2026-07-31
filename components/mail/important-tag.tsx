import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function ImportantTag({ important }: { important: boolean }) {
  const colorScheme = useColorScheme() ?? 'light';
  const red = Palette.importantRed;

  return (
    <ThemedView
      style={[
        styles.tag,
        important
          ? { backgroundColor: colorScheme === 'dark' ? 'rgba(239,68,68,0.18)' : `${red}1A`, borderColor: red }
          : { backgroundColor: 'transparent', borderColor: Colors[colorScheme].icon },
      ]}>
      <ThemedText
        style={[styles.label, { color: important ? red : Colors[colorScheme].icon }]}
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
    fontSize: 10,
    lineHeight: 14,
  },
});
