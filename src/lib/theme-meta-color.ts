import { Theme } from '@/store/store';

const THEME_META_COLORS: Record<Theme, string> = {
  'NIGHT MODE': '#000000',
  TRON: '#000000',
  RADIANT: '#DAD9E0',
  'RADIANT DARK': '#000000',
  AUGURIES: '#0D111A',
  KERMIT: '#FFFFFF',
  LIGHT: '#E8E7E3',
  DARK: '#1A1A1A',
  KUSAMA: '#000000',
  DOTS: '#000000',
};

export const getThemeMetaColor = (theme: Theme): string =>
  THEME_META_COLORS[theme] ?? '#FFFFFF';
