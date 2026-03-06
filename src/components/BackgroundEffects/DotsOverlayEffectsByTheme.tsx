'use client';

import { useEffect, useState } from 'react';
import BackgroundEffects from '@/components/BackgroundEffects/BackgroundEffects';
import { useStore } from '@/store/store';

export default function DotsOverlayEffectsByTheme() {
  const theme = useStore((state) => state.theme);
  const space = useStore((state) => state.space);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean | null>(null);
  const isDotsTheme = theme === 'DOTS';
  const isVisible = space === '3D';

  useEffect(() => {
    const touchDevice =
      window.matchMedia('(hover: none), (pointer: coarse)').matches ||
      (navigator.maxTouchPoints ?? 0) > 0;
    setIsTouchDevice(touchDevice);
  }, []);

  if (!isDotsTheme || isTouchDevice !== false) {
    return null;
  }

  return (
    <BackgroundEffects
      version="dots"
      densityScale={0.05}
      layer="overlay"
      active={isVisible}
    />
  );
}
