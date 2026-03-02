'use client';

import { useStore } from '@/store/store';
import styles from './ThemingToggles.module.sass';

const SPACE_ORDER = ['DESKTOP', '3D', '3DTWO'] as const;

export default function ThemingToggles() {
  const theme = useStore((state) => state.theme);
  const space = useStore((state) => state.space);
  const border = useStore((state) => state.border);
  const cycleTheme = useStore((state) => state.cycleTheme);
  const setTwoD = useStore((state) => state.setTwoD);
  const setThreeD = useStore((state) => state.setThreeD);
  const setThreeDTwo = useStore((state) => state.setThreeDTwo);
  const cycleBorder = useStore((state) => state.cycleBorder);

  const toggleSpace = () => {
    const currentIndex = SPACE_ORDER.indexOf(space);
    const nextSpace = SPACE_ORDER[(currentIndex + 1) % SPACE_ORDER.length];

    if (nextSpace === 'DESKTOP') setTwoD();
    if (nextSpace === '3D') setThreeD();
    if (nextSpace === '3DTWO') setThreeDTwo();
  };

  return (
    <div className={styles.themingToggles}>
      <button className={styles.button} type="button" onClick={cycleTheme}>
        Theme: {theme}
      </button>
      <button className={styles.button} type="button" onClick={toggleSpace}>
        Space: {space}
      </button>
      <button className={styles.button} type="button" onClick={cycleBorder}>
        Border: {border}
      </button>
    </div>
  );
}
