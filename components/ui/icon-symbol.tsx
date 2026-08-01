// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'envelope.fill': 'mail',
  'gearshape.fill': 'settings',
  'checkmark.circle.fill': 'check-circle',
  'calendar': 'event',
  'clock.fill': 'schedule',
  'mappin.and.ellipse': 'place',
  'link': 'link',
  'square.and.pencil': 'edit',
  'xmark': 'close',
  'arrow.left': 'arrow-back',
  'person.crop.circle.fill': 'account-circle',
  'bolt.fill': 'bolt',
  'sparkles': 'auto-awesome',
  'rectangle.portrait.and.arrow.right': 'logout',
  'exclamationmark.triangle.fill': 'warning',
  'paperclip': 'attach-file',
  'chevron.up': 'keyboard-arrow-up',
  'chevron.down': 'keyboard-arrow-down',
  'exclamationmark.circle.fill': 'error',
  'doc.text.fill': 'description',
  'lock.fill': 'lock',
  'arrow.down.to.line': 'file-download',
  'archivebox': 'archive',
  'tray.and.arrow.up.fill': 'unarchive',
  'trash': 'delete-outline',
  'trash.slash': 'restore-from-trash',
  'ellipsis': 'more-vert',
  'envelope.badge': 'mark-email-unread',
  'arrow.up.right.square': 'open-in-new',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
