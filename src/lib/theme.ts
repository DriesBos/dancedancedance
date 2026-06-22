export type Theme = 'LIGHT' | 'DARK' | 'NIGHT';

export type ThemeOrientation = 'landscape' | 'portrait';
export type ThemePreference = 'light' | 'dark';

export const NIGHT_THEME_HOUR_END = 4;

export const LIGHT_THEME: Theme = 'LIGHT';
export const DARK_THEME: Theme = 'DARK';
export const NIGHT_THEME: Theme = 'NIGHT';
export const FALLBACK_THEME_PREFERENCE: ThemePreference = 'light';

export const LANDSCAPE_THEME_ORDER: Theme[] = [
  LIGHT_THEME,
  DARK_THEME,
  NIGHT_THEME,
];

export const PORTRAIT_THEME_ORDER: Theme[] = [
  LIGHT_THEME,
  DARK_THEME,
  NIGHT_THEME,
];

export const LANDSCAPE_DEFAULT_THEME: Theme = LIGHT_THEME;
export const PORTRAIT_DEFAULT_THEME: Theme = LIGHT_THEME;

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

export const getPreferredColorScheme = (): ThemePreference => {
  if (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark';
  }

  return FALLBACK_THEME_PREFERENCE;
};

export const getThemeForPreference = (preference: ThemePreference): Theme =>
  preference === 'dark' ? DARK_THEME : LIGHT_THEME;

export const isNightThemeHour = (hour: number) =>
  Number.isFinite(hour) && hour >= 0 && hour < NIGHT_THEME_HOUR_END;

export const getThemeOrder = (
  orientation = getViewportOrientation(),
): Theme[] => {
  if (orientation === 'portrait') {
    return PORTRAIT_THEME_ORDER;
  }

  return LANDSCAPE_THEME_ORDER;
};

export const getDefaultTheme = (
  preference = getPreferredColorScheme(),
): Theme => getThemeForPreference(preference);

export const getInitialThemeForHour = (
  hour: number,
  preference = getPreferredColorScheme(),
): Theme => {
  if (preference === 'dark' && isNightThemeHour(hour)) {
    return NIGHT_THEME;
  }

  return getDefaultTheme(preference);
};

export const getNextThemeForButtonCycle = (
  currentTheme: Theme,
  orientation = getViewportOrientation(),
): Theme => {
  const themeOrder = getThemeOrder(orientation);
  const currentIndex = themeOrder.indexOf(currentTheme);
  const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0;
  const nextIndex = (safeCurrentIndex + 1) % themeOrder.length;

  return themeOrder[nextIndex] ?? LIGHT_THEME;
};
