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

const getInitialTheme = (): Theme => {
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 5) {
    return 'NIGHT MODE';
  }

  const daytimeThemes = THEME_ORDER.filter(
    (themeName) => themeName !== 'NIGHT MODE',
  );
  return daytimeThemes[Math.floor(Math.random() * daytimeThemes.length)] ?? 'LIGHT';
};

const getInitialUIState = (): InitialUIState => {
  const win = window as Window & { __DDD_INITIAL_STATE__?: InitialUIState };
  return win.__DDD_INITIAL_STATE__ ?? { theme: getInitialTheme(), space: '3D' };
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
  const hasRunHomeIntroRef = useRef(false);
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

      const initialState = getInitialUIState();
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
  }, [setTheme, setThreeD, setTwoD, slug, space, theme]);

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

  useEffect(() => {
    if (pathname !== '/' || hasRunHomeIntroRef.current) return;

    hasRunHomeIntroRef.current = true;

    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyPointerEvents = body.style.pointerEvents;
    const prevBodyTouchAction = body.style.touchAction;
    const prevBodyOverscrollBehavior = body.style.overscrollBehavior;

    const forceTop = () => {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      } catch {
        window.scrollTo(0, 0);
      }
    };
    let keepTopRaf: number | null = null;
    const keepTop = () => {
      forceTop();
      keepTopRaf = window.requestAnimationFrame(keepTop);
    };

    const unlockScroll = () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.pointerEvents = prevBodyPointerEvents;
      body.style.touchAction = prevBodyTouchAction;
      body.style.overscrollBehavior = prevBodyOverscrollBehavior;
      if (keepTopRaf !== null) {
        window.cancelAnimationFrame(keepTopRaf);
        keepTopRaf = null;
      }
    };

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    setThreeD();
    forceTop();

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.pointerEvents = 'none';
    body.style.touchAction = 'none';
    body.style.overscrollBehavior = 'none';
    keepTopRaf = window.requestAnimationFrame(keepTop);

    const blokCount = document.querySelectorAll('.blok-Animate').length;
    const blokEnterDurationMs = 330;
    const blokEnterStaggerMs = 165;
    const entranceTimelineMs =
      blokEnterDurationMs + Math.max(0, blokCount - 1) * blokEnterStaggerMs;
    const toDesktopDelayMs = Math.max(
      700,
      Math.min(2200, entranceTimelineMs + 180),
    );
    const unlockDelayMs = toDesktopDelayMs + 700;

    const toDesktopTimer = window.setTimeout(() => {
      setTwoD();
    }, toDesktopDelayMs);

    const unlockTimer = window.setTimeout(() => {
      unlockScroll();
    }, unlockDelayMs);

    return () => {
      window.clearTimeout(toDesktopTimer);
      window.clearTimeout(unlockTimer);
      unlockScroll();
    };
  }, [pathname, setThreeD, setTwoD]);

  return null;
};

export default AppInitializer;
