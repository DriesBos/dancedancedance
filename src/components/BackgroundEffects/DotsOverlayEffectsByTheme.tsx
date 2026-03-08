'use client';

import BackgroundEffects from '@/components/BackgroundEffects/BackgroundEffects';
import { useStore } from '@/store/store';

export default function DotsOverlayEffectsByTheme() {
  const theme = useStore((state) => state.theme);
  const layout = useStore((state) => state.layout);
  const isSpaceTheme = theme === 'SPACE';
  const isVisible = layout === '3D';

  if (!isSpaceTheme) {
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
