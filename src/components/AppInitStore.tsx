'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  getInitialThemeForHour,
  shouldRunInitialIntroForTheme,
  type Theme,
} from '@/lib/theme';
import { useStore } from '@/store/store';
import { getThemeMetaColor } from '@/lib/theme-meta-color';
import { useShallow } from 'zustand/react/shallow';

type InitialUIState = {
  theme: Theme;
  fullscreen: boolean;
  initialThemeIntroPending: boolean;
  initialRouteEffectsSuppressedPathname: string | null;
};

const THEME_CHANGE_DATA_ATTR_DURATION_MS = 700;

const shouldSuppressInitialLandingEffects = (pathname: string) => {
  const slug = pathname.split('/')[1] || 'home';
  return slug === 'about' || slug === 'projects';
};

const getFallbackInitialUIState = (): InitialUIState => {
  const hour = new Date().getHours();
  const theme = getInitialThemeForHour(hour);
  const pathname = window.location.pathname || '/';
  const suppressInitialLandingEffects =
    shouldSuppressInitialLandingEffects(pathname);

  return {
    theme,
    fullscreen: false,
    initialThemeIntroPending: shouldRunInitialIntroForTheme(theme),
    initialRouteEffectsSuppressedPathname: suppressInitialLandingEffects
      ? pathname
      : null,
  };
};

const getInitialUIState = (): InitialUIState => {
  const win = window as Window & { __DDD_INITIAL_STATE__?: InitialUIState };
  if (win.__DDD_INITIAL_STATE__) {
    return win.__DDD_INITIAL_STATE__;
  }

  return getFallbackInitialUIState();
};

const applyBodyState = (theme: Theme, fullscreen: boolean, slug: string) => {
  const body = document.body;
  if (!body) return false;

  const previousTheme = body.getAttribute('data-theme');
  const shouldAnimateThemeChange =
    previousTheme !== null &&
    previousTheme !== theme &&
    body.getAttribute('data-initializing') !== 'true';

  if (shouldAnimateThemeChange) {
    body.setAttribute('data-theme-changing', 'true');
  }

  body.setAttribute('data-theme', theme);
  body.setAttribute('data-fullscreen', String(fullscreen));
  body.setAttribute('data-page', slug);
  body.setAttribute('data-border', 'minimal');

  return shouldAnimateThemeChange;
};

const AppInitializer = () => {
  const hasInitializedUIRef = useRef(false);
  const readyFrameRef = useRef<number | null>(null);
  const readyTimeoutRef = useRef<number | null>(null);
  const themeChangeTimeoutRef = useRef<number | null>(null);
  const {
    initializeUiState,
    clearInitialRouteEffectsSuppression,
    initialRouteEffectsSuppressedPathname,
    theme,
    fullscreen,
  } = useStore(
    useShallow((state) => ({
      initializeUiState: state.initializeUiState,
      clearInitialRouteEffectsSuppression:
        state.clearInitialRouteEffectsSuppression,
      initialRouteEffectsSuppressedPathname:
        state.initialRouteEffectsSuppressedPathname,
      theme: state.theme,
      fullscreen: state.fullscreen,
    })),
  );
  const path = usePathname();
  const slug = (path || '/').split('/')[1] || 'home';
  const pathname = path || '/';
  const clearInitializingAttr = () => {
    document.body?.removeAttribute('data-initializing');
  };

  useLayoutEffect(() => {
    if (!hasInitializedUIRef.current) {
      hasInitializedUIRef.current = true;

      const initialState = getInitialUIState();
      applyBodyState(initialState.theme, initialState.fullscreen, slug);

      initializeUiState(
        initialState.theme,
        initialState.fullscreen,
        initialState.initialThemeIntroPending,
        initialState.initialRouteEffectsSuppressedPathname,
      );

      if (readyFrameRef.current === null) {
        readyFrameRef.current = window.requestAnimationFrame(() => {
          clearInitializingAttr();
          if (readyTimeoutRef.current !== null) {
            window.clearTimeout(readyTimeoutRef.current);
            readyTimeoutRef.current = null;
          }
          readyFrameRef.current = null;
        });
      }
      if (readyTimeoutRef.current === null) {
        readyTimeoutRef.current = window.setTimeout(() => {
          clearInitializingAttr();
          if (readyFrameRef.current !== null) {
            window.cancelAnimationFrame(readyFrameRef.current);
            readyFrameRef.current = null;
          }
          readyTimeoutRef.current = null;
        }, 450);
      }

      return;
    }

    const didStartThemeChange = applyBodyState(theme, fullscreen, slug);

    if (!didStartThemeChange) {
      return;
    }

    if (themeChangeTimeoutRef.current !== null) {
      window.clearTimeout(themeChangeTimeoutRef.current);
    }

    themeChangeTimeoutRef.current = window.setTimeout(() => {
      document.body?.removeAttribute('data-theme-changing');
      themeChangeTimeoutRef.current = null;
    }, THEME_CHANGE_DATA_ATTR_DURATION_MS);
  }, [
    pathname,
    initializeUiState,
    slug,
    fullscreen,
    theme,
  ]);

  useEffect(() => {
    if (!initialRouteEffectsSuppressedPathname) return;
    if (pathname === initialRouteEffectsSuppressedPathname) return;

    clearInitialRouteEffectsSuppression();
  }, [
    clearInitialRouteEffectsSuppression,
    initialRouteEffectsSuppressedPathname,
    pathname,
  ]);

  useEffect(() => {
    return () => {
      if (readyFrameRef.current !== null) {
        window.cancelAnimationFrame(readyFrameRef.current);
      }
      if (readyTimeoutRef.current !== null) {
        window.clearTimeout(readyTimeoutRef.current);
      }
      if (themeChangeTimeoutRef.current !== null) {
        window.clearTimeout(themeChangeTimeoutRef.current);
        document.body?.removeAttribute('data-theme-changing');
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
      metaThemeColor.setAttribute('content', getThemeMetaColor(resolvedTheme));
    };

    updateMetaThemeColor();

    if (!body) return;

    const observer = new MutationObserver(updateMetaThemeColor);
    observer.observe(body, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      observer.disconnect();
    };
  }, [theme]);

  return null;
};

export default AppInitializer;
