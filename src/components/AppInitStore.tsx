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

    const preventScroll = (event: Event) => {
      event.preventDefault();
    };
    const preventInteraction = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    const unlockScroll = () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.pointerEvents = prevBodyPointerEvents;
      body.style.touchAction = prevBodyTouchAction;
      body.style.overscrollBehavior = prevBodyOverscrollBehavior;
      window.removeEventListener('wheel', preventScroll);
      window.removeEventListener('touchmove', preventScroll);
      window.removeEventListener('pointerdown', preventInteraction, true);
      window.removeEventListener('pointerup', preventInteraction, true);
      window.removeEventListener('click', preventInteraction, true);
      window.removeEventListener('touchstart', preventInteraction, true);
      window.removeEventListener('touchend', preventInteraction, true);
      window.removeEventListener('contextmenu', preventInteraction, true);
    };

    setThreeD();
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } catch {
      window.scrollTo(0, 0);
    }

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.pointerEvents = 'none';
    body.style.touchAction = 'none';
    body.style.overscrollBehavior = 'none';
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });
    window.addEventListener('pointerdown', preventInteraction, {
      passive: false,
      capture: true,
    });
    window.addEventListener('pointerup', preventInteraction, {
      passive: false,
      capture: true,
    });
    window.addEventListener('click', preventInteraction, {
      passive: false,
      capture: true,
    });
    window.addEventListener('touchstart', preventInteraction, {
      passive: false,
      capture: true,
    });
    window.addEventListener('touchend', preventInteraction, {
      passive: false,
      capture: true,
    });
    window.addEventListener('contextmenu', preventInteraction, {
      passive: false,
      capture: true,
    });

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
