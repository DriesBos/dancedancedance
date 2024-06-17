import { create } from 'zustand';

export type Theme = 'DEFAULT' | 'NIGHTMODE';

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
  topPanelToggle: (topPanel: boolean) => void;
};

export const useStore = create<Props & Actions>()((set) => ({
  theme: 'DEFAULT',
  space: '3D',
  topPanel: false,
  setNightmode: () => set({ theme: 'NIGHTMODE' }),
  setDefault: () => set({ theme: 'DEFAULT' }),
  setTheme: (theme: Theme) => set({ theme }),
  setTwoD: () => set({ space: '2D' }),
  setThreeD: () => set({ space: '3D' }),
  setPhone: () => set({ space: 'PHONE' }),
  topPanelToggle: (topPanel: boolean) => set({ topPanel }),
}));
