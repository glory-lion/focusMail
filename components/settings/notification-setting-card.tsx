import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ToggleSwitch } from '@/components/settings/toggle-switch';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function NotificationSettingCard({
  title,
  description,
  value,
  onValueChange,
  children,
}: {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  children?: React.ReactNode;
}) {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <View style={[styles.card, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}>
      <View style={styles.topRow}>
        <View style={styles.textColumn}>
          <ThemedText type="defaultSemiBold" style={styles.title}>
            {title}
          </ThemedText>
        </View>
        <ToggleSwitch value={value} onValueChange={onValueChange} />
      </View>
      <ThemedText style={[styles.description, { color: Colors[colorScheme].icon }]}>{description}</ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    lineHeight: 23,
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
  },
});
