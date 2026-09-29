'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import { useStore } from '@/store/store';
import DesktopPortfolioScene from './DesktopPortfolioScene';

const DESKTOP_SCENE_QUERY = '(min-width: 771px)';

interface PortfolioViewportProps {
  children: ReactNode;
  footer: ReactNode;
  header: ReactNode;
}

const subscribeToDesktopViewport = (onChange: () => void) => {
  const mediaQuery = window.matchMedia(DESKTOP_SCENE_QUERY);
  mediaQuery.addEventListener('change', onChange);
  return () => mediaQuery.removeEventListener('change', onChange);
};

const getDesktopSnapshot = () => window.matchMedia(DESKTOP_SCENE_QUERY).matches;
const getServerSnapshot = () => false;

export default function PortfolioViewport({
  children,
  footer,
  header,
}: PortfolioViewportProps) {
  const pathname = usePathname();
  const isDesktopScene = useSyncExternalStore(
    subscribeToDesktopViewport,
    getDesktopSnapshot,
    getServerSnapshot,
  );
  const setCameraTrack = useStore((state) => state.setCameraTrack);
  const wasDesktopSceneRef = useRef(false);

  useLayoutEffect(() => {
    if (!isDesktopScene) {
      wasDesktopSceneRef.current = false;
      document.body.removeAttribute('data-scene');
      setCameraTrack('FULLSCREEN');
      return;
    }

    if (!wasDesktopSceneRef.current) {
      setCameraTrack('STRUCTURE');
    }
    wasDesktopSceneRef.current = true;
    document.body.setAttribute('data-scene', 'true');
    return () => document.body.removeAttribute('data-scene');
  }, [isDesktopScene, setCameraTrack]);

  if (!isDesktopScene) {
    return (
      <main className="main">
        {header}
        {children}
        {footer}
      </main>
    );
  }

  return (
    <DesktopPortfolioScene
      footer={footer}
      header={header}
      routeKey={pathname}
    >
      {children}
    </DesktopPortfolioScene>
  );
}
