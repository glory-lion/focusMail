import { StyleSheet, View } from 'react-native';

import { TimePicker } from '@/components/settings/time-picker';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function ScheduleDeliveryBox({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <View
      style={[
        styles.box,
        {
          backgroundColor: colorScheme === 'dark' ? Palette.surfaceMutedDark : Palette.surfaceMutedLight,
          borderColor: Colors[colorScheme].border,
        },
      ]}>
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
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 8,
  },
  label: {
    fontFamily: Fonts.semiBold,
    fontSize: 10,
    lineHeight: 14,
  },
  row: {
    flexDirection: 'row',
  },
  text: {
    fontSize: 13,
    lineHeight: 18,
  },
});
