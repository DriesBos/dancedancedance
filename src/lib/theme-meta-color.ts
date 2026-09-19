import { Theme } from '@/lib/theme';

// Hex mirrors of --theme-bg / --theme-blok in vars.sass. Safari paints the
// browser chrome and safe areas from <meta name="theme-color">, so it has to
// follow whichever surface reaches the viewport edge: the bloks in fullscreen,
// the body background otherwise.
export const THEME_META_COLORS: Record<Theme, { bg: string; blok: string }> = {
  LIGHT: { bg: '#D6D4CD', blok: '#E8E7E3' },
  DARK: { bg: '#000000', blok: '#141414' },
  NIGHT: { bg: '#000000', blok: '#000000' },
};

export const getThemeMetaColor = (theme: Theme, fullscreen: boolean) =>
  THEME_META_COLORS[theme][fullscreen ? 'blok' : 'bg'];
