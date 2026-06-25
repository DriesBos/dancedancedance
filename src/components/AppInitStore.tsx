'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getInitialThemeForHour, type Theme } from '@/lib/theme';
import { useStore } from '@/store/store';
import { getThemeMetaColor } from '@/lib/theme-meta-color';
import { useShallow } from 'zustand/react/shallow';

type InitialUIState = {
  theme: Theme;
  fullscreen: boolean;
};

const FULLSCREEN_STORAGE_KEY = 'ddd-fullscreen';

const getIsMobileViewport = () => {
  if (typeof window.matchMedia === 'function') {
    return window.matchMedia('(max-width: 770px)').matches;
  }

  return window.innerWidth < 770;
};

const getStoredFullscreenPreference = () => {
  try {
    return window.localStorage.getItem(FULLSCREEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

const getInitialFullscreen = () =>
  getIsMobileViewport() ? true : getStoredFullscreenPreference() === 'true';

const getFallbackInitialUIState = (): InitialUIState => {
  const hour = new Date().getHours();
  const theme = getInitialThemeForHour(hour);

  return {
    theme,
    fullscreen: getInitialFullscreen(),
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
  if (!body) return;

  body.setAttribute('data-theme', theme);
  body.setAttribute('data-fullscreen', String(fullscreen));
  body.setAttribute('data-page', slug);
  body.setAttribute('data-border', 'minimal');
};

const applyThemeMetaColor = (theme: Theme) => {
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (!metaThemeColor) return;

  metaThemeColor.setAttribute('content', getThemeMetaColor(theme));
};

const AppInitializer = () => {
  const hasInitializedUIRef = useRef(false);
  const readyFrameRef = useRef<number | null>(null);
  const readyTimeoutRef = useRef<number | null>(null);
  const {
    initializeUiState,
    theme,
    fullscreen,
  } = useStore(
    useShallow((state) => ({
      initializeUiState: state.initializeUiState,
      theme: state.theme,
      fullscreen: state.fullscreen,
    })),
  );
  const path = usePathname();
  const slug = (path || '/').split('/')[1] || 'home';
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

    applyBodyState(theme, fullscreen, slug);
  }, [
    initializeUiState,
    slug,
    fullscreen,
    theme,
  ]);

  useEffect(() => {
    return () => {
      if (readyFrameRef.current !== null) {
        window.cancelAnimationFrame(readyFrameRef.current);
      }
      if (readyTimeoutRef.current !== null) {
        window.clearTimeout(readyTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    applyThemeMetaColor(theme);
  }, [theme]);

  useEffect(() => {
    const body = document.body;
    if (!body) return;

    const updateMetaThemeColor = () => {
      const themeAttribute = document.body.getAttribute('data-theme');
      if (!themeAttribute) return;

      applyThemeMetaColor(themeAttribute as Theme);
    };

    updateMetaThemeColor();

    const observer = new MutationObserver(updateMetaThemeColor);
    observer.observe(body, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
};

export default AppInitializer;
