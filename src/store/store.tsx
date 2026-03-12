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

export type Layout = 'DESKTOP' | '3D';

export type Props = {
  theme: Theme;
  layout: Layout;
  topPanel: boolean;
};

export type Actions = {
  setNightmode: () => void;
  setDefault: () => void;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
  setTwoD: () => void;
  setThreeD: () => void;
  setTopPanelTrue: () => void;
  setTopPanelFalse: () => void;
};

export const useStore = create<Props & Actions>()((set) => ({
  // initial state
  theme: DEFAULT_THEME,
  layout: '3D',
  topPanel: true,
  setNightmode: () => set({ theme: 'NIGHT' }),
  setDefault: () => set({ theme: DEFAULT_THEME }),
  setTheme: (theme: Theme) => set({ theme }),
  cycleTheme: () =>
    set((state) => {
      return { theme: getNextThemeForButtonCycle(state.theme) };
    }),
  setTwoD: () => set({ layout: 'DESKTOP' }),
  setThreeD: () => set({ layout: '3D' }),
  setTopPanelTrue: () => set({ topPanel: true }),
  setTopPanelFalse: () => set({ topPanel: false }),
}));
