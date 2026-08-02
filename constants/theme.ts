/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 */

import { Platform } from 'react-native';

const primary = '#0E7490';
const secondary = '#667085';
const tertiary = '#F3F6F8';
const neutral = '#101828';

export const Palette = {
  primary,
  secondary,
  tertiary,
  neutral,
  iconBlue: '#0891B2',
  iconPurple: '#7C3AED',
  critical: '#E11D48',
  warning: '#F59E0B',
  action: '#14B8A6',
  panelBackground: '#0B1220',
  importantRed: '#E11D48',
  unreadBackgroundLight: '#E8F7FA',
  unreadBackgroundDark: 'rgba(34,211,238,0.12)',
  tintSoftLight: '#DDF4F8',
  tintSoftDark: 'rgba(34,211,238,0.14)',
  surfaceLight: '#FFFFFF',
  surfaceDark: '#172033',
  surfaceMutedLight: '#F7FAFC',
  surfaceMutedDark: 'rgba(255,255,255,0.055)',
  borderLight: '#D7DEE8',
  borderDark: 'rgba(226,232,240,0.16)',
};

export const Colors = {
  light: {
    text: neutral,
    background: '#F6F8FB',
    tint: primary,
    icon: secondary,
    tabIconDefault: secondary,
    tabIconSelected: primary,
    card: Palette.surfaceLight,
    border: Palette.borderLight,
  },
  dark: {
    text: '#F8FAFC',
    background: '#0B1220',
    tint: '#22D3EE',
    icon: '#98A2B3',
    tabIconDefault: '#667085',
    tabIconSelected: '#22D3EE',
    card: Palette.surfaceDark,
    border: Palette.borderDark,
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
