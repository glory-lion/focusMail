import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { IconSymbol } from './icon-symbol';

export function TopBarTitle({ showMark = true }: { showMark?: boolean }) {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <View style={styles.container}>
      {showMark ? (
        <View
          style={[
            styles.mark,
            {
              backgroundColor: Colors[colorScheme].card,
              borderColor: Colors[colorScheme].border,
            },
          ]}>
          <IconSymbol name="envelope.fill" size={15} color={Colors[colorScheme].tint} />
        </View>
      ) : null}
      <ThemedText type="defaultSemiBold" style={styles.text}>
        FocusMail
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  mark: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: Fonts.semiBold,
    fontSize: 17,
    lineHeight: 23,
  },
});
