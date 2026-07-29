import { StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { ComponentProps } from 'react';

export function NotificationSettingCard({
  icon,
  iconBackground,
  title,
  description,
  value,
  onValueChange,
  children,
}: {
  icon: ComponentProps<typeof IconSymbol>['name'];
  iconBackground: string;
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
        <View style={[styles.iconSquare, { backgroundColor: iconBackground }]}>
          <IconSymbol name={icon} size={22} color="#fff" />
        </View>
        <View style={styles.textColumn}>
          <ThemedText type="defaultSemiBold" style={styles.title}>
            {title}
          </ThemedText>
        </View>
        <Switch value={value} onValueChange={onValueChange} trackColor={{ true: Colors[colorScheme].tint }} />
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
  iconSquare: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  title: {
    fontSize: 18,
    lineHeight: 23,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
});
