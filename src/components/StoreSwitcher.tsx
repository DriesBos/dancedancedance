'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/store/store';

const StoreSwitcher = () => {
  const setNightmode = useStore((state: any) => state.setNightmode);
  const setDefault = useStore((state: any) => state.setDefault);
  const setTwoD = useStore((state: any) => state.setTwoD);
  const setThreeD = useStore((state: any) => state.setThreeD);
  const cycleTheme = useStore((state: any) => state.cycleTheme);
  const theme = useStore((state: any) => state.theme);
  const space = useStore((state: any) => state.space);

  // Update theme-color meta tag when theme changes
  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const color = theme === 'DARK' ? '#1A1A1A' : '#FFFFFF';
      metaThemeColor.setAttribute('content', color);
    }
  }, [theme]);

  function handlePickTheme() {
    cycleTheme();
  }

  function handlePickSpace() {
    if (space === 'DESKTOP') {
      setThreeD();
    } else {
      setTwoD();
    }
  }

  return (
    <div
      className="icon IconTheme cursorMagnetic"
      data-theme={theme}
      onClick={handlePickTheme}
    >
      <div className="IconTheme-Line" />
      <div className="IconTheme-Circle" />
    </div>
  );
};

export default StoreSwitcher;
