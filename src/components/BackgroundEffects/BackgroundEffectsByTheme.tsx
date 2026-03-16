'use client';

import dynamic from 'next/dynamic';
import { useStore } from '@/store/store';

const BirdsBackground = dynamic(
  () =>
    import('@/components/BackgroundEffects/BirdsBackground/BirdsBackground'),
  { ssr: false },
);
const RadiatingBackground = dynamic(
  () => import('@/components/BackgroundEffects/RadiatingBackground/RadiatingBackground'),
  { ssr: false },
);
const SegmentsBackground = dynamic(
  () =>
    import(
      '@/components/BackgroundEffects/SegmentsBackground/SegmentsBackground'
    ),
  { ssr: false },
);
const KusamaBackground = dynamic(
  () =>
    import(
      '@/components/BackgroundEffects/KusamaBackground/KusamaBackground'
    ),
  { ssr: false },
);
const TronPulse = dynamic(
  () => import('@/components/BackgroundEffects/TronPulse/TronPulse'),
  { ssr: false },
);

export default function BackgroundEffectsByTheme() {
  const theme = useStore((state) => state.theme);

  if (theme === 'TRON') {
    return <TronPulse />;
  }

  if (theme === 'SKY') {
    return <BirdsBackground />;
  }

  if (theme === 'RADIANT') {
    return <RadiatingBackground />;
  }

  if (theme === 'SEGMENTS') {
    return <SegmentsBackground />;
  }

  if (theme === 'KUSAMA') {
    return <KusamaBackground />;
  }

  return null;
}
