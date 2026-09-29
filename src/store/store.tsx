import { create } from 'zustand';
import {
  getNextThemeForButtonCycle,
  LIGHT_THEME,
  type Theme,
} from '@/lib/theme';

export type Props = {
  theme: Theme;
  cameraTrack: CameraTrack;
  fullscreen: boolean;
};

export type CameraTrack = 'FULLSCREEN' | 'STRUCTURE' | 'ANGLED';

export const getNextCameraTrack = (track: CameraTrack): CameraTrack => {
  switch (track) {
    case 'FULLSCREEN':
      return 'STRUCTURE';
    case 'STRUCTURE':
      return 'ANGLED';
    case 'ANGLED':
      return 'FULLSCREEN';
  }
};

export type Actions = {
  initializeUiState: (theme: Theme, cameraTrack: CameraTrack) => void;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
  setCameraTrack: (cameraTrack: CameraTrack) => void;
  cycleCameraTrack: () => void;
};

export const useStore = create<Props & Actions>()((set) => ({
  // initial state
  theme: LIGHT_THEME,
  cameraTrack: 'STRUCTURE',
  fullscreen: false,
  initializeUiState: (theme, cameraTrack) =>
    set({
      theme,
      cameraTrack,
      fullscreen: cameraTrack === 'FULLSCREEN',
    }),
  setTheme: (theme: Theme) => set({ theme }),
  cycleTheme: () =>
    set((state) => {
      const nextTheme = getNextThemeForButtonCycle(state.theme);

      return { theme: nextTheme };
    }),
  setCameraTrack: (cameraTrack) =>
    set({ cameraTrack, fullscreen: cameraTrack === 'FULLSCREEN' }),
  cycleCameraTrack: () =>
    set((state) => {
      const cameraTrack = getNextCameraTrack(state.cameraTrack);
      return { cameraTrack, fullscreen: cameraTrack === 'FULLSCREEN' };
    }),
}));
