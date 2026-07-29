import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Provider } from '@/types/mail';

const LABELS: Record<Provider, string> = {
  gmail: 'Connect Gmail',
  outlook: 'Connect Outlook',
};

export function ProviderConnectButton({
  provider,
  connected,
  onConnect,
}: {
  provider: Provider;
  connected: boolean;
  onConnect: () => Promise<void>;
}) {
  const [isConnecting, setIsConnecting] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const tint = Colors[colorScheme].tint;

  const handlePress = async () => {
    if (connected || isConnecting) return;
    setIsConnecting(true);
    try {
      await onConnect();
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.button,
        { borderColor: connected ? tint : Colors[colorScheme].icon },
        connected && { backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : `${tint}14` },
      ]}>
      <View style={styles.left}>
        <IconSymbol name="envelope.fill" size={20} color={connected ? tint : Colors[colorScheme].text} />
        <ThemedText type="defaultSemiBold">{LABELS[provider]}</ThemedText>
      </View>
      {isConnecting ? (
        <ActivityIndicator color={tint} />
      ) : connected ? (
        <IconSymbol name="checkmark.circle.fill" size={20} color={tint} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
