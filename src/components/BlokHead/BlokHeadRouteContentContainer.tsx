'use client';

import { useStore } from '@/store/store';
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

const BlokHeadRouteContentContainer = ({ projects }: Props) => {
  const { theme, cycleTheme, fullscreen, setFullscreen } = useStore(
    useShallow((state) => ({
      theme: state.theme,
      cycleTheme: state.cycleTheme,
      fullscreen: state.fullscreen,
      setFullscreen: state.setFullscreen,
    })),
  );
  const themeLabel = formatThemeLabel(theme);
  const fullscreenLabel = fullscreen ? 'ON' : 'OFF';
  const [isThemeSpinning, setIsThemeSpinning] = useState(false);
  const [isAboutMixedHovered, setIsAboutMixedHovered] = useState(false);
  const themeSpinTimeoutRef = useRef<number | null>(null);
  const layoutToggleRafRef = useRef<number | null>(null);
  const layoutToggleTimeoutRef = useRef<number | null>(null);

  const toggleFullscreen = useCallback(() => {
    const nextFullscreen = !fullscreen;
    const applyNextMode = () => setFullscreen(nextFullscreen);

    if (layoutToggleRafRef.current !== null) {
      window.cancelAnimationFrame(layoutToggleRafRef.current);
      layoutToggleRafRef.current = null;
    }
    if (layoutToggleTimeoutRef.current !== null) {
      window.clearTimeout(layoutToggleTimeoutRef.current);
      layoutToggleTimeoutRef.current = null;
    }

    if (window.scrollY <= 1) {
      applyNextMode();
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;

      if (layoutToggleRafRef.current !== null) {
        window.cancelAnimationFrame(layoutToggleRafRef.current);
        layoutToggleRafRef.current = null;
      }
      if (layoutToggleTimeoutRef.current !== null) {
        window.clearTimeout(layoutToggleTimeoutRef.current);
        layoutToggleTimeoutRef.current = null;
      }

      applyNextMode();
    };

    const checkTop = () => {
      if (window.scrollY <= 1) {
        settle();
        return;
      }
      layoutToggleRafRef.current = window.requestAnimationFrame(checkTop);
    };

    layoutToggleRafRef.current = window.requestAnimationFrame(checkTop);
    layoutToggleTimeoutRef.current = window.setTimeout(settle, 1200);
  }, [fullscreen, setFullscreen]);

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
      if (layoutToggleRafRef.current !== null) {
        window.cancelAnimationFrame(layoutToggleRafRef.current);
      }
      if (layoutToggleTimeoutRef.current !== null) {
        window.clearTimeout(layoutToggleTimeoutRef.current);
      }
    };
  }, []);

  return (
    <BlokHeadRouteContent
      projects={projects}
      themeLabel={themeLabel}
      fullscreen={fullscreen}
      fullscreenLabel={fullscreenLabel}
      isThemeSpinning={isThemeSpinning}
      isAboutMixedHovered={isAboutMixedHovered}
      onAboutMixedHoverChange={setIsAboutMixedHovered}
      onCycleTheme={handleCycleTheme}
      onToggleFullscreen={toggleFullscreen}
    />
  );
};

export default BlokHeadRouteContentContainer;
