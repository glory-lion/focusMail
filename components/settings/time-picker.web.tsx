import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function TimePicker({
  value,
  onChange,
  label = 'Send at',
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string | null;
}) {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <View style={styles.row}>
      {label ? <ThemedText type="defaultSemiBold">{label}</ThemedText> : null}
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          fontSize: 16,
          padding: '6px 10px',
          borderRadius: 8,
          border: `1px solid ${Colors[colorScheme].icon}`,
          backgroundColor: 'transparent',
          color: Colors[colorScheme].text,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
});
