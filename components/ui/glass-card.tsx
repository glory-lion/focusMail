import { BlurView } from 'expo-blur';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

type GlassCardProps = PropsWithChildren<{
  /** Outer wrapper only (margin, width, alignSelf, etc.) — this sits
   * *around* the blur surface, not inside it. Do NOT put padding here for
   * content spacing; it'll inset the visible glass area itself rather
   * than padding the content within it. Wrap children in their own View
   * with padding instead (see AttachmentCard/EmailListItem for the
   * pattern). */
  style?: StyleProp<ViewStyle>;
  /** Applied to the actual blurred surface, not the outer shadow wrapper —
   * use this for per-instance overrides like a colored left-accent border
   * or a tinted background, since `style` alone can't reach the BlurView. */
  surfaceStyle?: StyleProp<ViewStyle>;
  /** BlurView intensity, 1-100. Lower reads as more transparent/"thin
   * glass", higher as more frosted/opaque. */
  intensity?: number;
  radius?: number;
  /** Pass false for surfaces that shouldn't float (e.g. already inside
   * another glass surface) — keeps the border/tint but drops the shadow. */
  elevated?: boolean;
}>;

/**
 * A frosted-glass card: BlurView + a soft tint overlay + a light hairline
 * border (the classic glassmorphism "edge highlight") + a diffused shadow
 * for elevation. BlurView's borderRadius isn't applied reliably by the
 * native view itself on iOS/Android, so radius is set on this wrapping
 * style *and* combined with overflow: 'hidden' on the BlurView itself —
 * see https://docs.expo.dev/versions/v54.0.0/sdk/blur-view/.
 */
export function GlassCard({
  children,
  style,
  surfaceStyle,
  intensity = 40,
  radius = 20,
  elevated = true,
}: GlassCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  return (
    <View style={[elevated && styles.shadowWrap, { borderRadius: radius }, style]}>
      <BlurView
        intensity={intensity}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.blur,
          {
            borderRadius: radius,
            borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.6)',
            backgroundColor: isDark ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.38)',
          },
          surfaceStyle,
        ]}>
        {children}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 26,
    elevation: 5,
  },
  blur: {
    overflow: 'hidden',
    borderWidth: 1,
  },
});
