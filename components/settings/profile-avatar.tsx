import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '');
  return initials.join('') || '?';
}

export function ProfileAvatar({
  name,
  avatarUrl,
  size = 40,
  ring = false,
}: {
  name: string;
  avatarUrl?: string;
  size?: number;
  ring?: boolean;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const tint = Colors[colorScheme].tint;

  const avatar = avatarUrl ? (
    <Image source={{ uri: avatarUrl }} style={{ width: size, height: size, borderRadius: size / 2 }} />
  ) : (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.15)' : `${tint}22`,
        },
      ]}>
      <ThemedText style={[styles.initials, { color: tint, fontSize: size * 0.38 }]} type="defaultSemiBold">
        {initialsFor(name)}
      </ThemedText>
    </View>
  );

  if (!ring) return avatar;

  const ringPadding = Math.max(3, Math.round(size * 0.045));
  return (
    <View
      style={[
        styles.ring,
        {
          padding: ringPadding,
          borderRadius: (size + ringPadding * 2) / 2,
          borderColor: colorScheme === 'dark' ? 'rgba(37,99,235,0.35)' : '#DCE7FB',
        },
      ]}>
      {avatar}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    lineHeight: undefined,
  },
  ring: {
    borderWidth: 3,
  },
});
