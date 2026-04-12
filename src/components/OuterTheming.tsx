'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/store';
import {
  getPortraitOrientationMediaQuery,
  getReducedMotionMediaQuery,
  shouldApplyReducedMotion,
} from '@/lib/reduced-motion';
import { useShallow } from 'zustand/react/shallow';
import { t } from '@/lib/locale';
import styles from './OuterTheming.module.sass';

const OuterTheming = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const { theme, locale, fullscreen, cycleTheme, setFullscreen } = useStore(
    useShallow((state) => ({
      theme: state.theme,
      locale: state.locale,
      fullscreen: state.fullscreen,
      cycleTheme: state.cycleTheme,
      setFullscreen: state.setFullscreen,
    })),
  );
  const themeLabel = theme.toUpperCase();
  const fullscreenLabel = fullscreen ? 'ON' : 'OFF';

  const isJapanese = (char: string) =>
    /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff\uff00-\uffef]/.test(char);

  const renderLabel = (text: string) => {
    if (locale !== 'ja') return text;
    return [...text].map((char, i) =>
      isJapanese(char) ? (
        <span key={i} className={styles.rotatedChar}>
          {char}
        </span>
      ) : (
        char
      ),
    );
  };

  const handleThemeCycle = () => {
    cycleTheme();
  };

  const handleFullscreenToggle = () => {
    setFullscreen(!fullscreen);
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
            <span className={styles.outerThemingButtonInner}>
              REDUCED MOTION{' '}
              <span className={styles.outerThemingStatusActive}>ACTIVE</span>
            </span>
          </span>
        )}
        <button
          type="button"
          className={`${styles.outerThemingButton} cursorInteract`}
          onClick={handleFullscreenToggle}
          aria-label={`Toggle fullscreen. Fullscreen is ${fullscreenLabel.toLowerCase()}`}
          title={`Fullscreen ${fullscreenLabel.toUpperCase()}`}
        >
          <span className={`${styles.outerThemingButtonInner} linkAnimation`}>
            {renderLabel(`${t('theming.layout', locale)} ${fullscreenLabel}`)}
          </span>
        </button>
        <button
          type="button"
          className={`${styles.outerThemingButton} cursorInteract`}
          onClick={handleThemeCycle}
          aria-label={`Cycle theme. Current theme: ${themeLabel}`}
          title={`${themeLabel} mode`}
        >
          <span className={`${styles.outerThemingButtonInner} linkAnimation`}>
            {renderLabel(`${t('theming.theme', locale)} ${themeLabel}`)}
          </span>
        </button>
      </div>
    </div>
  );
};

export default OuterTheming;
