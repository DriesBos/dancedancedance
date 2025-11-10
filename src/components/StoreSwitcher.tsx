'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/store';

const StoreSwitcher = () => {
  const setNightmode = useStore((state: any) => state.setNightmode);
  const setDefault = useStore((state: any) => state.setDefault);
  const setTwoD = useStore((state: any) => state.setTwoD);
  const setThreeD = useStore((state: any) => state.setThreeD);
  const setPhone = useStore((state: any) => state.setPhone);
  const setTheme = useStore((state: any) => state.setTheme);
  const theme = useStore((state: any) => state.theme);
  const space = useStore((state: any) => state.space);
  const [orientation, setOrientation] = useState('');

  // https://blog.codewithsky.in/screen-orientation-in-nextjs
  useEffect(() => {
    function updateOrientation() {
      setOrientation(window.screen.orientation.type);
    }
    updateOrientation();
    window.addEventListener('orientationchange', updateOrientation);
    return () => {
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, [orientation]);

  // Update theme-color meta tag when theme changes
  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const color = theme === 'DARK' ? '#1A1A1A' : '#FFFFFF';
      metaThemeColor.setAttribute('content', color);
    }
  }, [theme]);

  function handlePickTheme() {
    if (theme === 'LIGHT') {
      setTheme('DARK');
    } else if (theme === 'DARK') {
      setTheme('LIGHT');
    }
  }

  function handlePickSpace() {
    if (space === 'DESKTOP') {
      setThreeD();
    } else if (space === '3D' && orientation.includes('landscape')) {
      setPhone();
    } else {
      setTwoD();
    }
  }

  return <div className="icon IconTheme" onClick={handlePickTheme} />;
};

export default StoreSwitcher;
