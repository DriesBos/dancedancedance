export type Locale = 'en' | 'ja';

export const LOCALE_STORAGE_KEY = 'ddd-locale';

const translations = {
  'nav.work': { en: 'Work', ja: 'ワーク' },
  'nav.about': { en: 'About', ja: 'アバウト' },
} as const;

export type TranslationKey = keyof typeof translations;

export const t = (key: TranslationKey, locale: Locale): string => {
  return translations[key][locale];
};

const DEV_LOCALE_OVERRIDE: Locale | null =
  process.env.NODE_ENV === 'development' ? 'ja' : null;

export const detectInitialLocale = (): Locale => {
  if (typeof window === 'undefined') return 'en';

  if (DEV_LOCALE_OVERRIDE) return DEV_LOCALE_OVERRIDE;

  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === 'en' || stored === 'ja') return stored;
  } catch {
    // localStorage may be unavailable (private browsing, security policies)
  }

  return navigator.language?.startsWith('ja') ? 'ja' : 'en';
};

export const persistLocale = (locale: Locale): void => {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // localStorage may be unavailable
  }
};
