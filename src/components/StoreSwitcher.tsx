'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/store';
import IconSearch from './Icons/IconSearch';
import IconDesktop from './Icons/IconDesktop';
import IconMobile from './Icons/IconMobile';
import IconThreeD from './Icons/IconThreeD';

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

  function handlePickTheme() {
    if (theme === 'BASIC') {
      setNightmode();
    } else if (theme === 'NIGHTMODE') {
      setTheme('IMAGE');
    } else if (theme === 'IMAGE') {
      setTheme('TRON');
    } else if (theme === 'TRON') {
      setTheme('GRADIENT');
    } else if (theme === 'GRADIENT') {
      setTheme('DONJUDD');
    } else if (theme === 'DONJUDD') {
      setTheme('BASIC');
    }
  }

  function handlePickSpace() {
    if (space === 'LAPTOP') {
      setThreeD();
    } else if (space === '3D' && orientation.includes('landscape')) {
      setPhone();
    } else {
      setTwoD();
    }
  }

  return (
    <>
      <div className="icon IconTheme" onClick={handlePickTheme} />
      {space === 'LAPTOP' && (
        <div className="icon" onClick={handlePickSpace}>
          <IconDesktop />
        </div>
      )}
      {space === 'PHONE' && (
        <div className="icon" onClick={handlePickSpace}>
          <IconMobile />
        </div>
      )}
      {space === '3D' && (
        <div className="icon" onClick={handlePickSpace}>
          <IconThreeD />
        </div>
      )}
    </>
  );
};

export default StoreSwitcher;
