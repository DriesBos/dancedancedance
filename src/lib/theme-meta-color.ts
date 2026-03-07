import { Theme } from '@/store/store';

const THEME_META_COLORS: Record<Theme, string> = {
  NIGHTMODE: '#000000',
  TRON: '#000000',
  DONJUDD: '#DAD9E0',
  AUGURIES: '#0D111A',
  STEDELIJK: '#FFFFFF',
  LIGHT: '#E8E7E3',
  DARK: '#1A1A1A',
  KUSAMA: '#000000',
  DOTS: '#000000',
};

export const getThemeMetaColor = (theme: Theme): string =>
  THEME_META_COLORS[theme] ?? '#FFFFFF';
