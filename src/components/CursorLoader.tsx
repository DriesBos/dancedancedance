'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const CustomCursor = dynamic(() => import('./CustomCursor'), {
  ssr: false,
});

export default function CursorLoader() {
  const [hasFinePointer, setHasFinePointer] = useState(false);

  useEffect(() => {
    // Check if device has a fine pointer (mouse, stylus)
    // This is more accurate than (hover: hover) for detecting cursor devices
    const hasFinePointer =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: fine)').matches;
    setHasFinePointer(hasFinePointer);
  }, []);

  // Don't render anything on touch devices or devices without fine pointers
  if (!hasFinePointer) return null;

  return <CustomCursor />;
}
