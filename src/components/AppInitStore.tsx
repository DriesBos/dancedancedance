'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Space, THEME_ORDER, Theme, useStore } from '@/store/store';
import { getThemeMetaColor } from '@/lib/theme-meta-color';
import { useShallow } from 'zustand/react/shallow';

type InitialUIState = {
  theme: Theme;
  space: Space;
  skyVariation: string;
};

const getSkyVariationForHour = (hour: number): string => {
  if (hour >= 4 && hour < 5) return 'morning';
  if (hour >= 5 && hour < 10) return 'dawn';
  if (hour >= 10 && hour < 17) return 'noon';
  if (hour >= 17 && hour < 19) return 'sunset';
  if (hour >= 19 && hour < 21) return 'dusk';
  return 'evening';
};

const getInitialTheme = (hour: number): Theme => {
  if (hour >= 0 && hour < 5) {
    return 'NIGHT MODE';
  }

  const daytimeThemes = THEME_ORDER.filter(
    (themeName) => themeName !== 'NIGHT MODE',
  );
  return (
    daytimeThemes[Math.floor(Math.random() * daytimeThemes.length)] ?? 'LIGHT'
  );
};

const getFallbackInitialUIState = (): InitialUIState => {
  const hour = new Date().getHours();
  return {
    theme: getInitialTheme(hour),
    space: '3D',
    skyVariation: getSkyVariationForHour(hour),
  };
};

const getHomeInitialUIState = (): InitialUIState => {
  const hour = new Date().getHours();
  return {
    theme: 'RADIANT',
    space: '3D',
    skyVariation: getSkyVariationForHour(hour),
  };
};

const getInitialUIState = (pathname: string): InitialUIState => {
  const win = window as Window & { __DDD_INITIAL_STATE__?: InitialUIState };
  if (win.__DDD_INITIAL_STATE__) {
    return {
      ...win.__DDD_INITIAL_STATE__,
      skyVariation:
        win.__DDD_INITIAL_STATE__.skyVariation ??
        getSkyVariationForHour(new Date().getHours()),
    };
  }

  if (pathname === '/') {
    return getHomeInitialUIState();
  }

  return getFallbackInitialUIState();
};

const applyBodyState = (
  theme: Theme,
  space: Space,
  slug: string,
  skyVariation: string,
) => {
  const body = document.body;
  if (!body) return;

  body.setAttribute('data-theme', theme);
  body.setAttribute('data-space', space);
  body.setAttribute('data-page', slug);
  body.setAttribute('data-border', 'minimal');
  body.setAttribute('data-sky-variation', skyVariation);
};

const AppInitializer = () => {
  const hasInitializedUIRef = useRef(false);
  const skyVariationRef = useRef('auto');
  const readyFrameRef = useRef<number | null>(null);
  const { setTwoD, setThreeD, setTheme, theme, space } = useStore(
    useShallow((state) => ({
      setTwoD: state.setTwoD,
      setThreeD: state.setThreeD,
      setTheme: state.setTheme,
      theme: state.theme,
      space: state.space,
    })),
  );
  const path = usePathname();
  const slug = (path || '/').split('/')[1] || 'home';
  const pathname = path || '/';

  useLayoutEffect(() => {
    if (!hasInitializedUIRef.current) {
      hasInitializedUIRef.current = true;

      const initialState = getInitialUIState(pathname);
      skyVariationRef.current = initialState.skyVariation || 'auto';
      applyBodyState(
        initialState.theme,
        initialState.space,
        slug,
        skyVariationRef.current,
      );

      if (theme !== initialState.theme) {
        setTheme(initialState.theme);
      }

      if (space !== initialState.space) {
        if (initialState.space === 'DESKTOP') {
          setTwoD();
        } else {
          setThreeD();
        }
      }

      if (readyFrameRef.current === null) {
        readyFrameRef.current = window.requestAnimationFrame(() => {
          document.body?.removeAttribute('data-initializing');
          readyFrameRef.current = null;
        });
      }

      return;
    }

    applyBodyState(theme, space, slug, skyVariationRef.current);
  }, [pathname, setTheme, setThreeD, setTwoD, slug, space, theme]);

  useEffect(() => {
    return () => {
      if (readyFrameRef.current !== null) {
        window.cancelAnimationFrame(readyFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) return;
    const body = document.body;

    const updateMetaThemeColor = () => {
      const bodyTheme = body?.getAttribute('data-theme');
      const resolvedTheme = (bodyTheme as Theme | null) ?? theme;
      const skyVariation = body?.getAttribute('data-sky-variation') ?? undefined;
      metaThemeColor.setAttribute(
        'content',
        getThemeMetaColor(resolvedTheme, skyVariation),
      );
    };

    updateMetaThemeColor();

    if (!body) return;

    const observer = new MutationObserver(updateMetaThemeColor);
    observer.observe(body, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-sky-variation'],
    });

    return () => {
      observer.disconnect();
    };
  }, [theme]);

  return null;
};

export default AppInitializer;
