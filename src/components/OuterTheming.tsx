'use client';

import { useStore } from '@/store/store';
import styles from './OuterTheming.module.sass';

const OuterTheming = () => {
  const theme = useStore((state) => state.theme);
  const layout = useStore((state) => state.layout);
  const cycleTheme = useStore((state) => state.cycleTheme);
  const setTwoD = useStore((state) => state.setTwoD);
  const setThreeD = useStore((state) => state.setThreeD);
  const themeLabel = theme.toUpperCase();
  const layoutLabel = layout.toUpperCase();

  const handleThemeCycle = () => {
    cycleTheme();
  };

  const handleLayoutToggle = () => {
    if (layout === 'DESKTOP') {
      setThreeD();
      return;
    }
    setTwoD();
  };

  return (
    <div className={styles.outerTheming}>
      <div className={styles.outerThemingContainer}>
        <button
          type="button"
          className={`${styles.outerThemingButton} cursorInteract linkAnimation`}
          onClick={handleLayoutToggle}
          aria-label={`Toggle layout. Current layout: ${layoutLabel}`}
          title={`${layoutLabel} layout`}
        >
          <span>{layoutLabel} LAYOUT</span>
        </button>
        <button
          type="button"
          className={`${styles.outerThemingButton} cursorInteract linkAnimation`}
          onClick={handleThemeCycle}
          aria-label={`Cycle theme. Current theme: ${themeLabel}`}
          title={`${themeLabel} mode`}
        >
          <span>{themeLabel} MODE</span>
        </button>
      </div>
    </div>
  );
};

export default OuterTheming;
