export type Locale = 'en' | 'ja';

export const LOCALE_STORAGE_KEY = 'ddd-locale';

const translations = {
  'nav.work': { en: 'Work', ja: '制作実績' },
  'nav.about': { en: 'About', ja: 'プロフィール' },
  'newsletter.label': { en: 'Newsletter', ja: 'ニュースレター' },
  'newsletter.submit': { en: 'Submit', ja: '登録する' },
  'newsletter.submitting': { en: 'Submitting..', ja: '登録中..' },
  'action.schedule': {
    en: 'Schedule a discovery call',
    ja: 'ミーティングを予約する',
  },
  'action.start': { en: 'Start your project', ja: '制作の相談をする' },
  'head.subtitle': {
    en: 'Creative Developer',
    ja: 'デザイナー デベロッパー',
  },
  'theming.theme': { en: 'THEME:', ja: 'テーマ:' },
  'theming.layout': { en: 'LAYOUT:', ja: 'レイアウト:' },
  'filter.year': { en: 'year', ja: '年' },
  'filter.work': { en: 'selected work', ja: '制作実績' },
  'filter.work.mobile': { en: 'Selected work', ja: '制作実績' },
  'filter.type': { en: 'type of work', ja: 'カテゴリ' },
  'slider.featured': { en: 'Featured work', ja: '主な実績' },
  'cursor.talk': { en: "Let's talk", ja: '相談してみる' },
  'cursor.schedule': {
    en: 'Schedule a discovery call',
    ja: 'ミーティングを予約する',
  },
  'cursor.mail': { en: 'infrequent but spirited mail', ja: '不定期配信' },
} as const;

export type TranslationKey = keyof typeof translations;

export const t = (key: TranslationKey, locale: Locale): string => {
  return translations[key][locale];
};

const getBrowserLocale = (): Locale => {
  const preferredLanguage = navigator.languages?.[0] ?? navigator.language;
  return preferredLanguage?.startsWith('ja') ? 'ja' : 'en';
};

export const detectInitialLocale = (): Locale => {
  if (typeof window === 'undefined') return 'en';

  const browserLocale = getBrowserLocale();

  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === 'en') return 'en';
    if (stored === 'ja' && browserLocale === 'ja') return 'ja';
  } catch {
    // localStorage may be unavailable (private browsing, security policies)
  }

  return browserLocale;
};

export const persistLocale = (locale: Locale): void => {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // localStorage may be unavailable
  }
};
