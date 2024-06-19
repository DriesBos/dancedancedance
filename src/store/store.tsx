import { create } from 'zustand';

export type Theme = 'BASIC' | 'NIGHTMODE' | 'IMAGE' | 'TRON';

export type Space = '2D' | '3D' | 'PHONE';

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
};

export const useStore = create<Props & Actions>()((set) => ({
  theme: 'BASIC',
  space: '3D',
  topPanel: true,
  setNightmode: () => set({ theme: 'NIGHTMODE' }),
  setDefault: () => set({ theme: 'BASIC' }),
  setTheme: (theme: Theme) => set({ theme }),
  setTwoD: () => set({ space: '2D' }),
  setThreeD: () => set({ space: '3D' }),
  setPhone: () => set({ space: 'PHONE' }),
  setTopPanelTrue: () => set({ topPanel: true }),
}));
