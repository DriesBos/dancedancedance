'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store/store';
import { ICON_ABOUT_FRAME_PATHS } from '@/components/Icons/IconAbout';

const MIXED_FAVICON_FRAMES: Array<keyof typeof ICON_ABOUT_FRAME_PATHS> = [
  'default',
  'leftArmRightLeg',
  'default',
  'rightArmLeftLeg',
  'default',
  'rightLeg',
  'default',
  'leftLeg',
];

const FAVICON_FRAME_DURATION_MS = 500;

const getOrCreateFaviconLink = (rel: 'icon' | 'shortcut icon') => {
  const existing = document.querySelector<HTMLLinkElement>(
    `link[rel='${rel}'][data-favicon-switcher='true']`,
  );
  if (existing) return existing;

  const link = document.createElement('link');
  link.rel = rel;
  link.type = 'image/svg+xml';
  link.setAttribute('data-favicon-switcher', 'true');
  document.head.appendChild(link);
  return link;
};

export default function FaviconSwitcher() {
  const theme = useStore((state) => state.theme);
  const [browserTheme, setBrowserTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      setBrowserTheme('light');
      return;
    }

    const darkModeMediaQuery = window.matchMedia(
      '(prefers-color-scheme: dark)',
    );
    setBrowserTheme(darkModeMediaQuery.matches ? 'dark' : 'light');

    const handleThemeChange = (e: MediaQueryListEvent) => {
      setBrowserTheme(e.matches ? 'dark' : 'light');
    };

    if (typeof darkModeMediaQuery.addEventListener === 'function') {
      darkModeMediaQuery.addEventListener('change', handleThemeChange);
    } else {
      darkModeMediaQuery.addListener(handleThemeChange);
    }

    return () => {
      if (typeof darkModeMediaQuery.removeEventListener === 'function') {
        darkModeMediaQuery.removeEventListener('change', handleThemeChange);
      } else {
        darkModeMediaQuery.removeListener(handleThemeChange);
      }
    };
  }, []);

  const themeColor = useMemo(() => {
    const defaultColor = browserTheme === 'dark' ? '#FFFFFF' : '#000000';
    switch (theme) {
      case 'NIGHT':
        return '#FF0000';
      case 'TRON':
        return '#80FFE9';
      case 'RADIANT':
        return '#FA5942';
      case 'SKY':
        return defaultColor;
      case 'KERMIT':
        return '#62C853';
      case 'LIGHT':
        return defaultColor;
      case 'DARK':
        return defaultColor;
      case 'KUSAMA':
        return '#BA3A52';
      case 'SPACE':
        return defaultColor;
      default:
        return defaultColor;
    }
  }, [theme, browserTheme]);

  useEffect(() => {
    const unmanagedFavicons = document.querySelectorAll<HTMLLinkElement>(
      "link[rel='icon']:not([data-favicon-switcher='true']), link[rel='shortcut icon']:not([data-favicon-switcher='true'])",
    );
    unmanagedFavicons.forEach((link) => link.remove());

    const iconLink = getOrCreateFaviconLink('icon');
    const shortcutLink = getOrCreateFaviconLink('shortcut icon');

    let frameIndex = 0;

    const renderFrame = () => {
      const framePath =
        ICON_ABOUT_FRAME_PATHS[MIXED_FAVICON_FRAMES[frameIndex]];
      const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25"><path d="${framePath}" fill="${themeColor}"/></svg>`;
      const faviconHref = `data:image/svg+xml,${encodeURIComponent(faviconSvg)}`;

      iconLink.href = faviconHref;
      shortcutLink.href = faviconHref;

      frameIndex = (frameIndex + 1) % MIXED_FAVICON_FRAMES.length;
    };

    renderFrame();
    const intervalId = window.setInterval(
      renderFrame,
      FAVICON_FRAME_DURATION_MS,
    );

    return () => {
      window.clearInterval(intervalId);
    };
  }, [themeColor]);

  return null;
}
