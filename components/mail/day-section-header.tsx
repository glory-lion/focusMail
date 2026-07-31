import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function DaySectionHeader({ label, date }: { label: string; date: string }) {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <View style={styles.container}>
      <ThemedText type="defaultSemiBold" style={styles.label}>
        {label}
      </ThemedText>
      <ThemedText style={[styles.date, { color: Colors[colorScheme].icon }]}>{date}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  label: {
    fontSize: 14,
  },
  date: {
    fontSize: 13,
  },
});
