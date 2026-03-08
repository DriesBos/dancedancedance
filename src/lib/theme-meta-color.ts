import { Theme } from '@/store/store';

const THEME_META_COLORS: Record<Theme, string> = {
  NIGHT: '#000000',
  TRON: '#000000',
  RADIANT: '#DAD9E0',
  SKY: '#B7D5FF',
  KERMIT: '#FFFFFF',
  LIGHT: '#E8E7E3',
  SEGMENTS: '#1A1A1A',
  KUSAMA: '#000000',
  SPACE: '#000000',
};

const SKY_VARIATION_META_COLORS: Record<string, string> = {
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
  if (theme === 'SKY') {
    const normalizedVariation = normalizeSkyVariation(skyVariation);
    return (
      SKY_VARIATION_META_COLORS[normalizedVariation] ?? THEME_META_COLORS.SKY
    );
  }

  return THEME_META_COLORS[theme] ?? '#FFFFFF';
};
