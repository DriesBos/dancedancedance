'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/store';
import styles from './OuterTheming.module.sass';

const OuterTheming = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
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

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return;
    }

    const reducedMotionQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    );
    const syncReducedMotionPreference = () => {
      setPrefersReducedMotion(reducedMotionQuery.matches);
    };

    syncReducedMotionPreference();

    if (typeof reducedMotionQuery.addEventListener === 'function') {
      reducedMotionQuery.addEventListener(
        'change',
        syncReducedMotionPreference,
      );
      return () => {
        reducedMotionQuery.removeEventListener(
          'change',
          syncReducedMotionPreference,
        );
      };
    }

    reducedMotionQuery.addListener(syncReducedMotionPreference);
    return () => {
      reducedMotionQuery.removeListener(syncReducedMotionPreference);
    };
  }, []);

  return (
    <div className={styles.outerTheming}>
      <div className={styles.outerThemingContainer}>
        {prefersReducedMotion && (
          <span
            className={`${styles.outerThemingButton} ${styles.outerThemingStatus}`}
            aria-hidden="true"
          >
            <span>
              REDUCED MOTION{' '}
              <span className={styles.outerThemingStatusActive}>ACTIVE</span>
            </span>
          </span>
        )}
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
          <span>{themeLabel} THEME</span>
        </button>
      </div>
    </div>
  );
};

export default OuterTheming;
