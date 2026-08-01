import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette } from '@/constants/theme';

export function HeadsUpBanner({ count }: { count: number }) {
  if (count === 0) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <IconSymbol name="exclamationmark.triangle.fill" size={18} color={Palette.critical} />
      <ThemedText style={styles.text} lightColor={Palette.critical} darkColor={Palette.critical}>
        <ThemedText type="defaultSemiBold" lightColor={Palette.critical} darkColor={Palette.critical}>
          {count} important emails
        </ThemedText>{' '}
        need your attention
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.35)',
    backgroundColor: 'rgba(248,113,113,0.08)',
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
});
