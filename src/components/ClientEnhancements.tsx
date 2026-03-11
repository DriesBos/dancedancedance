'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import CursorLoader from '@/components/CursorLoader';

const TitleSwitcher = dynamic(() => import('@/components/TitleSwitcher'), {
  ssr: false,
});
const FaviconSwitcher = dynamic(() => import('@/components/FaviconSwitcher'), {
  ssr: false,
});

export default function ClientEnhancements() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    if (!('serviceWorker' in navigator)) {
      return;
    }

    void navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
  }, []);

  return (
    <>
      <CursorLoader />
      <TitleSwitcher />
      <FaviconSwitcher />
    </>
  );
}
