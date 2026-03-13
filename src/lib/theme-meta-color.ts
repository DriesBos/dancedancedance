import { Theme } from '@/lib/theme';

export const THEME_META_COLORS: Record<Theme, string> = {
  NIGHT: '#000000',
  PERLIN: '#050109',
  TRON: '#000000',
  CYPHER: '#020607',
  RADIANT: '#DAD9E0',
  SKY: 'transparent',
  KERMIT: '#FFFFFF',
  LIGHT: '#E8E7E3',
  SEGMENTS: '#1A1A1A',
  KUSAMA: '#000000',
};

export const getThemeMetaColor = (theme: Theme): string =>
  THEME_META_COLORS[theme] ?? '#FFFFFF';
