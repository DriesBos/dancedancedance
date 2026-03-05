'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/store';

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

  useEffect(() => {
    const defaultColor = browserTheme === 'dark' ? '#FFFFFF' : '#000000';
    const themeColor = (() => {
      switch (theme) {
        case 'NIGHTMODE':
          return '#FF0000';
        case 'TRON':
          return '#80FFE9';
        case 'DONJUDD':
          return '#FA5942';
        case 'STEDELIJK':
          return '#62C853';
        case 'LIGHT':
          return defaultColor;
        case 'DARK':
          return defaultColor;
        case 'KUSAMA':
          return '#BA3A52';
        default:
          return defaultColor;
      }
    })();

    const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25"><path d="M12.25,0 C13.625,0 14.75,1.125 14.75,2.5 C14.75,3.875 13.625,5 12.25,5 C10.875,5 9.75,3.875 9.75,2.5 C9.75,1.125 10.875,0 12.25,0 Z M23.5,8.75 L16,8.75 L16,25 L13.5,25 L13.5,17.5 L11,17.5 L11,25 L8.5,25 L8.5,8.75 L1,8.75 L1,6.25 L23.5,6.25 L23.5,8.75 Z" fill="${themeColor}" fill-rule="nonzero"/></svg>`;
    const faviconHref = `data:image/svg+xml,${encodeURIComponent(faviconSvg)}`;

    const existingFavicons = document.querySelectorAll(
      "link[rel='icon'], link[rel='shortcut icon']",
    );

    for (let i = 0; i < existingFavicons.length; i += 1) {
      const link = existingFavicons[i];
      if (typeof link.remove === 'function') {
        link.remove();
      } else if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    }

    const svgFavicon = document.createElement('link');
    svgFavicon.rel = 'icon';
    svgFavicon.type = 'image/svg+xml';
    svgFavicon.href = faviconHref;
    document.head.appendChild(svgFavicon);

    const shortcutIcon = document.createElement('link');
    shortcutIcon.rel = 'shortcut icon';
    shortcutIcon.type = 'image/svg+xml';
    shortcutIcon.href = faviconHref;
    document.head.appendChild(shortcutIcon);
  }, [theme, browserTheme]);

  return null;
}
