import { create } from 'zustand';

export type Theme =
  | 'NIGHTMODE'
  | 'TRON'
  | 'DONJUDD'
  | 'STEDELIJK'
  | 'LIGHT'
  | 'DARK'
  | 'KUSAMA';

export type Space = 'DESKTOP' | '3D';

export type Props = {
  theme: Theme;
  space: Space;
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

export const THEME_ORDER: Theme[] = [
  'NIGHTMODE',
  'TRON',
  'DONJUDD',
  'STEDELIJK',
  'LIGHT',
  'DARK',
  'KUSAMA',
];

export const useStore = create<Props & Actions>()((set) => ({
  // initial state
  theme: 'LIGHT',
  space: '3D',
  topPanel: true,
  setNightmode: () => set({ theme: 'NIGHTMODE' }),
  setDefault: () => set({ theme: 'LIGHT' }),
  setTheme: (theme: Theme) => set({ theme }),
  cycleTheme: () =>
    set((state) => {
      const currentIndex = THEME_ORDER.indexOf(state.theme);
      const nextIndex = (currentIndex + 1) % THEME_ORDER.length;
      return { theme: THEME_ORDER[nextIndex] };
    }),
  setTwoD: () => set({ space: 'DESKTOP' }),
  setThreeD: () => set({ space: '3D' }),
  setTopPanelTrue: () => set({ topPanel: true }),
  setTopPanelFalse: () => set({ topPanel: false }),
}));
