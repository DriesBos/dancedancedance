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

  return null;
}
