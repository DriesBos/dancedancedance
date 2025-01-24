import { create } from 'zustand';

export type Theme =
  | 'BASIC'
  | 'NIGHTMODE'
  | 'IMAGE'
  | 'TRON'
  | 'GRADIENT'
  | 'DONJUDD';

export type Space = 'LAPTOP' | 'PHONE' | '3D';

export type Props = {
  theme: Theme;
  space: Space;
  topPanel: boolean;
};

export type Actions = {
  setNightmode: (theme: Theme) => void;
  setDefault: (theme: Theme) => void;
  setTheme: (theme: Theme) => void;
  setTwoD: (space: Space) => void;
  setThreeD: (space: Space) => void;
  setPhone: (space: Space) => void;
  setTopPanelTrue: (topPanel: boolean) => void;
  setTopPanelFalse: (topPanel: boolean) => void;
};

export const useStore = create<Props & Actions>()((set) => ({
  theme: 'DONJUDD',
  space: 'PHONE',
  topPanel: true,
  setNightmode: () => set({ theme: 'NIGHTMODE' }),
  setDefault: () => set({ theme: 'GRADIENT' }),
  setTheme: (theme: Theme) => set({ theme }),
  setTwoD: () => set({ space: 'LAPTOP' }),
  setThreeD: () => set({ space: '3D' }),
  setPhone: () => set({ space: 'PHONE' }),
  setTopPanelTrue: () => set({ topPanel: true }),
  setTopPanelFalse: () => set({ topPanel: false }),
}));
