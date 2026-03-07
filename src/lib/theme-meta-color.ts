import { Theme } from '@/store/store';

const THEME_META_COLORS: Record<Theme, string> = {
  'NIGHT MODE': '#000000',
  TRON: '#000000',
  RADIANT: '#DAD9E0',
  'RADIANT DARK': '#000000',
  AUGURIES: '#B7D5FF',
  KERMIT: '#FFFFFF',
  LIGHT: '#E8E7E3',
  DARK: '#1A1A1A',
  KUSAMA: '#000000',
  DOTS: '#000000',
};

const AUGURIES_SKY_META_COLORS: Record<string, string> = {
  morning: '#6D79AF',
  dawn: '#F5B38B',
  noon: '#B7D5FF',
  sunset: '#FF8A5B',
  dusk: '#8E5CA5',
  evening: '#2B3D74',
};

const normalizeSkyVariation = (skyVariation?: string): string =>
  (skyVariation ?? '')
    .trim()
    .toLowerCase()
    .replace(/^['"]|['"]$/g, '');

export const getThemeMetaColor = (
  theme: Theme,
  skyVariation?: string,
): string => {
  if (theme === 'AUGURIES') {
    const normalizedVariation = normalizeSkyVariation(skyVariation);
    return (
      AUGURIES_SKY_META_COLORS[normalizedVariation] ??
      THEME_META_COLORS.AUGURIES
    );
  }

  return THEME_META_COLORS[theme] ?? '#FFFFFF';
};
