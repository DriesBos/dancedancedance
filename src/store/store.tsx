import { create } from 'zustand';

export type Theme =
  | 'BASIC'
  | 'NIGHTMODE'
  | 'IMAGE'
  | 'TRON'
  | 'GRADIENT'
  | 'DONJUDD'
  | 'GRUNGE';

export type Space = 'DESKTOP' | 'MOBILE' | '3D';

export type Index = 'TXT' | 'IMG';

export type Props = {
  theme: Theme;
  space: Space;
  index: Index;
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
  setIndex: (index: Index) => void;
};

export const useStore = create<Props & Actions>()((set) => ({
  theme: 'DONJUDD',
  space: 'DESKTOP',
  index: 'TXT',
  topPanel: true,
  setNightmode: () => set({ theme: 'NIGHTMODE' }),
  setDefault: () => set({ theme: 'GRADIENT' }),
  setTheme: (theme: Theme) => set({ theme }),
  setTwoD: () => set({ space: 'DESKTOP' }),
  setThreeD: () => set({ space: '3D' }),
  setPhone: () => set({ space: 'MOBILE' }),
  setTopPanelTrue: () => set({ topPanel: true }),
  setTopPanelFalse: () => set({ topPanel: false }),
  setIndex: (index: Index) => set({ index }),
}));
