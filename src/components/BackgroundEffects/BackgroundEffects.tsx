'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type p5 from 'p5';
import styles from './BackgroundEffects.module.sass';
import {
  createSegmentsSketch,
  SEGMENTS_DEFAULT_PARAMS,
} from './segmentsSketch';

const VIEWBOX_SIZE = 1200;
const CENTER = VIEWBOX_SIZE / 2;
const EDGE_DISTANCE = VIEWBOX_SIZE / 2;
const DEFAULT_LINE_GAP = 18;
const DEFAULT_ROTATION_DURATION_MS = 36000;

type BackgroundEffectsProps = {
  version: 'radiating' | 'segments';
};

function RadiatingBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [lineCount, setLineCount] = useState(220);
  const [rotationDurationMs, setRotationDurationMs] = useState(
    DEFAULT_ROTATION_DURATION_MS,
  );
  const [angleOffset, setAngleOffset] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const computedStyles = getComputedStyle(root);
    const rawGap = computedStyles.getPropertyValue('--rb-line-gap').trim();
    const parsedGap = Number.parseFloat(rawGap);
    const gap = Number.isFinite(parsedGap) && parsedGap > 0 ? parsedGap : DEFAULT_LINE_GAP;
    const circumference = 2 * Math.PI * EDGE_DISTANCE;
    const computedCount = Math.round(circumference / gap);
    const clampedCount = Math.min(720, Math.max(48, computedCount));

    setLineCount(clampedCount);

    const rawDuration = computedStyles
      .getPropertyValue('--rb-rotation-duration')
      .trim();
    const parsedDuration = Number.parseFloat(rawDuration);
    const isMs = rawDuration.endsWith('ms');
    const resolvedDuration = Number.isFinite(parsedDuration)
      ? isMs
        ? parsedDuration
        : parsedDuration * 1000
      : DEFAULT_ROTATION_DURATION_MS;
    setRotationDurationMs(Math.max(1, resolvedDuration));
  }, []);

  const radialLines = useMemo(
    () =>
      Array.from({ length: lineCount }, (_, index) => {
        const angle = (index / lineCount) * Math.PI * 2 + angleOffset;
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        const fromScale = 0;
        const toScale = EDGE_DISTANCE / Math.max(Math.abs(dx), Math.abs(dy));

        return {
          x1: CENTER + dx * fromScale,
          y1: CENTER + dy * fromScale,
          x2: CENTER + dx * toScale,
          y2: CENTER + dy * toScale,
        };
      }),
    [angleOffset, lineCount],
  );

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (prefersReducedMotion) return;

    let frameId = 0;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = (elapsed % rotationDurationMs) / rotationDurationMs;
      setAngleOffset(progress * Math.PI * 2);
      frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [rotationDurationMs]);

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-version="radiating"
      aria-hidden="true"
    >
      <svg
        className={styles.svg}
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        preserveAspectRatio="xMidYMid slice"
        role="presentation"
      >
        <rect
          className={styles.background}
          width={VIEWBOX_SIZE}
          height={VIEWBOX_SIZE}
        />
        <g className={styles.lines}>
          {radialLines.map((line, index) => (
            <line
              key={index}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

function SegmentsBackground() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let instance: p5 | null = null;
    let isDisposed = false;

    const init = async () => {
      const host = rootRef.current;
      if (!host) return;

      const { default: P5 } = await import('p5');
      if (isDisposed || !rootRef.current) return;

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

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${styles.segmentsRoot}`}
      data-version="segments"
      aria-hidden="true"
    />
  );
}

export default function BackgroundEffects({ version }: BackgroundEffectsProps) {
  if (version === 'segments') {
    return <SegmentsBackground />;
  }

  return <RadiatingBackground />;
}
