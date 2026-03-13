'use client';

import dynamic from 'next/dynamic';
import BackgroundEffects from '@/components/BackgroundEffects/BackgroundEffects';
import { useStore } from '@/store/store';

const NeonTunnel = dynamic(
  () => import('@/components/BackgroundEffects/NeonTunnel'),
  { ssr: false },
);

export default function BackgroundEffectsByTheme() {
  const theme = useStore((state) => state.theme);

  if (theme === 'SKY') {
    return <BackgroundEffects version="birds" />;
  }

  if (theme === 'RADIANT') {
    return <BackgroundEffects version="radiating" />;
  }

  if (theme === 'TRON') {
    return <NeonTunnel />;
  }

  if (theme === 'SEGMENTS') {
    return <BackgroundEffects version="segments" />;
  }

  if (theme === 'KUSAMA') {
    return <BackgroundEffects version="kusama" />;
  }

  return null;
}
