import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ToggleSwitch } from '@/components/settings/toggle-switch';
import { GlassCard } from '@/components/ui/glass-card';
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
    <GlassCard radius={16}>
      <View style={styles.card}>
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
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    gap: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
  },
  description: {
    fontSize: 13,
    lineHeight: 21,
  },
});
