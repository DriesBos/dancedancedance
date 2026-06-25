import { create } from 'zustand';
import {
  getNextThemeForButtonCycle,
  LIGHT_THEME,
  type Theme,
} from '@/lib/theme';
import { type Locale } from '@/lib/locale';

export type { Theme, ThemeOrientation } from '@/lib/theme';
export {
  LANDSCAPE_DEFAULT_THEME,
  LANDSCAPE_THEME_ORDER,
  PORTRAIT_DEFAULT_THEME,
  PORTRAIT_THEME_ORDER,
  getDefaultTheme,
  getInitialThemeForHour,
} from '@/lib/theme';

export type Props = {
  theme: Theme;
  locale: Locale;
  fullscreen: boolean;
  pageContentVisible: boolean;
  pageContentRevealKey: number;
};

export type Actions = {
  initializeUiState: (theme: Theme, fullscreen: boolean) => void;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
  setLocale: (locale: Locale) => void;
  setFullscreen: (fullscreen: boolean) => void;
  hidePageContent: () => void;
  restorePageContentVisibility: () => void;
  showPageContent: () => void;
  revealPageContent: () => void;
};

export const useStore = create<Props & Actions>()((set) => ({
  // initial state
  theme: LIGHT_THEME,
  locale: 'en',
  fullscreen: false,
  pageContentVisible: true,
  pageContentRevealKey: 0,
  initializeUiState: (theme, fullscreen) =>
    set({
      theme,
      fullscreen,
      pageContentVisible: true,
    }),
  setTheme: (theme: Theme) =>
    set({
      theme,
      pageContentVisible: true,
    }),
  cycleTheme: () =>
    set((state) => {
      const nextTheme = getNextThemeForButtonCycle(state.theme);

      return {
        theme: nextTheme,
        pageContentVisible: true,
      };
    }),
  setLocale: (locale) => set({ locale }),
  setFullscreen: (fullscreen) => set({ fullscreen }),
  hidePageContent: () => set({ pageContentVisible: false }),
  restorePageContentVisibility: () => set({ pageContentVisible: true }),
  showPageContent: () => set({ pageContentVisible: true }),
  revealPageContent: () =>
    set((state) => ({
      pageContentVisible: true,
      pageContentRevealKey: state.pageContentRevealKey + 1,
    })),
}));
