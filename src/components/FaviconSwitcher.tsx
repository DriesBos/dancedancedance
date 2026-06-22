'use client';

import { useEffect, useMemo } from 'react';
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

  const themeColor = useMemo(() => {
    switch (theme) {
      case 'LIGHT':
        return '#000000';
      case 'DARK':
        return '#FFFFFF';
      case 'NIGHT':
        return '#FF0000';
      default:
        return '#000000';
    }
  }, [theme]);

  useEffect(() => {
    const unmanagedFavicons = document.querySelectorAll<HTMLLinkElement>(
      "link[rel='icon']:not([data-favicon-switcher='true']), link[rel='shortcut icon']:not([data-favicon-switcher='true'])",
    );
    unmanagedFavicons.forEach((link) => link.remove());

    const iconLink = getOrCreateFaviconLink('icon');
    const shortcutLink = getOrCreateFaviconLink('shortcut icon');

    let frameIndex = 0;

    const renderFrame = () => {
      const frameKey = MIXED_FAVICON_FRAMES[frameIndex] ?? 'default';
      const framePath =
        ICON_ABOUT_FRAME_PATHS[frameKey];
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
