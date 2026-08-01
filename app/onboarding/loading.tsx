import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { mockEmails } from '@/data/mockEmails';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Provider } from '@/types/mail';

const PROGRESS_DURATION_MS = 1600;
const UNREAD_COUNT = mockEmails.filter((email) => !email.read).length;

export default function AnalyzingInboxScreen() {
  const { provider } = useLocalSearchParams<{ provider: Provider }>();
  const { connectAccount } = useAppState();
  const colorScheme = useColorScheme() ?? 'light';
  const [progress, setProgress] = useState(0.12);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await connectAccount(provider);
      const start = Date.now();

      const tick = () => {
        if (cancelled) return;
        const elapsed = Date.now() - start;
        const pct = Math.min(1, elapsed / PROGRESS_DURATION_MS);
        setProgress(0.12 + pct * 0.88);
        if (pct < 1) {
          frameRef.current = requestAnimationFrame(tick);
        } else {
          router.replace('/onboarding/notifications');
        }
      };
      frameRef.current = requestAnimationFrame(tick);
    })();

    return () => {
      cancelled = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
    // connectAccount is intentionally omitted: it's a new reference on every
    // context update (including the one this effect triggers), so including
    // it would restart the analyzing sequence in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.heading}>
          Analyzing Your Inbox
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: Colors[colorScheme].icon }]}>
          Our AI is identifying urgent items and drafting summaries. This usually takes less than a minute.
        </ThemedText>
      </View>

      <View style={styles.steps}>
        <View style={[styles.stepCard, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}>
          <View style={[styles.stepIcon, { backgroundColor: colorScheme === 'dark' ? 'rgba(37,99,235,0.18)' : '#EAF0FE' }]}>
            <IconSymbol name="doc.text.fill" size={20} color={Colors[colorScheme].tint} />
          </View>
          <View style={styles.stepText}>
            <ThemedText type="defaultSemiBold" style={styles.stepTitle}>
              Indexing Threads
            </ThemedText>
            <ThemedText style={[styles.stepSubtitle, { color: Colors[colorScheme].icon }]}>
              Checking {UNREAD_COUNT} unread messages
            </ThemedText>
          </View>
          <IconSymbol name="checkmark.circle.fill" size={20} color={Colors[colorScheme].tint} />
        </View>

        <View
          style={[
            styles.stepCard,
            styles.activeStepCard,
            { backgroundColor: colorScheme === 'dark' ? 'rgba(37,99,235,0.14)' : '#EAF0FE', borderColor: Colors[colorScheme].tint },
          ]}>
          <View style={styles.activeStepRow}>
            <View style={[styles.stepIcon, { backgroundColor: '#fff' }]}>
              <IconSymbol name="exclamationmark.circle.fill" size={20} color={Colors[colorScheme].tint} />
            </View>
            <View style={styles.stepText}>
              <ThemedText type="defaultSemiBold" style={styles.stepTitle}>
                Urgency Check
              </ThemedText>
              <ThemedText style={[styles.stepSubtitle, { color: Colors[colorScheme].icon }]}>
                Calculating your priority score…
              </ThemedText>
            </View>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.12)' : '#DCE6FB' }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.round(progress * 100)}%`, backgroundColor: Colors[colorScheme].tint },
              ]}
            />
          </View>
        </View>
      </View>

      <View style={[styles.footerPill, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}>
        <IconSymbol name="lock.fill" size={14} color={Colors[colorScheme].icon} />
        <ThemedText style={[styles.footerText, { color: Colors[colorScheme].icon }]}>
          Your data remains encrypted and private
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 32,
  },
  header: {
    gap: 10,
    alignItems: 'center',
  },
  heading: {
    fontSize: 25,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  steps: {
    gap: 14,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  activeStepCard: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
  },
  activeStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    fontSize: 15,
  },
  stepSubtitle: {
    fontSize: 12,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  footerPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 11,
  },
});
