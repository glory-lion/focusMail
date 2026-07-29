import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ProviderConnectButton } from '@/components/onboarding/provider-connect-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppState } from '@/context/app-state';
import type { Provider } from '@/types/mail';

export default function ConnectAccountScreen() {
  const { account, connectAccount } = useAppState();

  const handleConnect = async (provider: Provider) => {
    await connectAccount(provider);
    router.push('/onboarding/notifications');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Connect your inbox</ThemedText>
        <ThemedText style={styles.subtitle}>
          Focus Mail summarizes your inbox and flags what actually matters. Connect an account to get
          started.
        </ThemedText>
      </View>

      <View style={styles.buttons}>
        <ProviderConnectButton
          provider="gmail"
          connected={account?.provider === 'gmail' && account.connected}
          onConnect={() => handleConnect('gmail')}
        />
        <ProviderConnectButton
          provider="outlook"
          connected={account?.provider === 'outlook' && account.connected}
          onConnect={() => handleConnect('outlook')}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 40,
  },
  header: {
    gap: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    opacity: 0.75,
  },
  buttons: {
    gap: 12,
  },
});
