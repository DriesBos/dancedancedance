'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getInitialThemeForHour, type Theme } from '@/lib/theme';
import { Layout, useStore } from '@/store/store';
import { getThemeMetaColor } from '@/lib/theme-meta-color';
import { useShallow } from 'zustand/react/shallow';

type InitialUIState = {
  theme: Theme;
  layout: Layout;
};

const getFallbackInitialUIState = (): InitialUIState => {
  const hour = new Date().getHours();
  return {
    theme: getInitialThemeForHour(hour),
    layout: '3D',
  };
};

const getInitialUIState = (): InitialUIState => {
  const win = window as Window & { __DDD_INITIAL_STATE__?: InitialUIState };
  if (win.__DDD_INITIAL_STATE__) {
    return win.__DDD_INITIAL_STATE__;
  }

  return getFallbackInitialUIState();
};

const applyBodyState = (theme: Theme, layout: Layout, slug: string) => {
  const body = document.body;
  if (!body) return;

  body.setAttribute('data-theme', theme);
  body.setAttribute('data-layout', layout);
  body.setAttribute('data-page', slug);
  body.setAttribute('data-border', 'minimal');
};

const AppInitializer = () => {
  const hasInitializedUIRef = useRef(false);
  const readyFrameRef = useRef<number | null>(null);
  const readyTimeoutRef = useRef<number | null>(null);
  const { setTwoD, setThreeD, setTheme, theme, layout } = useStore(
    useShallow((state) => ({
      setTwoD: state.setTwoD,
      setThreeD: state.setThreeD,
      setTheme: state.setTheme,
      theme: state.theme,
      layout: state.layout,
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
      applyBodyState(initialState.theme, initialState.layout, slug);

      if (theme !== initialState.theme) {
        setTheme(initialState.theme);
      }

      if (layout !== initialState.layout) {
        if (initialState.layout === 'DESKTOP') {
          setTwoD();
        } else {
          setThreeD();
        }
      }

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

    applyBodyState(theme, layout, slug);
  }, [pathname, setTheme, setThreeD, setTwoD, slug, layout, theme]);

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
