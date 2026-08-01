import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Period = 'AM' | 'PM';

function parse(value: string): { hour24: number; minute: number } {
  const [hour24, minute] = value.split(':').map(Number);
  return { hour24, minute };
}

function toDisplayHour(hour24: number): number {
  const hour = hour24 % 12;
  return hour === 0 ? 12 : hour;
}

function format(hour24: number, minute: number): string {
  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
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
  const { hour24, minute } = parse(value);
  const period: Period = hour24 >= 12 ? 'PM' : 'AM';
  const displayHour = toDisplayHour(hour24);

  const shiftMinutes = (delta: number) => {
    const total = (((hour24 * 60 + minute + delta) % 1440) + 1440) % 1440;
    onChange(format(Math.floor(total / 60), total % 60));
  };

  const setPeriod = (next: Period) => {
    if (next === period) return;
    const nextHour24 = next === 'PM' ? (hour24 + 12) % 24 : (hour24 - 12 + 24) % 24;
    onChange(format(nextHour24, minute));
  };

  return (
    <View style={styles.wrapper}>
      {label ? <ThemedText type="defaultSemiBold">{label}</ThemedText> : null}
      <View style={styles.row}>
        <View
          style={[
            styles.timeBox,
            { backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].border },
          ]}>
          <ThemedText type="title" style={styles.timeText}>
            {String(displayHour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
          </ThemedText>
        </View>

        <View style={styles.stepper}>
          <Pressable onPress={() => shiftMinutes(30)} hitSlop={6}>
            <IconSymbol name="chevron.up" size={20} color={tint} />
          </Pressable>
          <Pressable onPress={() => shiftMinutes(-30)} hitSlop={6}>
            <IconSymbol name="chevron.down" size={20} color={Colors[colorScheme].icon} />
          </Pressable>
        </View>

        <View style={[styles.periodToggle, { borderColor: Colors[colorScheme].border }]}>
          <Pressable
            onPress={() => setPeriod('AM')}
            style={[styles.periodOption, period === 'AM' && { backgroundColor: tint }]}>
            <ThemedText
              type="defaultSemiBold"
              style={styles.periodLabel}
              lightColor={period === 'AM' ? '#fff' : Colors[colorScheme].text}
              darkColor={period === 'AM' ? '#fff' : Colors[colorScheme].text}>
              AM
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setPeriod('PM')}
            style={[styles.periodOption, period === 'PM' && { backgroundColor: tint }]}>
            <ThemedText
              type="defaultSemiBold"
              style={styles.periodLabel}
              lightColor={period === 'PM' ? '#fff' : Colors[colorScheme].text}
              darkColor={period === 'PM' ? '#fff' : Colors[colorScheme].text}>
              PM
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeBox: {
    width: 96,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  timeText: {
    fontSize: 21,
    lineHeight: 26,
    fontVariant: ['tabular-nums'],
  },
  stepper: {
    gap: 2,
  },
  periodToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  periodOption: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  periodLabel: {
    fontSize: 12,
  },
});
