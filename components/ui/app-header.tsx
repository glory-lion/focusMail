import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TopBarTitle } from '@/components/ui/top-bar-title';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * The standard app chrome: fixed-height bar with a background fill, a
 * hairline bottom border, and the "FocusMail" wordmark centered absolutely
 * (so it stays centered regardless of how wide `leading`/`trailing` are).
 * Used by the home, mail detail, and profile screens so navigating between
 * them doesn't jump the header around.
 */
export function AppHeader({ leading, trailing }: { leading?: ReactNode; trailing?: ReactNode }) {
  const colorScheme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        {
          height: 64 + insets.top,
          paddingTop: insets.top,
          backgroundColor: Colors[colorScheme].background,
          borderBottomColor: Colors[colorScheme].border,
        },
      ]}>
      <View pointerEvents="none" style={styles.centerTitle}>
        <TopBarTitle showMark={false} />
      </View>
      <View style={styles.slot}>{leading}</View>
      <View style={[styles.slot, styles.trailingSlot]}>{trailing}</View>
    </View>
  );
}

/** The bordered, card-tinted square icon button used for header actions
 * (back, archive, delete, etc.) — kept as one component so every header
 * action button looks identical. */
export function HeaderIconButton({
  onPress,
  children,
}: PropsWithChildren<{ onPress: () => void }>) {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.iconButton,
        {
          backgroundColor: Colors[colorScheme].card,
          borderColor: Colors[colorScheme].border,
        },
        pressed && styles.iconButtonPressed,
      ]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 18,
  },
  centerTitle: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  trailingSlot: {
    justifyContent: 'flex-end',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    opacity: 0.72,
  },
});
