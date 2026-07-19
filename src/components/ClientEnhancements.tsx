'use client';

import dynamic from 'next/dynamic';
import CursorLoader from '@/components/CursorLoader';

const TitleSwitcher = dynamic(() => import('@/components/TitleSwitcher'), {
  ssr: false,
});
const FaviconSwitcher = dynamic(() => import('@/components/FaviconSwitcher'), {
  ssr: false,
});

export default function ClientEnhancements() {
  return (
    <>
      <CursorLoader />
      <TitleSwitcher />
      <FaviconSwitcher />
    </>
  );
}
