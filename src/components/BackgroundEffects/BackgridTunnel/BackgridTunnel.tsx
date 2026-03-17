'use client';

import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { useStore } from '@/store/store';
import IntroEnterButton from '../IntroEnterButton/IntroEnterButton';
import { useIosImmersiveViewport } from '../shared/useIosImmersiveViewport';
import styles from './BackgridTunnel.module.sass';

type BackgridTunnelProps = {
  horizontalLines?: number;
  verticalLines?: number;
  ringCount?: number;
  backPlaneScale?: number;
  capAtBackPlane?: boolean;
};

type ViewportSize = {
  width: number;
  height: number;
};

type RingRect = {
  index: number;
  left: number;
  top: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
};

const DEFAULT_HORIZONTAL_LINES = 3;
const DEFAULT_VERTICAL_LINES = 4;
const DEFAULT_RING_COUNT = 4;
const DEFAULT_BACK_PLANE_SCALE = 0.6;
const DEFAULT_END_OPACITY = 0.66;
const DEPTH_ANIMATION_DURATION_SECONDS = 1;
const MAX_HORIZONTAL_PERSPECTIVE_SHIFT_FACTOR = 0.01;
const PORTRAIT_DEFAULT_HORIZONTAL_LINES = 3;
const PORTRAIT_DEFAULT_VERTICAL_LINES = 2;
const PORTRAIT_DEFAULT_RING_COUNT = 3;
const PORTRAIT_DEFAULT_BACK_PLANE_SCALE = 0.75;
const PORTRAIT_DEFAULT_END_OPACITY = 0.33;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const getInteriorFractions = (count: number) =>
  Array.from({ length: count }, (_, index) => (index + 1) / (count + 1));

const getRingRects = (
  width: number,
  height: number,
  ringCount: number,
  backPlaneScale: number,
  horizontalPerspectiveOffset: number,
): RingRect[] =>
  Array.from({ length: ringCount }, (_, index) => {
    const progress = ringCount === 1 ? 0 : index / (ringCount - 1);
    const scale =
      backPlaneScale <= 0 ? 1 : 1 - (1 - backPlaneScale) * progress;
    const ringWidth = width * scale;
    const ringHeight = height * scale;
    const left =
      (width - ringWidth) / 2 + horizontalPerspectiveOffset * progress;
    const top = (height - ringHeight) / 2;

    return {
      index,
      left,
      top,
      width: ringWidth,
      height: ringHeight,
      right: left + ringWidth,
      bottom: top + ringHeight,
    };
  });

