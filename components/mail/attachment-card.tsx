import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Attachment } from '@/types/mail';

export function AttachmentCard({ attachment, onPress }: { attachment: Attachment; onPress?: () => void }) {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}>
      <View style={[styles.iconSquare, { backgroundColor: colorScheme === 'dark' ? 'rgba(239,68,68,0.16)' : '#FEE2E2' }]}>
        <IconSymbol name="doc.text.fill" size={20} color="#EF4444" />
      </View>
      <View style={styles.textColumn}>
        <ThemedText type="defaultSemiBold" style={styles.fileName} numberOfLines={1}>
          {attachment.fileName}
        </ThemedText>
        <ThemedText style={[styles.meta, { color: Colors[colorScheme].icon }]}>
          {attachment.fileSizeLabel} · {attachment.fileType}
        </ThemedText>
      </View>
      <IconSymbol name="arrow.down.to.line" size={18} color={Colors[colorScheme].icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  iconSquare: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  fileName: {
    fontSize: 14,
  },
  meta: {
    fontSize: 12,
  },
});
