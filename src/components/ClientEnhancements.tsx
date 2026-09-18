'use client';

import dynamic from 'next/dynamic';
import CursorLoader from '@/components/CursorLoader';

const TitleSwitcher = dynamic(() => import('@/components/TitleSwitcher'), {
  ssr: false,
});
const FaviconSwitcher = dynamic(() => import('@/components/FaviconSwitcher'), {
  ssr: false,
});
// Renders nothing and bails on touch devices; keep its GSAP code out of first-load JS.
const ColorBurstTypography = dynamic(
  () => import('@/components/ColorBurstTypography/ColorBurstTypography'),
  { ssr: false },
);

export default function ClientEnhancements() {
  return (
    <>
      <CursorLoader />
      <TitleSwitcher />
      <FaviconSwitcher />
      <ColorBurstTypography />
    </>
  );
}
