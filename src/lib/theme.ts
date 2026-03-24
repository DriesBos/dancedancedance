export type Theme =
  | 'NIGHT'
  | 'TRON'
  | 'RADIANT'
  | 'SKY'
  | 'KERMIT'
  | 'LIGHT'
  | 'SEGMENTS'
  | 'KUSAMA';

export type ThemeOrientation = 'landscape' | 'portrait';

export const NIGHT_THEME_HOUR_END = 5;

export const NIGHT_THEME: Theme = 'NIGHT';
export const DEVELOPMENT_DEFAULT_THEME: Theme = 'LIGHT';
export const THEMES_WITH_INITIAL_INTRO: Theme[] = ['RADIANT', 'TRON'];

export const LANDSCAPE_THEME_ORDER: Theme[] = [
  'TRON',
  'RADIANT',
  'SKY',
  'LIGHT',
  'KUSAMA',
  'SEGMENTS',
  'NIGHT',
  'KERMIT',
];

export const PORTRAIT_THEME_ORDER: Theme[] = [
  'TRON',
  'RADIANT',
  'SKY',
  'LIGHT',
  'KUSAMA',
  'SEGMENTS',
  'NIGHT',
  'KERMIT',
];

const NON_SELECTABLE_THEMES: Theme[] = ['KERMIT'];

// Keep some themes available in the codebase, but hide them from user theme cycling for now.
export const LANDSCAPE_THEME_BUTTON_ORDER: Theme[] =
  LANDSCAPE_THEME_ORDER.filter(
    (theme) => !NON_SELECTABLE_THEMES.includes(theme),
  );
export const PORTRAIT_THEME_BUTTON_ORDER: Theme[] = PORTRAIT_THEME_ORDER.filter(
  (theme) => !NON_SELECTABLE_THEMES.includes(theme),
);

export const LANDSCAPE_DEFAULT_THEME: Theme = 'TRON';
export const PORTRAIT_DEFAULT_THEME: Theme = 'TRON';
export const IS_DEVELOPMENT =
  process.env.NODE_ENV === 'development';

const getViewportOrientation = (): ThemeOrientation => {
  if (typeof window === 'undefined') {
    return 'landscape';
  }

  if (typeof window.matchMedia === 'function') {
    return window.matchMedia('(orientation: portrait)').matches
      ? 'portrait'
      : 'landscape';
  }

  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
};

export const shouldRunInitialIntroForTheme = (theme: Theme) =>
  THEMES_WITH_INITIAL_INTRO.includes(theme);

export const getThemeOrder = (
  orientation = getViewportOrientation(),
): Theme[] => {
  if (orientation === 'portrait') {
    return PORTRAIT_THEME_ORDER;
  }

  return LANDSCAPE_THEME_ORDER;
};

export const getThemeButtonOrder = (
  orientation = getViewportOrientation(),
): Theme[] => {
  if (orientation === 'portrait') {
    return PORTRAIT_THEME_BUTTON_ORDER;
  }

  return LANDSCAPE_THEME_BUTTON_ORDER;
};

export const getDefaultTheme = (
  orientation = getViewportOrientation(),
): Theme => {
  if (IS_DEVELOPMENT) {
    return DEVELOPMENT_DEFAULT_THEME;
  }

  if (orientation === 'portrait') {
    return PORTRAIT_DEFAULT_THEME;
  }

  return LANDSCAPE_DEFAULT_THEME;
};

export const getInitialThemeForHour = (
  hour: number,
  orientation = getViewportOrientation(),
): Theme => {
  if (IS_DEVELOPMENT) {
    return DEVELOPMENT_DEFAULT_THEME;
  }

  if (hour >= 0 && hour < NIGHT_THEME_HOUR_END) {
    return NIGHT_THEME;
  }

  return getDefaultTheme(orientation);
};

export const getNextThemeForButtonCycle = (
  currentTheme: Theme,
  orientation = getViewportOrientation(),
): Theme => {
  const themeOrder = getThemeOrder(orientation);
  const themeButtonOrder = getThemeButtonOrder(orientation);
  const currentIndex = themeOrder.indexOf(currentTheme);
  const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0;

  for (let step = 1; step <= themeOrder.length; step += 1) {
    const candidate = themeOrder[(safeCurrentIndex + step) % themeOrder.length];
    if (themeButtonOrder.includes(candidate)) {
      return candidate;
    }
  }

  return themeButtonOrder[0] ?? getDefaultTheme(orientation);
};
