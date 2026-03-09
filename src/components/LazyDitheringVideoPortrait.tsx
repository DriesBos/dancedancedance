'use client';

import dynamic from 'next/dynamic';
import type { DitheringVideoPortraitProps } from '@/components/DitheringVideoPortrait';

const DitheringVideoPortrait = dynamic(
  () => import('@/components/DitheringVideoPortrait'),
  {
    ssr: false,
  },
);

export default function LazyDitheringVideoPortrait(
  props: DitheringVideoPortraitProps,
) {
  return <DitheringVideoPortrait {...props} />;
}
