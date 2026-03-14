export type Theme =
  | 'NIGHT'
  | 'TRON'
  | 'RADIANT'
  | 'SKY'
  | 'KERMIT'
  | 'LIGHT'
  | 'SEGMENTS'
  | 'KUSAMA';

const WIDE_THEME_ORDER_BREAKPOINT_PX = 1500;
export const INITIAL_THEME_MOBILE_BREAKPOINT_PX = 770;
export const NIGHT_THEME_HOUR_END = 5;

export const NIGHT_THEME: Theme = 'NIGHT';
export const THEMES_WITH_INITIAL_INTRO: Theme[] = ['RADIANT'];

export const THEME_ORDER: Theme[] = [
  'RADIANT',
  'TRON',
  'SKY',
  'LIGHT',
  'KUSAMA',
  'SEGMENTS',
  'NIGHT',
  'KERMIT',
];

const WIDE_THEME_ORDER: Theme[] = [
  'RADIANT',
  'TRON',
  'SKY',
  'LIGHT',
  'KUSAMA',
  'SEGMENTS',
  'NIGHT',
  'KERMIT',
];

const NON_SELECTABLE_THEMES: Theme[] = ['KERMIT'];

// Keep some themes available in the codebase, but hide them from user theme cycling for now.
export const THEME_BUTTON_ORDER: Theme[] = THEME_ORDER.filter(
  (theme) => !NON_SELECTABLE_THEMES.includes(theme),
);
const WIDE_THEME_BUTTON_ORDER: Theme[] = WIDE_THEME_ORDER.filter(
  (theme) => !NON_SELECTABLE_THEMES.includes(theme),
);

export const DEFAULT_THEME: Theme = 'RADIANT';

const getViewportWidth = (): number | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.innerWidth;
};

export const shouldRunInitialIntroForTheme = (theme: Theme) =>
  THEMES_WITH_INITIAL_INTRO.includes(theme);

export const getThemeOrder = (viewportWidth = getViewportWidth()): Theme[] => {
  if (viewportWidth !== null && viewportWidth > WIDE_THEME_ORDER_BREAKPOINT_PX) {
    return WIDE_THEME_ORDER;
  }

  return THEME_ORDER;
};

export const getThemeButtonOrder = (
  viewportWidth = getViewportWidth(),
): Theme[] => {
  if (viewportWidth !== null && viewportWidth > WIDE_THEME_ORDER_BREAKPOINT_PX) {
    return WIDE_THEME_BUTTON_ORDER;
  }

  return THEME_BUTTON_ORDER;
};

export const getInitialThemeForHour = (hour: number): Theme => {
  if (hour >= 0 && hour < NIGHT_THEME_HOUR_END) {
    return NIGHT_THEME;
  }

  return DEFAULT_THEME;
};

export const getNextThemeForButtonCycle = (currentTheme: Theme): Theme => {
  const themeOrder = getThemeOrder();
  const themeButtonOrder = getThemeButtonOrder();
  const currentIndex = themeOrder.indexOf(currentTheme);
  const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0;

  for (let step = 1; step <= themeOrder.length; step += 1) {
    const candidate = themeOrder[(safeCurrentIndex + step) % themeOrder.length];
    if (themeButtonOrder.includes(candidate)) {
      return candidate;
    }
  }

  return themeButtonOrder[0] ?? DEFAULT_THEME;
};
