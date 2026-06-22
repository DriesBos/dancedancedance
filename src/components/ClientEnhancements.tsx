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

const RETIRED_SERVICE_WORKER_CACHE_PREFIX = 'driesbos-webapp-';

export default function ClientEnhancements() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.getRegistrations().then((registrations) =>
        Promise.all(
          registrations.map((registration) => registration.unregister()),
        ),
      );
    }

    if ('caches' in window) {
      void window.caches.keys().then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) =>
              cacheName.startsWith(RETIRED_SERVICE_WORKER_CACHE_PREFIX),
            )
            .map((cacheName) => window.caches.delete(cacheName)),
        ),
      );
    }
  }, []);

  return (
    <>
      <CursorLoader />
      <TitleSwitcher />
      <FaviconSwitcher />
    </>
  );
}
