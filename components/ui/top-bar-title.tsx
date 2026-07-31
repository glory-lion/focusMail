import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export function TopBarTitle() {
  return (
    <ThemedText type="defaultSemiBold" style={styles.text}>
      FocusMail
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 19,
  },
});
