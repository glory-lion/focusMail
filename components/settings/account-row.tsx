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
  disabled = false,
}: {
  provider: Provider;
  title: string;
  subtitle: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress || disabled}
      style={({ pressed }) => [styles.row, disabled && styles.disabled, pressed && onPress && !disabled && styles.pressed]}>
      <ProviderLogo provider={provider} size={42} />
      <View style={styles.textColumn}>
        <ThemedText type="defaultSemiBold" style={styles.title} numberOfLines={1}>
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
    gap: 15,
    paddingVertical: 16,
  },
  pressed: {
    opacity: 0.65,
  },
  disabled: {
    opacity: 0.45,
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
});
