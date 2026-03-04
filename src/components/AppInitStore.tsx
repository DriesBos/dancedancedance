'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { THEME_ORDER, useStore } from '@/store/store';

const AppInitializer = () => {
  const hasRunHomeIntroRef = useRef(false);
  const hasSetInitialThemeRef = useRef(false);
  const setTwoD = useStore((state) => state.setTwoD);
  const setThreeD = useStore((state) => state.setThreeD);
  const setNightmode = useStore((state) => state.setNightmode);
  const setTheme = useStore((state) => state.setTheme);
  const theme = useStore((state: any) => state.theme);
  const space = useStore((state: any) => state.space);
  const path = usePathname();
  const slug = (path || '/').split('/')[1] || 'home';
  const pathname = path || '/';

  useEffect(() => {
    const body = document.body;
    if (!body) return;

    body.setAttribute('data-theme', theme);
    body.setAttribute('data-space', space);
    body.setAttribute('data-page', slug);
    body.setAttribute('data-border', 'minimal');
  }, [theme, space, slug]);

  useEffect(() => {
    if (hasSetInitialThemeRef.current) return;
    hasSetInitialThemeRef.current = true;

    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) {
      setNightmode();
      return;
    }

    const daytimeThemes = THEME_ORDER.filter((themeName) => themeName !== 'NIGHTMODE');
    if (daytimeThemes.length === 0) return;
    const randomTheme =
      daytimeThemes[Math.floor(Math.random() * daytimeThemes.length)];
    setTheme(randomTheme);
  }, [setNightmode, setTheme]);

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
