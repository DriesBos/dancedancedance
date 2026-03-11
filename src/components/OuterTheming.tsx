'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/store';
import {
  getPortraitOrientationMediaQuery,
  getReducedMotionMediaQuery,
  shouldApplyReducedMotion,
} from '@/lib/reduced-motion';
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

    const reducedMotionQuery = window.matchMedia(getReducedMotionMediaQuery());
    const orientationQuery = window.matchMedia(
      getPortraitOrientationMediaQuery(),
    );
    const syncReducedMotionPreference = () => {
      setPrefersReducedMotion(shouldApplyReducedMotion());
    };

    syncReducedMotionPreference();

    const addMediaQueryListener = (
      query: MediaQueryList,
      listener: () => void,
    ) => {
      if (typeof query.addEventListener === 'function') {
        query.addEventListener('change', listener);
        return () => {
          query.removeEventListener('change', listener);
        };
      }

      query.addListener(listener);
      return () => {
        query.removeListener(listener);
      };
    };

    const removeReducedMotionListener = addMediaQueryListener(
      reducedMotionQuery,
      syncReducedMotionPreference,
    );
    const removeOrientationListener = addMediaQueryListener(
      orientationQuery,
      syncReducedMotionPreference,
    );

    return () => {
      removeReducedMotionListener();
      removeOrientationListener();
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
