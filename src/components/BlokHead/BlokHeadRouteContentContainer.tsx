'use client';

import { useStore, type CameraTrack } from '@/store/store';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import BlokHeadRouteContent from './BlokHeadRouteContent';

interface Props {
  projects: Array<{
    slug: string;
    external_link?: { cached_url: string };
  }>;
}

const formatThemeLabel = (theme: string) =>
  theme
    .toUpperCase()
    .split(' ')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');

const CAMERA_TRACK_LABELS: Record<CameraTrack, string> = {
  FULLSCREEN: 'Fullscreen',
  STRUCTURE: '3D structure',
  ANGLED: 'Angled overview',
};

const BlokHeadRouteContentContainer = ({ projects }: Props) => {
  const { theme, cycleTheme, cameraTrack, cycleCameraTrack } = useStore(
    useShallow((state) => ({
      theme: state.theme,
      cycleTheme: state.cycleTheme,
      cameraTrack: state.cameraTrack,
      cycleCameraTrack: state.cycleCameraTrack,
    })),
  );
  const themeLabel = formatThemeLabel(theme);
  const cameraTrackLabel = CAMERA_TRACK_LABELS[cameraTrack];
  const [isThemeSpinning, setIsThemeSpinning] = useState(false);
  const [isAboutMixedHovered, setIsAboutMixedHovered] = useState(false);
  const themeSpinTimeoutRef = useRef<number | null>(null);
  const handleCycleCameraTrack = useCallback(() => {
    if (window.matchMedia('(max-width: 770px)').matches) return;
    cycleCameraTrack();
  }, [cycleCameraTrack]);

  const handleCycleTheme = useCallback(() => {
    cycleTheme();

    if (themeSpinTimeoutRef.current !== null) {
      window.clearTimeout(themeSpinTimeoutRef.current);
    }

    setIsThemeSpinning(false);
    requestAnimationFrame(() => {
      setIsThemeSpinning(true);
    });

    themeSpinTimeoutRef.current = window.setTimeout(() => {
      setIsThemeSpinning(false);
      themeSpinTimeoutRef.current = null;
    }, 700);
  }, [cycleTheme]);

  useEffect(() => {
    return () => {
      if (themeSpinTimeoutRef.current !== null) {
        window.clearTimeout(themeSpinTimeoutRef.current);
      }
    };
  }, []);

  return (
    <BlokHeadRouteContent
      projects={projects}
      themeLabel={themeLabel}
      cameraTrack={cameraTrack}
      cameraTrackLabel={cameraTrackLabel}
      isThemeSpinning={isThemeSpinning}
      isAboutMixedHovered={isAboutMixedHovered}
      onAboutMixedHoverChange={setIsAboutMixedHovered}
      onCycleTheme={handleCycleTheme}
      onCycleCameraTrack={handleCycleCameraTrack}
    />
  );
};

export default BlokHeadRouteContentContainer;
