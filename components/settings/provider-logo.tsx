import { Image } from 'expo-image';

import type { Provider } from '@/types/mail';

const LOGO_SOURCES: Record<Provider, number> = {
  gmail: require('@/assets/logo/gmail.jpg'),
  outlook: require('@/assets/logo/outlook.jpg'),
};

export function ProviderLogo({ provider, size = 44 }: { provider: Provider; size?: number }) {
  return (
    <Image
      source={LOGO_SOURCES[provider]}
      style={{ width: size, height: size, borderRadius: 8 }}
      contentFit="cover"
    />
  );
}
