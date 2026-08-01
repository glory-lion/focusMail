import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountRow } from '@/components/settings/account-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Provider } from '@/types/mail';

export default function ConnectAccountScreen() {
  const { account } = useAppState();
  const colorScheme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();

  const handleConnect = (provider: Provider) => {
    router.push({ pathname: '/onboarding/loading', params: { provider } });
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.topBar, { borderBottomColor: Colors[colorScheme].border }]}>
        <View style={styles.brand}>
          <IconSymbol name="sparkles" size={20} color={Colors[colorScheme].tint} />
          <ThemedText type="defaultSemiBold" style={[styles.brandName, { color: Colors[colorScheme].tint }]}>
            Focus Mail
          </ThemedText>
        </View>
        <ThemedText style={[styles.help, { color: Colors[colorScheme].icon }]}>Help</ThemedText>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.heading}>
            Connect Your Inbox
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: Colors[colorScheme].icon }]}>
            Focus Mail automatically prioritizes what matters.
          </ThemedText>
        </View>

        <View style={styles.rows}>
          <View style={[styles.card, { borderColor: Colors[colorScheme].border, backgroundColor: Colors[colorScheme].card }]}>
            <AccountRow
              provider="gmail"
              title="Connect Gmail"
              subtitle="Recommended for individuals"
              onPress={() => handleConnect('gmail')}
              trailing={
                account?.provider === 'gmail' && account.connected ? (
                  <IconSymbol name="checkmark.circle.fill" size={20} color={Colors[colorScheme].tint} />
                ) : (
                  <IconSymbol name="chevron.right" size={20} color={Colors[colorScheme].icon} />
                )
              }
            />
          </View>
          <View style={[styles.card, { borderColor: Colors[colorScheme].border, backgroundColor: Colors[colorScheme].card }]}>
            <AccountRow
              provider="outlook"
              title="Connect Outlook"
              subtitle="Preferred for corporate enterprise"
              disabled
              trailing={
                <View style={[styles.comingSoonPill, { backgroundColor: Colors[colorScheme].border }]}>
                  <ThemedText style={[styles.comingSoonText, { color: Colors[colorScheme].icon }]}>
                    Coming soon
                  </ThemedText>
                </View>
              }
            />
          </View>
        </View>

        <View style={[styles.noticeBox, { borderColor: Colors[colorScheme].border, backgroundColor: Colors[colorScheme].card }]}>
          <IconSymbol name="checkmark.circle.fill" size={18} color={Colors[colorScheme].tint} />
          <ThemedText style={[styles.noticeText, { color: Colors[colorScheme].icon }]}>
            We only access essential metadata for classification. Your data is{' '}
            <ThemedText type="defaultSemiBold" style={styles.noticeStrong}>
              encrypted
            </ThemedText>{' '}
            and automatically{' '}
            <ThemedText type="defaultSemiBold" style={styles.noticeStrong}>
              deleted after 7 days
            </ThemedText>
            .
          </ThemedText>
        </View>
      </View>

      <View style={styles.footer}>
        <ThemedText style={[styles.footerLinks, { color: Colors[colorScheme].icon }]}>
          Privacy Policy · Terms of Service · Security Details
        </ThemedText>
        <ThemedText style={[styles.footerCopy, { color: Colors[colorScheme].icon }]}>
          © 2026 Focus Mail. All rights reserved.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandName: {
    fontSize: 17,
  },
  help: {
    fontSize: 13,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 24,
  },
  header: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  heading: {
    fontSize: 27,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  rows: {
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  comingSoonPill: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  comingSoonText: {
    fontSize: 11,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 19,
  },
  noticeStrong: {
    fontSize: 12,
    lineHeight: 19,
  },
  footer: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 20,
  },
  footerLinks: {
    fontSize: 11,
  },
  footerCopy: {
    fontSize: 10,
  },
});
