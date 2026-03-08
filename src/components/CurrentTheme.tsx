'use client';

import { useStore } from '@/store/store';
import styles from './CurrentTheme.module.sass';

const CurrentTheme = () => {
  const theme = useStore((state) => state.theme);
  const cycleTheme = useStore((state) => state.cycleTheme);
  const themeLabel = theme.toUpperCase();

  const themeCycle = () => {
    cycleTheme();
  };

  return (
    <button
      type="button"
      className={`${styles.currentTheme} currentTheme cursorInteract`}
      onClick={themeCycle}
      aria-label={`Cycle theme. Current theme: ${themeLabel}`}
      title={`${themeLabel} mode`}
    >
      <span>{themeLabel} mode</span>
    </button>
  );
};

export default CurrentTheme;
