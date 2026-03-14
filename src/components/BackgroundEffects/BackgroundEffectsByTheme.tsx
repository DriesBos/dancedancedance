'use client';

import dynamic from 'next/dynamic';
import { useStore } from '@/store/store';

const BirdsBackground = dynamic(
  () => import('@/components/BackgroundEffects/BirdsBackground'),
  { ssr: false },
);
const RadiatingBackground = dynamic(
  () => import('@/components/BackgroundEffects/RadiatingBackground'),
  { ssr: false },
);
const SegmentsBackground = dynamic(
  () => import('@/components/BackgroundEffects/SegmentsBackground'),
  { ssr: false },
);
const KusamaBackground = dynamic(
  () => import('@/components/BackgroundEffects/KusamaBackground'),
  { ssr: false },
);
const NeonTunnel = dynamic(
  () => import('@/components/BackgroundEffects/NeonTunnel'),
  { ssr: false },
);

export default function BackgroundEffectsByTheme() {
  const theme = useStore((state) => state.theme);

  if (theme === 'SKY') {
    return <BirdsBackground />;
  }

  if (theme === 'RADIANT') {
    return <RadiatingBackground />;
  }

  if (theme === 'TRON') {
    return <NeonTunnel />;
  }

  if (theme === 'SEGMENTS') {
    return <SegmentsBackground />;
  }

  if (theme === 'KUSAMA') {
    return <KusamaBackground />;
  }

  return null;
}
