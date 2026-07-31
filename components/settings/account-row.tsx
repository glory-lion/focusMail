import { Pressable, StyleSheet, View } from 'react-native';

import { ProviderLogo } from '@/components/settings/provider-logo';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Provider } from '@/types/mail';

export function AccountRow({
  provider,
  title,
  subtitle,
  trailing,
  onPress,
}: {
  provider: Provider;
  title: string;
  subtitle: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
}) {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.row, pressed && onPress && styles.pressed]}>
      <ProviderLogo provider={provider} size={44} />
      <View style={styles.textColumn}>
        <ThemedText type="defaultSemiBold" style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: Colors[colorScheme].icon }]} numberOfLines={1}>
          {subtitle}
        </ThemedText>
      </View>
      {trailing}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  pressed: {
    opacity: 0.65,
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
  },
  subtitle: {
    fontSize: 12,
  },
});
