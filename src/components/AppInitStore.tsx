'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store/store';

type Props = {
  children: React.ReactNode;
  className: string;
};

const AppInitializer = ({ children, className }: Props) => {
  const hasRunHomeIntroRef = useRef(false);
  const setTwoD = useStore((state) => state.setTwoD);
  const setThreeD = useStore((state) => state.setThreeD);
  const theme = useStore((state: any) => state.theme);
  const space = useStore((state: any) => state.space);
  const path = usePathname();
  const slug = (path || '/').split('/')[1] || 'home';
  const pathname = path || '/';

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

  return (
    <body
      className={`${className}`}
      data-theme={theme}
      data-space={space}
      data-border="minimal"
      data-page={slug}
    >
      {children}
    </body>
  );
};

export default AppInitializer;
