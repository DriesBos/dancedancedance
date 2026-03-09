'use client';

import BackgroundEffects from '@/components/BackgroundEffects/BackgroundEffects';
import { useStore } from '@/store/store';

export default function BackgroundEffectsByTheme() {
  const theme = useStore((state) => state.theme);

  if (theme === 'SKY') {
    return <BackgroundEffects version="birds" />;
  }

  if (theme === 'GLACIAL') {
    return (
      <BackgroundEffects version="terrain" densityScale={1} terrainProfile="standard" />
    );
  }

  if (theme === 'GLACIAL_HD') {
    return (
      <BackgroundEffects version="terrain" densityScale={1} terrainProfile="hd" />
    );
  }

  if (theme === 'RADIANT') {
    return <BackgroundEffects version="radiating" />;
  }

  if (theme === 'SEGMENTS') {
    return <BackgroundEffects version="segments" />;
  }

  if (theme === 'KUSAMA') {
    return <BackgroundEffects version="kusama" />;
  }

  if (theme === 'SPACE') {
    return <BackgroundEffects version="dots" />;
  }

  return null;
}
