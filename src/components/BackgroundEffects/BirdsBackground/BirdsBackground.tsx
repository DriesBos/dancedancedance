'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useIosImmersiveViewport } from '../shared/useIosImmersiveViewport';
import styles from './BirdsBackground.module.sass';

const BirdsScene = dynamic(() => import('./BirdsScene'), { ssr: false });

type BirdsBackgroundProps = {
  densityScale?: number;
};

export default function BirdsBackground({
  densityScale = 1,
}: BirdsBackgroundProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [sceneColors, setSceneColors] = useState({
    background: '#b49f82',
    bird: '#fffdf8',
  });

  useIosImmersiveViewport();

  useEffect(() => {
    const host = rootRef.current;
    if (!host) return;

    const updateColors = () => {
      const computedStyles = getComputedStyle(host);
      const background =
        computedStyles.getPropertyValue('--be-birds-bg-color').trim() ||
        computedStyles.getPropertyValue('--theme-bg').trim() ||
        '#FFFFFF';
      const bird =
        computedStyles.getPropertyValue('--be-birds-color').trim() ||
        computedStyles.getPropertyValue('--theme-type').trim() ||
        '#000000';

      setSceneColors((previous) => {
        if (previous.background === background && previous.bird === bird) {
          return previous;
        }

        return {
          background,
          bird,
        };
      });
    };

    updateColors();
    window.addEventListener('resize', updateColors, { passive: true });

    const observer = new MutationObserver(updateColors);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      window.removeEventListener('resize', updateColors);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${styles.birdsRoot}`}
      data-version="birds"
      aria-hidden="true"
    >
      <BirdsScene
        className={styles.birdsCanvas}
        backgroundColor={sceneColors.background}
        birdColor={sceneColors.bird}
        densityScale={densityScale}
      />
    </div>
  );
}
