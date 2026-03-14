'use client';

import { useEffect } from 'react';

const IOS_IMMERSIVE_HEIGHT_VAR = '--be-ios-immersive-height';
const IOS_IMMERSIVE_WIDTH_VAR = '--be-ios-immersive-width';

const isIosSafari = () => {
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent;
  const isIosDevice =
    /iP(hone|ad|od)/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isWebKit = /WebKit/i.test(ua);
  const isNonSafariBrowser =
    /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|YaBrowser/i.test(ua);

  return isIosDevice && isWebKit && !isNonSafariBrowser;
};

export const useIosImmersiveViewport = () => {
  useEffect(() => {
    if (!isIosSafari()) return;

    const root = document.documentElement;
    const viewport = window.visualViewport;
    let maxHeight = 0;
    let maxWidth = 0;
    let lastOrientation: 'portrait' | 'landscape' | null = null;

    const update = () => {
      const width = Math.round(viewport?.width ?? window.innerWidth);
      const height = Math.round(viewport?.height ?? window.innerHeight);
      const offsetTop = Math.round(viewport?.offsetTop ?? 0);
      const orientation: 'portrait' | 'landscape' =
        width >= height ? 'landscape' : 'portrait';

      if (lastOrientation && orientation !== lastOrientation) {
        maxHeight = 0;
        maxWidth = 0;
      }
      lastOrientation = orientation;

      maxHeight = Math.max(maxHeight, height + offsetTop);
      maxWidth = Math.max(maxWidth, width);

      root.style.setProperty(IOS_IMMERSIVE_HEIGHT_VAR, `${maxHeight}px`);
      root.style.setProperty(IOS_IMMERSIVE_WIDTH_VAR, `${maxWidth}px`);
    };

    update();

    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    window.addEventListener('resize', update, { passive: true });
    window.addEventListener('orientationchange', update, { passive: true });
    window.addEventListener('pageshow', update);

    return () => {
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      window.removeEventListener('pageshow', update);
    };
  }, []);
};
