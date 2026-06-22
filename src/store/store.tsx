import { create } from 'zustand';
import {
  getDefaultTheme,
  getNextThemeForButtonCycle,
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

type BootstrapInitialUiState = {
  theme: Theme;
  fullscreen: boolean;
};

const getBootstrapInitialUiState = (): BootstrapInitialUiState | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const win = window as Window & {
    __DDD_INITIAL_STATE__?: BootstrapInitialUiState;
  };

  return win.__DDD_INITIAL_STATE__ ?? null;
};

const bootstrapInitialUiState = getBootstrapInitialUiState();
const initialTheme = bootstrapInitialUiState?.theme ?? getDefaultTheme();
const initialFullscreen = bootstrapInitialUiState?.fullscreen ?? false;

export const useStore = create<Props & Actions>()((set) => ({
  // initial state
  theme: initialTheme,
  locale: 'en',
  fullscreen: initialFullscreen,
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
