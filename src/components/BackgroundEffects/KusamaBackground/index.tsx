'use client';

import { useEffect, useRef } from 'react';
import type p5 from 'p5';
import { useIosImmersiveViewport } from '../shared/useIosImmersiveViewport';
import styles from './KusamaBackground.module.sass';

export default function KusamaBackground() {
  const rootRef = useRef<HTMLDivElement>(null);

  useIosImmersiveViewport();

  useEffect(() => {
    let instance: p5 | null = null;
    let isDisposed = false;

    const init = async () => {
      const host = rootRef.current;
      if (!host) return;

      const [{ default: P5 }, { createKusamaSketch, KUSAMA_DEFAULT_PARAMS }] =
        await Promise.all([import('p5'), import('./kusamaSketch')]);
      if (isDisposed || !rootRef.current) return;

      instance = new P5(
        createKusamaSketch({
          host,
          canvasClassName: styles.kusamaCanvas,
          params: KUSAMA_DEFAULT_PARAMS,
        }),
      );
    };

    init();

    return () => {
      isDisposed = true;
      instance?.remove();
      instance = null;
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${styles.kusamaRoot}`}
      data-version="kusama"
      aria-hidden="true"
    />
  );
}
