import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    lineHeight: 24,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 31,
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: Fonts.bold,
    fontSize: 19,
  },
  link: {
    fontFamily: Fonts.regular,
    lineHeight: 30,
    fontSize: 15,
    color: '#2563EB',
  },
});
