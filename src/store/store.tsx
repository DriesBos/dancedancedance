import { create } from 'zustand';
import {
  getNextThemeForButtonCycle,
  LIGHT_THEME,
  type Theme,
} from '@/lib/theme';

export type { Theme } from '@/lib/theme';
export {
  THEME_ORDER,
  getDefaultTheme,
  getInitialThemeForHour,
} from '@/lib/theme';

export type Props = {
  theme: Theme;
  fullscreen: boolean;
};

export type Actions = {
  initializeUiState: (theme: Theme, fullscreen: boolean) => void;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
  setFullscreen: (fullscreen: boolean) => void;
};

export const useStore = create<Props & Actions>()((set) => ({
  // initial state
  theme: LIGHT_THEME,
  fullscreen: false,
  initializeUiState: (theme, fullscreen) =>
    set({
      theme,
      fullscreen,
    }),
  setTheme: (theme: Theme) => set({ theme }),
  cycleTheme: () =>
    set((state) => {
      const nextTheme = getNextThemeForButtonCycle(state.theme);

      return { theme: nextTheme };
    }),
  setFullscreen: (fullscreen) => set({ fullscreen }),
}));
