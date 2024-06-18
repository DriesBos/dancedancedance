'use client';

import { useStore } from '@/store/store';

const StoreSwitcher = () => {
  const setNightmode = useStore((state: any) => state.setNightmode);
  const setDefault = useStore((state: any) => state.setDefault);
  const setTwoD = useStore((state: any) => state.setTwoD);
  const setThreeD = useStore((state: any) => state.setThreeD);
  const setPhone = useStore((state: any) => state.setPhone);
  // var topPanel = useStore((state) => state.topPanel);
  // const setTopPanelTrue = useStore((state) => state.setTopPanelTrue);

  const theme = useStore((state: any) => state.theme);
  const space = useStore((state: any) => state.space);

  function handlePickTheme() {
    if (theme === 'DEFAULT') {
      setNightmode();
    } else if (theme === 'NIGHTMODE') {
      setDefault();
    }
  }

  function handlePickSpace() {
    if (space === '2D') {
      setThreeD();
      // setTopPanelTrue((topPanel = false));
    } else if (space === '3D') {
      setPhone();
      // setTopPanelTrue((topPanel = false));
    } else {
      setTwoD();
      // setTopPanelTrue((topPanel = false));
    }
  }

  return (
    <div className="storeSwitcher">
      <button onClick={handlePickTheme}>{theme}</button>
      <button onClick={handlePickSpace}>{space}</button>
    </div>
  );
};

export default StoreSwitcher;
