'use client';

import dynamic from 'next/dynamic';

const CursorLoader = dynamic(() => import('@/components/CursorLoader'), {
  ssr: false,
});
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
