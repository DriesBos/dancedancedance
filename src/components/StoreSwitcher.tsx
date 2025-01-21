'use client';

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
    if (space === '2D') {
      setThreeD();
    } else if (space === '3D') {
      setPhone();
    } else {
      setTwoD();
    }
  }

  return (
    <div className="storeSwitcher">
      <div onClick={handlePickTheme}>{theme}</div>
      <div onClick={handlePickSpace}>{space}</div>
    </div>
  );
};

export default StoreSwitcher;
