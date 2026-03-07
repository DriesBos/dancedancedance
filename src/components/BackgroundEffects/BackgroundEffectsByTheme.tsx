'use client';

import BackgroundEffects from '@/components/BackgroundEffects/BackgroundEffects';
import { useStore } from '@/store/store';

export default function BackgroundEffectsByTheme() {
  const theme = useStore((state) => state.theme);

  if (theme === 'AUGURIES') {
    return <BackgroundEffects version="birds" />;
  }

  if (theme === 'RADIANT' || theme === 'RADIANT DARK') {
    return <BackgroundEffects version="radiating" />;
  }

  if (theme === 'DARK') {
    return <BackgroundEffects version="segments" />;
  }

  if (theme === 'KUSAMA') {
    return <BackgroundEffects version="kusama" />;
  }

  if (theme === 'DOTS') {
    return <BackgroundEffects version="dots" />;
  }

  return null;
}
