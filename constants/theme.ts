/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 */

import { Platform } from 'react-native';

const primary = '#2563EB';
const secondary = '#64748B';
const tertiary = '#F1F5F9';
const neutral = '#0F172A';

export const Palette = {
  primary,
  secondary,
  tertiary,
  neutral,
  iconBlue: '#4F6EF7',
  iconPurple: '#7C6FF0',
  critical: '#F87171',
  warning: '#FB923C',
  action: '#818CF8',
  panelBackground: '#0B0F19',
  importantRed: '#EF4444',
  unreadBackgroundLight: '#E1E9FA',
  unreadBackgroundDark: 'rgba(37,99,235,0.14)',
};

export const Colors = {
  light: {
    text: neutral,
    background: '#EEF2FC',
    tint: primary,
    icon: secondary,
    tabIconDefault: secondary,
    tabIconSelected: primary,
    card: '#fff',
    border: '#94A3B8',
  },
  dark: {
    text: '#F1F5F9',
    background: neutral,
    tint: primary,
    icon: '#94A3B8',
    tabIconDefault: '#94A3B8',
    tabIconSelected: primary,
    card: '#1E293B',
    border: 'rgba(241,245,249,0.28)',
  },
};

export const Fonts = {
  regular: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  semiBold: 'Geist_600SemiBold',
  bold: 'Geist_700Bold',
};

export const Mono = Platform.select({
  ios: 'ui-monospace',
  default: 'monospace',
  web: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
});
