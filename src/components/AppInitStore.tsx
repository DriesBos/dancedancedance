'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Space, THEME_ORDER, Theme, useStore } from '@/store/store';
import { getThemeMetaColor } from '@/lib/theme-meta-color';
import { useShallow } from 'zustand/react/shallow';

type InitialUIState = {
  theme: Theme;
  space: Space;
};

const HOME_INITIAL_UI_STATE: InitialUIState = {
  theme: 'RADIANT',
  space: '3D',
};

const getInitialTheme = (): Theme => {
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 4) {
    return 'NIGHT MODE';
  }

  const daytimeThemes = THEME_ORDER.filter(
    (themeName) => themeName !== 'NIGHT MODE',
  );
  return (
    daytimeThemes[Math.floor(Math.random() * daytimeThemes.length)] ?? 'LIGHT'
  );
};

const getInitialUIState = (pathname: string): InitialUIState => {
  const win = window as Window & { __DDD_INITIAL_STATE__?: InitialUIState };
  if (win.__DDD_INITIAL_STATE__) {
    return win.__DDD_INITIAL_STATE__;
  }

  if (pathname === '/') {
    return HOME_INITIAL_UI_STATE;
  }

  return { theme: getInitialTheme(), space: '3D' };
};

const applyBodyState = (theme: Theme, space: Space, slug: string) => {
  const body = document.body;
  if (!body) return;

  body.setAttribute('data-theme', theme);
  body.setAttribute('data-space', space);
  body.setAttribute('data-page', slug);
  body.setAttribute('data-border', 'minimal');
};

const AppInitializer = () => {
  const hasInitializedUIRef = useRef(false);
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
      applyBodyState(initialState.theme, initialState.space, slug);

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

    applyBodyState(theme, space, slug);
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

    metaThemeColor.setAttribute('content', getThemeMetaColor(theme));
  }, [theme]);

  return null;
};

export default AppInitializer;
