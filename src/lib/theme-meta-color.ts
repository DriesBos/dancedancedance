import { Theme } from '@/lib/theme';

export const THEME_META_COLORS: Record<Theme, string> = {
  LIGHT: '#E8E7E3',
  DARK: '#1A1A1A',
  NIGHT: '#000000',
};

export const getThemeMetaColor = (theme: Theme): string =>
  THEME_META_COLORS[theme] ?? '#FFFFFF';
