'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const CustomCursor = dynamic(() => import('./CustomCursor'), {
  ssr: false,
});

export default function CursorLoader() {
  const [hasFinePointer, setHasFinePointer] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      setHasFinePointer(false);
      return;
    }

    const mediaQuery = window.matchMedia('(pointer: fine)');
    setHasFinePointer(mediaQuery.matches);

    const onChange = (event: MediaQueryListEvent) => {
      setHasFinePointer(event.matches);
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', onChange);
    } else {
      mediaQuery.addListener(onChange);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', onChange);
      } else {
        mediaQuery.removeListener(onChange);
      }
    };
  }, []);

  // Don't render anything on touch devices or devices without fine pointers
  if (!hasFinePointer) return null;

  return <CustomCursor />;
}
