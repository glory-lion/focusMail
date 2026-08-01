import { StyleSheet, View } from 'react-native';

import { TimePicker } from '@/components/settings/time-picker';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function ScheduleDeliveryBox({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <View style={[styles.box, { backgroundColor: Colors[colorScheme].background }]}>
      <ThemedText style={[styles.label, { color: Colors[colorScheme].icon }]}>SCHEDULE DELIVERY</ThemedText>
      <View style={styles.row}>
        <ThemedText style={styles.text}>Deliver my morning briefing at:</ThemedText>
      </View>
      <TimePicker value={value} onChange={onChange} label={null} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  label: {
    fontFamily: Fonts.semiBold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
  },
  text: {
    fontSize: 13,
  },
});
