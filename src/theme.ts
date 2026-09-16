import { DynamicColorIOS, Platform, PlatformColor, type ColorValue } from 'react-native';

function adaptive(light: string, dark: string, androidAttr?: string): ColorValue {
  if (Platform.OS === 'ios') return DynamicColorIOS({ light, dark });
  if (Platform.OS === 'android' && androidAttr) return PlatformColor(androidAttr);
  return light;
}

/**
 * Runtime-safe color tokens.
 * Neutral surfaces/text react to light/dark appearance. Brand accents remain
 * controlled by Notre Table instead of inheriting a device or competitor color.
 */
export const colors = {
  cream: adaptive('#F6F2E9', '#111512', '?attr/colorBackground'),
  paper: adaptive('#FFFEFB', '#1A1F1B', '?attr/colorBackgroundFloating'),
  input: adaptive('#F2EEE6', '#202521', '?attr/colorBackgroundFloating'),
  ink: adaptive('#222824', '#F2F5F1', '?attr/textColorPrimary'),
  muted: adaptive('#70766F', '#B7BDB8', '?attr/textColorSecondary'),
  placeholder: adaptive('#A7AAA8', '#8D948E', '?attr/textColorHint'),
  border: adaptive('#E3DDD2', '#3A403B', '?attr/listDivider'),
  neutralSoft: adaptive('#EFEBE3', '#272C28', '?attr/colorControlHighlight'),
  sageSoft: adaptive('#E9F0E8', '#233027', '?attr/colorBackgroundFloating'),
  sageCard: adaptive('#F2F6F0', '#202A22', '?attr/colorBackgroundFloating'),
  sageBadge: adaptive('#E7EFE4', '#29362B', '?attr/colorBackgroundFloating'),
  sageBorder: adaptive('#B9C8B6', '#526555', '?attr/listDivider'),
  orangeSoft: adaptive('#FFF0E5', '#34261F', '?attr/colorBackgroundFloating'),
  track: adaptive('#E5E4DF', '#414641', '?attr/colorControlHighlight'),
  dot: adaptive('#D8D3CA', '#59605A', '?attr/textColorHint'),
  iconMuted: adaptive('#B3B6B4', '#8D948E', '?attr/textColorHint'),
  error: adaptive('#A34C3F', '#FF9A8B', '?attr/colorError'),
  warningText: adaptive('#8A4E42', '#E5A493', '?attr/textColorPrimary'),
  warningBorder: adaptive('#D8C6BE', '#6E524A', '?attr/listDivider'),

  sage: '#6F8C78',
  sageDark: '#3F6251',
  orange: '#C96F4B',
  onAccent: '#FFFFFF',
  onAccentMuted: '#EAF2E7',
} satisfies Record<string, ColorValue>;

export const radius = { sm: 12, md: 18, lg: 28 };
