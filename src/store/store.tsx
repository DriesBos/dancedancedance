import { create } from 'zustand';
import {
  getDefaultTheme,
  getNextThemeForButtonCycle,
  shouldRunInitialIntroForTheme,
  type Theme,
} from '@/lib/theme';

export type { Theme, ThemeOrientation } from '@/lib/theme';
export {
  LANDSCAPE_DEFAULT_THEME,
  LANDSCAPE_THEME_BUTTON_ORDER,
  LANDSCAPE_THEME_ORDER,
  PORTRAIT_DEFAULT_THEME,
  PORTRAIT_THEME_BUTTON_ORDER,
  PORTRAIT_THEME_ORDER,
  getDefaultTheme,
  getInitialThemeForHour,
} from '@/lib/theme';

export type Props = {
  theme: Theme;
  fullscreen: boolean;
  topPanel: boolean;
  pageContentVisible: boolean;
  pageContentRevealKey: number;
  initialThemeIntroPending: boolean;
  initialRouteEffectsSuppressedPathname: string | null;
};

export type Actions = {
  initializeUiState: (
    theme: Theme,
    fullscreen: boolean,
    initialThemeIntroPending: boolean,
    initialRouteEffectsSuppressedPathname: string | null,
  ) => void;
  clearInitialRouteEffectsSuppression: () => void;
  setNightmode: () => void;
  setDefault: () => void;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
  setFullscreen: (fullscreen: boolean) => void;
  setTopPanelTrue: () => void;
  setTopPanelFalse: () => void;
  hidePageContent: () => void;
  restorePageContentVisibility: () => void;
  showPageContent: () => void;
  revealPageContent: () => void;
};

type BootstrapInitialUiState = {
  theme: Theme;
  fullscreen: boolean;
  initialThemeIntroPending: boolean;
  initialRouteEffectsSuppressedPathname?: string | null;
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
const initialThemeIntroPending =
  bootstrapInitialUiState?.initialThemeIntroPending ??
  shouldRunInitialIntroForTheme(initialTheme);
const initialRouteEffectsSuppressedPathname =
  bootstrapInitialUiState?.initialRouteEffectsSuppressedPathname ?? null;

export const useStore = create<Props & Actions>()((set) => ({
  // initial state
  theme: initialTheme,
  fullscreen: initialFullscreen,
  topPanel: true,
  pageContentVisible: !initialThemeIntroPending,
  pageContentRevealKey: 0,
  initialThemeIntroPending,
  initialRouteEffectsSuppressedPathname,
  initializeUiState: (
    theme,
    fullscreen,
    initialThemeIntroPending,
    initialRouteEffectsSuppressedPathname,
  ) =>
    set({
      theme,
      fullscreen,
      pageContentVisible: !initialThemeIntroPending,
      initialThemeIntroPending,
      initialRouteEffectsSuppressedPathname,
    }),
  clearInitialRouteEffectsSuppression: () =>
    set({ initialRouteEffectsSuppressedPathname: null }),
  setNightmode: () =>
    set({
      theme: 'NIGHT',
      pageContentVisible: true,
      initialThemeIntroPending: false,
    }),
  setDefault: () =>
    set({
      theme: getDefaultTheme(),
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
  restorePageContentVisibility: () => set({ pageContentVisible: true }),
  showPageContent: () =>
    set({ pageContentVisible: true, initialThemeIntroPending: false }),
  revealPageContent: () =>
    set((state) => ({
      pageContentVisible: true,
      pageContentRevealKey: state.pageContentRevealKey + 1,
      initialThemeIntroPending: false,
    })),
}));
