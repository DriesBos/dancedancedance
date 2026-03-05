'use client';

import BackgroundEffects from '@/components/BackgroundEffects/BackgroundEffects';
import { useStore } from '@/store/store';

export default function BackgroundEffectsByTheme() {
  const theme = useStore((state) => state.theme);

  if (theme === 'DONJUDD') {
    return <BackgroundEffects version="radiating" />;
  }

  if (theme === 'DARK') {
    return <BackgroundEffects version="segments" />;
  }

  if (theme === 'KUSAMA') {
    return <BackgroundEffects version="kusama" />;
  }

  if (theme === 'DOTS' || theme === 'DOTSLIGHT') {
    return <BackgroundEffects version="dots" />;
  }

  return null;
}
