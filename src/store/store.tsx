import { create } from 'zustand';

export type Theme =
  | 'NIGHT'
  | 'TRON'
  | 'RADIANT'
  | 'SKY'
  | 'KERMIT'
  | 'LIGHT'
  | 'SEGMENTS'
  | 'KUSAMA';

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

export const THEME_ORDER: Theme[] = [
  'TRON',
  'RADIANT',
  'SKY',
  'LIGHT',
  'KUSAMA',
  'SEGMENTS',
  'NIGHT',
  'KERMIT',
];

// Keep KERMIT available in the codebase, but hide it from user theme cycling for now.
export const THEME_BUTTON_ORDER: Theme[] = THEME_ORDER.filter(
  (theme) => theme !== 'KERMIT',
);

const getNextThemeForButtonCycle = (currentTheme: Theme): Theme => {
  const currentIndex = THEME_ORDER.indexOf(currentTheme);
  const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0;

  for (let step = 1; step <= THEME_ORDER.length; step += 1) {
    const candidate =
      THEME_ORDER[(safeCurrentIndex + step) % THEME_ORDER.length];
    if (THEME_BUTTON_ORDER.includes(candidate)) {
      return candidate;
    }
  }

  return THEME_BUTTON_ORDER[0];
};

export const useStore = create<Props & Actions>()((set) => ({
  // initial state
  theme: 'LIGHT',
  layout: '3D',
  topPanel: true,
  setNightmode: () => set({ theme: 'NIGHT' }),
  setDefault: () => set({ theme: 'LIGHT' }),
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
