'use client';

import { useEffect, useRef } from 'react';
import type p5 from 'p5';
import { useIosImmersiveViewport } from '../shared/useIosImmersiveViewport';
import styles from './SegmentsBackground.module.sass';

const SEGMENTS_SCALE_DURATION_MS = 60000;
const SEGMENTS_SCALE_DURATION_PORTRAIT_MS = 30000;

export default function SegmentsBackground() {
  const hostRef = useRef<HTMLDivElement>(null);

  useIosImmersiveViewport();

  useEffect(() => {
    let instance: p5 | null = null;
    let isDisposed = false;

    const init = async () => {
      const host = hostRef.current;
      if (!host) return;

      const [{ default: P5 }, { createSegmentsSketch, SEGMENTS_DEFAULT_PARAMS }] =
        await Promise.all([import('p5'), import('./segmentsSketch')]);
      if (isDisposed || !hostRef.current) return;

      instance = new P5(
        createSegmentsSketch({
          host,
          canvasClassName: styles.segmentsCanvas,
          params: SEGMENTS_DEFAULT_PARAMS,
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

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const fromScale = 1;
    const toScale = 0.5;
    const isPortrait =
      window.matchMedia?.('(orientation: portrait)').matches ??
      window.innerHeight > window.innerWidth;
    const durationMs = isPortrait
      ? SEGMENTS_SCALE_DURATION_PORTRAIT_MS
      : SEGMENTS_SCALE_DURATION_MS;
    let frameId = 0;
    let startTime = 0;

    const applyScale = (scale: number) => {
      host.style.transform = `translate3d(-50%, -50%, 0) scale(${scale})`;
    };

    applyScale(fromScale);

    const animate = (timestamp: number) => {
      if (!startTime) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const scale = fromScale + (toScale - fromScale) * progress;

      applyScale(scale);

      if (progress < 1) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    frameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameId);
      host.style.transform = `translate3d(-50%, -50%, 0) scale(${fromScale})`;
    };
  }, []);

  return (
    <div
      className={`${styles.root} ${styles.segmentsViewport}`}
      data-version="segments"
      aria-hidden="true"
    >
      <div ref={hostRef} className={styles.segmentsRoot} />
    </div>
  );
}
