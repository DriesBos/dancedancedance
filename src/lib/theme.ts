export type Theme = 'LIGHT' | 'DARK' | 'NIGHT';

export type ThemePreference = 'light' | 'dark';

export const NIGHT_THEME_HOUR_END = 4;

export const LIGHT_THEME: Theme = 'LIGHT';
export const DARK_THEME: Theme = 'DARK';
export const NIGHT_THEME: Theme = 'NIGHT';
export const FALLBACK_THEME_PREFERENCE: ThemePreference = 'light';

export const THEME_ORDER: Theme[] = [
  LIGHT_THEME,
  DARK_THEME,
  NIGHT_THEME,
];

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
): Theme => {
  const currentIndex = THEME_ORDER.indexOf(currentTheme);
  const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0;
  const nextIndex = (safeCurrentIndex + 1) % THEME_ORDER.length;

  return THEME_ORDER[nextIndex] ?? LIGHT_THEME;
};