export default function BackgridTunnel({
  horizontalLines,
  verticalLines,
  ringCount,
  backPlaneScale,
  capAtBackPlane = false,
}: BackgridTunnelProps) {
  const initialThemeIntroPending = useStore(
    (state) => state.initialThemeIntroPending,
  );
  const hidePageContent = useStore((state) => state.hidePageContent);
  const showPageContent = useStore((state) => state.showPageContent);
  const revealPageContent = useStore((state) => state.revealPageContent);
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const hasStartedEnterRef = useRef(!initialThemeIntroPending);
  const animatedBackPlaneScaleRef = useRef({ value: backPlaneScale });
  const horizontalPerspectiveRef = useRef({ value: 0 });
  const ringRefs = useRef<(HTMLDivElement | null)[]>([]);
  const verticalLineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const horizontalLineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [viewportSize, setViewportSize] = useState<ViewportSize>({
    width: 0,
    height: 0,
  });
  const [animatedBackPlaneScale, setAnimatedBackPlaneScale] = useState(1);
  const [horizontalPerspectiveOffset, setHorizontalPerspectiveOffset] = useState(0);
  const [hasFinePointer, setHasFinePointer] = useState<boolean | null>(null);
  const [showEnterButton, setShowEnterButton] = useState(
    initialThemeIntroPending,
  );

  const isPortraitViewport =
    viewportSize.width > 0 && viewportSize.height > 0
      ? viewportSize.height > viewportSize.width
      : false;
  const resolvedHorizontalLines =
    horizontalLines ??
    (isPortraitViewport
      ? PORTRAIT_DEFAULT_HORIZONTAL_LINES
      : DEFAULT_HORIZONTAL_LINES);
  const resolvedVerticalLines =
    verticalLines ??
    (isPortraitViewport
      ? PORTRAIT_DEFAULT_VERTICAL_LINES
      : DEFAULT_VERTICAL_LINES);
  const resolvedRingCount =
    ringCount ??
    (isPortraitViewport ? PORTRAIT_DEFAULT_RING_COUNT : DEFAULT_RING_COUNT);
  const resolvedBackPlaneScale =
    backPlaneScale ??
    (isPortraitViewport
      ? PORTRAIT_DEFAULT_BACK_PLANE_SCALE
      : DEFAULT_BACK_PLANE_SCALE);
  const resolvedEndOpacity = isPortraitViewport
    ? PORTRAIT_DEFAULT_END_OPACITY
    : DEFAULT_END_OPACITY;

  useIosImmersiveViewport();

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      setHasFinePointer(false);
      return;
    }

    const mediaQuery = window.matchMedia('(pointer: fine)');
    setHasFinePointer(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setHasFinePointer(event.matches);
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const updateViewportSize = (width: number, height: number) => {
      const nextWidth = Math.round(width);
      const nextHeight = Math.round(height);

      setViewportSize((currentSize) => {
        if (
          currentSize.width === nextWidth &&
          currentSize.height === nextHeight
        ) {
          return currentSize;
        }

        return {
          width: nextWidth,
          height: nextHeight,
        };
      });
    };

    updateViewportSize(root.clientWidth, root.clientHeight);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      updateViewportSize(entry.contentRect.width, entry.contentRect.height);
    });

    resizeObserver.observe(root);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (initialThemeIntroPending) {
      hasStartedEnterRef.current = false;
      hidePageContent();
      setShowEnterButton(true);
      return;
    }

    hasStartedEnterRef.current = true;
    setShowEnterButton(false);
    showPageContent();
  }, [
    hidePageContent,
    initialThemeIntroPending,
    showPageContent,
  ]);

  useEffect(() => {
    animatedBackPlaneScaleRef.current.value = 1;
    setAnimatedBackPlaneScale(1);
    if (gridRef.current) {
      gsap.killTweensOf(gridRef.current);
      gsap.set(gridRef.current, { opacity: 1 });
    }
  }, [resolvedBackPlaneScale, resolvedEndOpacity]);

  useEffect(() => {
    const animatedScaleState = animatedBackPlaneScaleRef.current;
    const horizontalPerspectiveState = horizontalPerspectiveRef.current;
    const grid = gridRef.current;

    return () => {
      gsap.killTweensOf(animatedScaleState);
      gsap.killTweensOf(horizontalPerspectiveState);
      if (grid) {
        gsap.killTweensOf(grid);
      }
    };
  }, []);

  useEffect(() => {
    const horizontalPerspectiveState = horizontalPerspectiveRef.current;

    if (!hasFinePointer || viewportSize.width <= 0) {
      gsap.killTweensOf(horizontalPerspectiveState);
      horizontalPerspectiveState.value = 0;
      setHorizontalPerspectiveOffset(0);
      return;
    }

    const maxHorizontalShift =
      viewportSize.width * MAX_HORIZONTAL_PERSPECTIVE_SHIFT_FACTOR;

    const updatePerspective = (clientX: number) => {
      const progressAcrossViewport = clamp(clientX / viewportSize.width, 0, 1);
      const normalizedOffset = (progressAcrossViewport - 0.5) * 2;
      const targetOffset = -normalizedOffset * maxHorizontalShift;

      gsap.to(horizontalPerspectiveState, {
        value: targetOffset,
        duration: 0.35,
        ease: 'power3.out',
        overwrite: true,
        onUpdate: () => {
          setHorizontalPerspectiveOffset(horizontalPerspectiveState.value);
        },
      });
    };

    const handleMouseMove = (event: MouseEvent) => {
      updatePerspective(event.clientX);
    };

    const handleMouseLeave = () => {
      gsap.to(horizontalPerspectiveState, {
        value: 0,
        duration: 0.45,
        ease: 'power3.out',
        overwrite: true,
        onUpdate: () => {
          setHorizontalPerspectiveOffset(horizontalPerspectiveState.value);
        },
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      gsap.killTweensOf(horizontalPerspectiveState);
    };
  }, [hasFinePointer, viewportSize.width]);

  const runDepthAnimation = useCallback((onComplete?: () => void) => {
    const animatedScaleState = animatedBackPlaneScaleRef.current;
    const grid = gridRef.current;

    gsap.killTweensOf(animatedScaleState);
    if (grid) {
      gsap.killTweensOf(grid);
      gsap.set(grid, { opacity: 1 });
    }
    animatedScaleState.value = 1;
    setAnimatedBackPlaneScale(1);

    gsap.to(animatedScaleState, {
      value: resolvedBackPlaneScale,
      duration: DEPTH_ANIMATION_DURATION_SECONDS,
      ease: 'power3.out',
      onComplete,
      onUpdate: () => {
        setAnimatedBackPlaneScale(animatedScaleState.value);
      },
    });

    if (grid) {
      gsap.to(grid, {
        opacity: resolvedEndOpacity,
        duration: DEPTH_ANIMATION_DURATION_SECONDS,
        ease: 'power3.out',
      });
    }
  }, [resolvedBackPlaneScale, resolvedEndOpacity]);

  const handleEnter = useCallback(() => {
    if (hasStartedEnterRef.current) {
      return;
    }

    hasStartedEnterRef.current = true;
    setShowEnterButton(false);
    runDepthAnimation(() => {
      revealPageContent();
    });
  }, [revealPageContent, runDepthAnimation]);

  useEffect(() => {
    if (!showEnterButton) {
      return;
    }

    const handleDocumentClick = () => {
      handleEnter();
    };

    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === 'Tab' &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        handleEnter();
      }
    };

    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleDocumentKeyDown);

    return () => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleDocumentKeyDown);
    };
  }, [handleEnter, showEnterButton]);

  const safeHorizontalLines = Math.max(0, Math.floor(resolvedHorizontalLines));
  const safeVerticalLines = Math.max(0, Math.floor(resolvedVerticalLines));
  const safeRingCount = Math.max(2, Math.floor(resolvedRingCount));
  const safeBackPlaneScale = clamp(animatedBackPlaneScale, 0, 0.96);
  const horizontalFractions = getInteriorFractions(safeHorizontalLines);
  const verticalFractions = getInteriorFractions(safeVerticalLines);
  const topBottomConnectorFractions = [0, ...verticalFractions, 1];
  const rings =
    viewportSize.width > 0 && viewportSize.height > 0
      ? getRingRects(
          viewportSize.width,
          viewportSize.height,
          safeRingCount,
          safeBackPlaneScale,
          horizontalPerspectiveOffset,
        )
      : [];
  const connectors: ReactNode[] = [];

  ringRefs.current.length = rings.length;
  verticalLineRefs.current.length = verticalFractions.length;
  horizontalLineRefs.current.length = horizontalFractions.length;

  for (let index = 0; index < rings.length - 1; index += 1) {
    const outerRing = rings[index];
    const innerRing = rings[index + 1];

    if (!outerRing || !innerRing) {
      continue;
    }

    for (const fraction of topBottomConnectorFractions) {
      const outerX = outerRing.left + outerRing.width * fraction;
      const innerX = innerRing.left + innerRing.width * fraction;
      const topDx = innerX - outerX;
      const topDy = innerRing.top - outerRing.top;
      const topLength = Math.hypot(topDx, topDy);
      const topAngle = (Math.atan2(topDy, topDx) * 180) / Math.PI;

      connectors.push(
        <div
          key={`top-${index}-${fraction}`}
          className={styles.connector}
          style={{
            left: outerX,
            top: outerRing.top,
            width: topLength,
            transform: `rotate(${topAngle}deg)`,
          }}
        />,
      );

      const bottomDx = innerX - outerX;
      const bottomDy = innerRing.bottom - outerRing.bottom;
      const bottomLength = Math.hypot(bottomDx, bottomDy);
      const bottomAngle = (Math.atan2(bottomDy, bottomDx) * 180) / Math.PI;

      connectors.push(
        <div
          key={`bottom-${index}-${fraction}`}
          className={styles.connector}
          style={{
            left: outerX,
            top: outerRing.bottom,
            width: bottomLength,
            transform: `rotate(${bottomAngle}deg)`,
          }}
        />,
      );
    }

    for (const fraction of horizontalFractions) {
      const outerY = outerRing.top + outerRing.height * fraction;
      const innerY = innerRing.top + innerRing.height * fraction;
      const leftDx = innerRing.left - outerRing.left;
      const leftDy = innerY - outerY;
      const leftLength = Math.hypot(leftDx, leftDy);
      const leftAngle = (Math.atan2(leftDy, leftDx) * 180) / Math.PI;

      connectors.push(
        <div
          key={`left-${index}-${fraction}`}
          className={styles.connector}
          style={{
            left: outerRing.left,
            top: outerY,
            width: leftLength,
            transform: `rotate(${leftAngle}deg)`,
          }}
        />,
      );

      const rightDx = innerRing.right - outerRing.right;
      const rightDy = innerY - outerY;
      const rightLength = Math.hypot(rightDx, rightDy);
      const rightAngle = (Math.atan2(rightDy, rightDx) * 180) / Math.PI;

      connectors.push(
        <div
          key={`right-${index}-${fraction}`}
          className={styles.connector}
          style={{
            left: outerRing.right,
            top: outerY,
            width: rightLength,
            transform: `rotate(${rightAngle}deg)`,
          }}
        />,
      );
    }
  }

  return (
    <>
      <div
        ref={rootRef}
        className={styles.root}
        data-version="backgrid"
        aria-hidden="true"
      >
        <div ref={gridRef} className={styles.grid}>
          {connectors}
          {rings.map((ring) => {
            const isBackPlane = ring.index === rings.length - 1;
            const isFrontRing = ring.index === 0;

            return (
              <div
                key={ring.index}
                ref={(node) => {
                  ringRefs.current[ring.index] = node;
                }}
                className={styles.ring}
                style={{
                  left: ring.left,
                  opacity: isFrontRing ? 0 : 1,
                  top: ring.top,
                  width: ring.width,
                  height: ring.height,
                }}
              >
                {!capAtBackPlane &&
                  isBackPlane &&
                  verticalFractions.map((fraction) => (
                    <div
                      key={`v-${ring.index}-${fraction}`}
                      ref={(node) => {
                        verticalLineRefs.current[verticalFractions.indexOf(fraction)] =
                          node;
                      }}
                      className={styles.ringVertical}
                      style={{ left: `${fraction * 100}%` }}
                    />
                  ))}
                {!capAtBackPlane &&
                  isBackPlane &&
                  horizontalFractions.map((fraction) => (
                    <div
                      key={`h-${ring.index}-${fraction}`}
                      ref={(node) => {
                        horizontalLineRefs.current[
                          horizontalFractions.indexOf(fraction)
                        ] = node;
                      }}
                      className={styles.ringHorizontal}
                      style={{ top: `${fraction * 100}%` }}
                    />
                  ))}
              </div>
            );
          })}
        </div>
      </div>
      {showEnterButton && hasFinePointer === false && (
        <IntroEnterButton onClick={handleEnter} />
      )}
      {showEnterButton && hasFinePointer === true && (
        <div
          className={`${styles.enterCursorLayer} cursorMessage`}
          data-cursor-message="Enter"
          aria-hidden="true"
        />
      )}
    </>
  );
}
