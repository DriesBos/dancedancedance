import { create } from 'zustand';
import {
  DEFAULT_THEME,
  THEME_ORDER,
  THEME_BUTTON_ORDER,
  getInitialThemeForHour,
  getNextThemeForButtonCycle,
  shouldRunInitialIntroForTheme,
  type Theme,
} from '@/lib/theme';

export type { Theme } from '@/lib/theme';
export {
  DEFAULT_THEME,
  THEME_ORDER,
  THEME_BUTTON_ORDER,
  getInitialThemeForHour,
} from '@/lib/theme';

export type Props = {
  theme: Theme;
  fullscreen: boolean;
  topPanel: boolean;
  pageContentVisible: boolean;
  pageContentRevealKey: number;
  initialThemeIntroPending: boolean;
};

export type Actions = {
  initializeUiState: (
    theme: Theme,
    fullscreen: boolean,
    initialThemeIntroPending: boolean,
  ) => void;
  setNightmode: () => void;
  setDefault: () => void;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
  setFullscreen: (fullscreen: boolean) => void;
  setTopPanelTrue: () => void;
  setTopPanelFalse: () => void;
  hidePageContent: () => void;
  showPageContent: () => void;
  revealPageContent: () => void;
};

export const useStore = create<Props & Actions>()((set) => ({
  // initial state
  theme: DEFAULT_THEME,
  fullscreen: false,
  topPanel: true,
  pageContentVisible: !shouldRunInitialIntroForTheme(DEFAULT_THEME),
  pageContentRevealKey: 0,
  initialThemeIntroPending: shouldRunInitialIntroForTheme(DEFAULT_THEME),
  initializeUiState: (theme, fullscreen, initialThemeIntroPending) =>
    set({
      theme,
      fullscreen,
      pageContentVisible: !initialThemeIntroPending,
      initialThemeIntroPending,
    }),
  setNightmode: () =>
    set({
      theme: 'NIGHT',
      pageContentVisible: true,
      initialThemeIntroPending: false,
    }),
  setDefault: () =>
    set({
      theme: DEFAULT_THEME,
      pageContentVisible: true,
      initialThemeIntroPending: false,
    }),
  setTheme: (theme: Theme) =>
    set({
      theme,
      pageContentVisible: true,
      initialThemeIntroPending: false,
    }),
  cycleTheme: () =>
    set((state) => {
      const nextTheme = getNextThemeForButtonCycle(state.theme);

      return {
        theme: nextTheme,
        pageContentVisible: true,
        initialThemeIntroPending: false,
      };
    }),
  setFullscreen: (fullscreen) => set({ fullscreen }),
  setTopPanelTrue: () => set({ topPanel: true }),
  setTopPanelFalse: () => set({ topPanel: false }),
  hidePageContent: () => set({ pageContentVisible: false }),
  showPageContent: () =>
    set({ pageContentVisible: true, initialThemeIntroPending: false }),
  revealPageContent: () =>
    set((state) => ({
      pageContentVisible: true,
      pageContentRevealKey: state.pageContentRevealKey + 1,
      initialThemeIntroPending: false,
    })),
}));
