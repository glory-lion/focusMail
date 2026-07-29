import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

function formatDisplay(time: string): string {
  const [hourStr, minuteStr] = time.split(':');
  const hour = Number(hourStr);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minuteStr} ${period}`;
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return max;
  if (value > max) return min;
  return value;
}

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
  const tint = Colors[colorScheme].tint;
  const [hour, minute] = value.split(':').map(Number);

  const setHour = (next: number) => {
    onChange(`${String(clamp(next, 0, 23)).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
  };
  const setMinute = (next: number) => {
    onChange(`${String(hour).padStart(2, '0')}:${String(clamp(next, 0, 59)).padStart(2, '0')}`);
  };

  return (
    <View style={styles.row}>
      {label ? <ThemedText type="defaultSemiBold">{label}</ThemedText> : null}
      <View style={styles.stepperGroup}>
        <Stepper label={String(hour).padStart(2, '0')} onIncrement={() => setHour(hour + 1)} onDecrement={() => setHour(hour - 1)} tint={tint} />
        <ThemedText style={styles.colon}>:</ThemedText>
        <Stepper label={String(minute).padStart(2, '0')} onIncrement={() => setMinute(minute + 1)} onDecrement={() => setMinute(minute - 1)} tint={tint} />
        <ThemedText style={styles.display}>{formatDisplay(value)}</ThemedText>
      </View>
    </View>
  );
}

function Stepper({
  label,
  onIncrement,
  onDecrement,
  tint,
}: {
  label: string;
  onIncrement: () => void;
  onDecrement: () => void;
  tint: string;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable onPress={onDecrement} hitSlop={8}>
        <ThemedText style={[styles.stepperButton, { color: tint }]}>−</ThemedText>
      </Pressable>
      <ThemedText type="defaultSemiBold" style={styles.stepperValue}>
        {label}
      </ThemedText>
      <Pressable onPress={onIncrement} hitSlop={8}>
        <ThemedText style={[styles.stepperButton, { color: tint }]}>+</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 14,
    gap: 10,
  },
  stepperGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepper: {
    alignItems: 'center',
    gap: 2,
  },
  stepperButton: {
    fontSize: 20,
    fontFamily: Fonts.semiBold,
    paddingHorizontal: 6,
  },
  stepperValue: {
    fontSize: 16,
    minWidth: 28,
    textAlign: 'center',
  },
  colon: {
    fontSize: 18,
  },
  display: {
    marginLeft: 8,
    opacity: 0.6,
  },
});
