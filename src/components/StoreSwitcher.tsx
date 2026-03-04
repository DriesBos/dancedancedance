'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/store/store';
import { useShallow } from 'zustand/react/shallow';

const StoreSwitcher = () => {
  const { cycleTheme, theme, space } = useStore(
    useShallow((state) => ({
      cycleTheme: state.cycleTheme,
      theme: state.theme,
      space: state.space,
    })),
  );

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
      useStore.getState().setThreeD();
    } else {
      useStore.getState().setTwoD();
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
