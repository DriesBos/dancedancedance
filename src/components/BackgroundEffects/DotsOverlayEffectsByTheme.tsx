'use client';

import BackgroundEffects from '@/components/BackgroundEffects/BackgroundEffects';
import { useStore } from '@/store/store';

export default function DotsOverlayEffectsByTheme() {
  const theme = useStore((state) => state.theme);
  const space = useStore((state) => state.space);
  const isDotsTheme = theme === 'DOTS';
  const isVisible = space === '3D';

  if (!isDotsTheme) {
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
