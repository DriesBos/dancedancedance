import { create } from 'zustand';
import {
  DEFAULT_THEME,
  THEME_ORDER,
  THEME_BUTTON_ORDER,
  getInitialThemeForHour,
  getNextThemeForButtonCycle,
  type Theme,
} from '@/lib/theme';

export type { Theme } from '@/lib/theme';
export {
  DEFAULT_THEME,
  THEME_ORDER,
  THEME_BUTTON_ORDER,
  getInitialThemeForHour,
} from '@/lib/theme';

export type Fullscreen = boolean;

export type Props = {
  theme: Theme;
  fullscreen: Fullscreen;
  topPanel: boolean;
  pageContentVisible: boolean;
  pageContentRevealKey: number;
};

export type Actions = {
  setNightmode: () => void;
  setDefault: () => void;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
  setFullscreenOn: () => void;
  setFullscreenOff: () => void;
  setTopPanelTrue: () => void;
  setTopPanelFalse: () => void;
  hidePageContent: () => void;
  showPageContent: () => void;
  revealPageContent: () => void;
};

const shouldShowPageContentForTheme = (theme: Theme) => theme !== 'RADIANT';

export const useStore = create<Props & Actions>()((set) => ({
  // initial state
  theme: DEFAULT_THEME,
  fullscreen: false,
  topPanel: true,
  pageContentVisible: true,
  pageContentRevealKey: 0,
  setNightmode: () =>
    set({
      theme: 'NIGHT',
      pageContentVisible: shouldShowPageContentForTheme('NIGHT'),
    }),
  setDefault: () =>
    set({
      theme: DEFAULT_THEME,
      pageContentVisible: shouldShowPageContentForTheme(DEFAULT_THEME),
    }),
  setTheme: (theme: Theme) =>
    set({
      theme,
      pageContentVisible: shouldShowPageContentForTheme(theme),
    }),
  cycleTheme: () =>
    set((state) => {
      const nextTheme = getNextThemeForButtonCycle(state.theme);

      return {
        theme: nextTheme,
        pageContentVisible: shouldShowPageContentForTheme(nextTheme),
      };
    }),
  setFullscreenOn: () => set({ fullscreen: true }),
  setFullscreenOff: () => set({ fullscreen: false }),
  setTopPanelTrue: () => set({ topPanel: true }),
  setTopPanelFalse: () => set({ topPanel: false }),
  hidePageContent: () => set({ pageContentVisible: false }),
  showPageContent: () => set({ pageContentVisible: true }),
  revealPageContent: () =>
    set((state) => ({
      pageContentVisible: true,
      pageContentRevealKey: state.pageContentRevealKey + 1,
    })),
}));
