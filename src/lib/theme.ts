export type Theme =
  | 'NIGHT'
  | 'TRON'
  | 'RADIANT'
  | 'SKY'
  | 'KERMIT'
  | 'LIGHT'
  | 'SEGMENTS'
  | 'KUSAMA';

const FALLBACK_THEME: Theme = 'RADIANT';

export const NIGHT_THEME: Theme = 'NIGHT';

export const THEME_ORDER: Theme[] = [
  'TRON',
  'RADIANT',
  'SKY',
  'LIGHT',
  'KUSAMA',
  'SEGMENTS',
  'NIGHT',
  'KERMIT',
];

// Keep KERMIT available in the codebase, but hide it from user theme cycling for now.
export const THEME_BUTTON_ORDER: Theme[] = THEME_ORDER.filter(
  (theme) => theme !== 'KERMIT',
);

export const DEFAULT_THEME: Theme = THEME_ORDER[0] ?? FALLBACK_THEME;

export const getInitialThemeForHour = (hour: number): Theme => {
  if (hour >= 0 && hour < 5) {
    return NIGHT_THEME;
  }

  return DEFAULT_THEME;
};

export const getNextThemeForButtonCycle = (currentTheme: Theme): Theme => {
  const currentIndex = THEME_ORDER.indexOf(currentTheme);
  const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0;

  for (let step = 1; step <= THEME_ORDER.length; step += 1) {
    const candidate =
      THEME_ORDER[(safeCurrentIndex + step) % THEME_ORDER.length];
    if (THEME_BUTTON_ORDER.includes(candidate)) {
      return candidate;
    }
  }

  return THEME_BUTTON_ORDER[0] ?? DEFAULT_THEME;
};
