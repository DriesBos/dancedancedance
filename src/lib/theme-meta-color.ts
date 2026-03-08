import { Theme } from '@/store/store';

const THEME_META_COLORS: Record<Theme, string> = {
  NIGHT: '#000000',
  TRON: '#000000',
  RADIANT: '#DAD9E0',
  SKY: '#BFC4DE',
  KERMIT: '#FFFFFF',
  LIGHT: '#E8E7E3',
  SEGMENTS: '#1A1A1A',
  KUSAMA: '#000000',
  SPACE: '#000000',
};

export const getThemeMetaColor = (theme: Theme): string =>
  THEME_META_COLORS[theme] ?? '#FFFFFF';
