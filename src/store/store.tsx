import { create } from 'zustand';

export type Theme =
  | 'BASIC'
  | 'NIGHTMODE'
  | 'IMAGE'
  | 'TRON'
  | 'GRADIENT'
  | 'DONJUDD'
  | 'STEDELIJK'
  | 'JAPANLIGHT'
  | 'JAPANDARK'
  | 'BEIGE'
  | 'GRUNGE'
  | 'LIGHT'
  | 'DARK';

export type Space = 'DESKTOP' | '3D' | '3DTWO';

export type Border = 'none' | 'minimal' | 'radius' | 'organic';

export type Props = {
  theme: Theme;
  space: Space;
  topPanel: boolean;
  border: Border;
};

export type Actions = {
  setNightmode: () => void;
  setDefault: () => void;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
  setTwoD: () => void;
  setThreeD: () => void;
  setThreeDTwo: () => void;
  setTopPanelTrue: () => void;
  setTopPanelFalse: () => void;
  setBorder: (border: Border) => void;
  cycleBorder: () => void;
};

const THEME_ORDER: Theme[] = [
  'BASIC',
  'NIGHTMODE',
  'IMAGE',
  'TRON',
  'GRADIENT',
  'DONJUDD',
  'STEDELIJK',
  'JAPANLIGHT',
  'JAPANDARK',
  'BEIGE',
  'GRUNGE',
  'LIGHT',
  'DARK',
];

const BORDER_ORDER: Border[] = ['none', 'minimal', 'radius', 'organic'];

export const useStore = create<Props & Actions>()((set) => ({
  // initial state
  theme: 'STEDELIJK',
  space: '3D',
  topPanel: true,
  border: 'minimal',
  setNightmode: () => set({ theme: 'NIGHTMODE' }),
  setDefault: () => set({ theme: 'GRADIENT' }),
  setTheme: (theme: Theme) => set({ theme }),
  cycleTheme: () =>
    set((state) => {
      const currentIndex = THEME_ORDER.indexOf(state.theme);
      const nextIndex = (currentIndex + 1) % THEME_ORDER.length;
      return { theme: THEME_ORDER[nextIndex] };
    }),
  setTwoD: () => set({ space: 'DESKTOP' }),
  setThreeD: () => set({ space: '3D' }),
  setThreeDTwo: () => set({ space: '3DTWO' }),
  setTopPanelTrue: () => set({ topPanel: true }),
  setTopPanelFalse: () => set({ topPanel: false }),
  setBorder: (border: Border) => set({ border }),
  cycleBorder: () =>
    set((state) => {
      const currentIndex = BORDER_ORDER.indexOf(state.border);
      const nextIndex = (currentIndex + 1) % BORDER_ORDER.length;
      return { border: BORDER_ORDER[nextIndex] };
    }),
}));
