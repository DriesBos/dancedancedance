'use client';

import { usePathname } from 'next/navigation';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
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

type ConnectorDescriptor = {
  key: string;
  outerRingIndex: number;
  fraction: number;
  side: 'top' | 'bottom' | 'left' | 'right';
};

const DEFAULT_HORIZONTAL_LINES = 3;
const DEFAULT_VERTICAL_LINES = 4;
const DEFAULT_RING_COUNT = 4;
const DEFAULT_BACK_PLANE_SCALE = 0.6;
const DEFAULT_END_OPACITY = 0.6;
const DEPTH_ANIMATION_DURATION_SECONDS = 1;
const MAX_HORIZONTAL_PERSPECTIVE_SHIFT_FACTOR = 0.01;
const MAX_VERTICAL_PERSPECTIVE_SHIFT_FACTOR = 0.03;
const ROUTE_PULSE_DURATION_SECONDS = 0.5;
const ROUTE_PULSE_OVERSCAN_FACTOR = 1.02;
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
  verticalPerspectiveOffset: number,
): RingRect[] =>
  Array.from({ length: ringCount }, (_, index) => {
    const progress = ringCount === 1 ? 0 : index / (ringCount - 1);
    const scale =
      backPlaneScale <= 0 ? 1 : 1 - (1 - backPlaneScale) * progress;
    const ringWidth = width * scale;
    const ringHeight = height * scale;
    const left =
      (width - ringWidth) / 2 + horizontalPerspectiveOffset * progress;
    const top =
      (height - ringHeight) / 2 + verticalPerspectiveOffset * progress;

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

const useStableEvent = <Args extends unknown[], Return>(
  handler: (...args: Args) => Return,
) => {
  const handlerRef = useRef(handler);

  useLayoutEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  return useCallback((...args: Args) => handlerRef.current(...args), []);
};

export default function BackgridTunnel({
  horizontalLines,
  verticalLines,
  ringCount,
  backPlaneScale,
  capAtBackPlane = false,
}: BackgridTunnelProps) {
  const pathname = usePathname();
  const initialThemeIntroPending = useStore(
    (state) => state.initialThemeIntroPending,
  );
  const hidePageContent = useStore((state) => state.hidePageContent);
  const showPageContent = useStore((state) => state.showPageContent);
  const revealPageContent = useStore((state) => state.revealPageContent);
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const routePulseRef = useRef<HTMLDivElement>(null);
  const routePulseRectsRef = useRef<{
    start: RingRect | null;
    end: RingRect | null;
  }>({
    start: null,
    end: null,
  });
  const hasSeenPathnameRef = useRef(false);
  const hasStartedEnterRef = useRef(!initialThemeIntroPending);
  const animatedBackPlaneScaleRef = useRef({ value: backPlaneScale ?? 1 });
  const horizontalPerspectiveRef = useRef({ value: 0 });
  const verticalPerspectiveRef = useRef({ value: 0 });
  const ringRefs = useRef<(HTMLDivElement | null)[]>([]);
  const connectorRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [viewportSize, setViewportSize] = useState<ViewportSize>({
    width: 0,
    height: 0,
  });
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

  const safeHorizontalLines = Math.max(0, Math.floor(resolvedHorizontalLines));
  const safeVerticalLines = Math.max(0, Math.floor(resolvedVerticalLines));
  const safeRingCount = Math.max(2, Math.floor(resolvedRingCount));
  const horizontalFractions = getInteriorFractions(safeHorizontalLines);
  const verticalFractions = getInteriorFractions(safeVerticalLines);
  const topBottomConnectorFractions = [0, ...verticalFractions, 1];
  const connectorDescriptors: ConnectorDescriptor[] = [];

  for (let index = 0; index < safeRingCount - 1; index += 1) {
    for (const fraction of topBottomConnectorFractions) {
      connectorDescriptors.push({
        key: `top-${index}-${fraction}`,
        outerRingIndex: index,
        fraction,
        side: 'top',
      });
      connectorDescriptors.push({
        key: `bottom-${index}-${fraction}`,
        outerRingIndex: index,
        fraction,
        side: 'bottom',
      });
    }

    for (const fraction of horizontalFractions) {
      connectorDescriptors.push({
        key: `left-${index}-${fraction}`,
        outerRingIndex: index,
        fraction,
        side: 'left',
      });
      connectorDescriptors.push({
        key: `right-${index}-${fraction}`,
        outerRingIndex: index,
        fraction,
        side: 'right',
      });
    }
  }

  ringRefs.current.length = safeRingCount;
  connectorRefs.current.length = connectorDescriptors.length;

  useIosImmersiveViewport();

  const applyGeometry = useStableEvent(() => {
    const { width, height } = viewportSize;
    if (width <= 0 || height <= 0) {
      return;
    }

    const rings = getRingRects(
      width,
      height,
      safeRingCount,
      clamp(animatedBackPlaneScaleRef.current.value, 0, 0.96),
      horizontalPerspectiveRef.current.value,
      verticalPerspectiveRef.current.value,
    );
    const routePulseEndWidth = width * ROUTE_PULSE_OVERSCAN_FACTOR;
    const routePulseEndHeight = height * ROUTE_PULSE_OVERSCAN_FACTOR;

    routePulseRectsRef.current = {
      start: rings[rings.length - 1] ?? null,
      end: {
        index: -1,
        left: (width - routePulseEndWidth) / 2,
        top: (height - routePulseEndHeight) / 2,
        width: routePulseEndWidth,
        height: routePulseEndHeight,
        right: (width + routePulseEndWidth) / 2,
        bottom: (height + routePulseEndHeight) / 2,
      },
    };

    for (let index = 0; index < rings.length; index += 1) {
      const ring = rings[index];
      const ringElement = ringRefs.current[index];

      if (!ring || !ringElement) {
        continue;
      }

      ringElement.style.left = `${ring.left}px`;
      ringElement.style.top = `${ring.top}px`;
      ringElement.style.width = `${ring.width}px`;
      ringElement.style.height = `${ring.height}px`;
      ringElement.style.opacity = index === 0 ? '0' : '1';
    }

    for (let index = 0; index < connectorDescriptors.length; index += 1) {
      const descriptor = connectorDescriptors[index];
      const connectorElement = connectorRefs.current[index];

      if (!descriptor || !connectorElement) {
        continue;
      }

      const outerRing = rings[descriptor.outerRingIndex];
      const innerRing = rings[descriptor.outerRingIndex + 1];
      if (!outerRing || !innerRing) {
        continue;
      }

      let left = 0;
      let top = 0;
      let deltaX = 0;
      let deltaY = 0;

      if (descriptor.side === 'top' || descriptor.side === 'bottom') {
        const outerX = outerRing.left + outerRing.width * descriptor.fraction;
        const innerX = innerRing.left + innerRing.width * descriptor.fraction;

        left = outerX;
        top = descriptor.side === 'top' ? outerRing.top : outerRing.bottom;
        deltaX = innerX - outerX;
        deltaY =
          descriptor.side === 'top'
            ? innerRing.top - outerRing.top
            : innerRing.bottom - outerRing.bottom;
      } else {
        const outerY = outerRing.top + outerRing.height * descriptor.fraction;
        const innerY = innerRing.top + innerRing.height * descriptor.fraction;

        left = descriptor.side === 'left' ? outerRing.left : outerRing.right;
        top = outerY;
        deltaX =
          descriptor.side === 'left'
            ? innerRing.left - outerRing.left
            : innerRing.right - outerRing.right;
        deltaY = innerY - outerY;
      }

      const length = Math.hypot(deltaX, deltaY);
      const angle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;

      connectorElement.style.left = `${left}px`;
      connectorElement.style.top = `${top}px`;
      connectorElement.style.width = `${length}px`;
      connectorElement.style.transform = `rotate(${angle}deg)`;
    }
  });

  useLayoutEffect(() => {
    applyGeometry();
  }, [
    applyGeometry,
    viewportSize.width,
    viewportSize.height,
    safeRingCount,
    safeHorizontalLines,
    safeVerticalLines,
  ]);

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
    applyGeometry();

    if (gridRef.current) {
      gsap.killTweensOf(gridRef.current);
      gsap.set(gridRef.current, { opacity: 1 });
    }
  }, [applyGeometry, resolvedBackPlaneScale, resolvedEndOpacity]);

  useEffect(() => {
    const animatedScaleState = animatedBackPlaneScaleRef.current;
    const horizontalPerspectiveState = horizontalPerspectiveRef.current;
    const verticalPerspectiveState = verticalPerspectiveRef.current;
    const grid = gridRef.current;
    const routePulse = routePulseRef.current;

    return () => {
      gsap.killTweensOf(animatedScaleState);
      gsap.killTweensOf(horizontalPerspectiveState);
      gsap.killTweensOf(verticalPerspectiveState);
      if (grid) {
        gsap.killTweensOf(grid);
      }
      if (routePulse) {
        gsap.killTweensOf(routePulse);
      }
    };
  }, []);

  useEffect(() => {
    const horizontalPerspectiveState = horizontalPerspectiveRef.current;

    if (!hasFinePointer || viewportSize.width <= 0) {
      gsap.killTweensOf(horizontalPerspectiveState);
      horizontalPerspectiveState.value = 0;
      applyGeometry();
      return;
    }

    const maxHorizontalShift =
      viewportSize.width * MAX_HORIZONTAL_PERSPECTIVE_SHIFT_FACTOR;
    const setHorizontalPerspective = gsap.quickTo(
      horizontalPerspectiveState,
      'value',
      {
        duration: 0.35,
        ease: 'power3.out',
        onUpdate: applyGeometry,
      },
    );

    const handleMouseMove = (event: MouseEvent) => {
      const progressAcrossViewport = clamp(event.clientX / viewportSize.width, 0, 1);
      const normalizedOffset = (progressAcrossViewport - 0.5) * 2;
      const targetOffset = -normalizedOffset * maxHorizontalShift;

      setHorizontalPerspective(targetOffset);
    };

    const handleMouseLeave = () => {
      setHorizontalPerspective(0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      gsap.killTweensOf(horizontalPerspectiveState);
    };
  }, [applyGeometry, hasFinePointer, viewportSize.width]);

  useEffect(() => {
    const verticalPerspectiveState = verticalPerspectiveRef.current;

    if (viewportSize.height <= 0) {
      gsap.killTweensOf(verticalPerspectiveState);
      verticalPerspectiveState.value = 0;
      applyGeometry();
      return;
    }

    const maxVerticalShift =
      viewportSize.height * MAX_VERTICAL_PERSPECTIVE_SHIFT_FACTOR;
    const setVerticalPerspective = gsap.quickTo(
      verticalPerspectiveState,
      'value',
      {
        duration: 0.1,
        ease: 'power3.out',
        onUpdate: applyGeometry,
      },
    );

    const updatePerspective = () => {
      const scrollRoot = document.documentElement;
      const totalScrollableHeight = Math.max(
        1,
        scrollRoot.scrollHeight - window.innerHeight,
      );
      const scrollProgress = clamp(window.scrollY / totalScrollableHeight, 0, 1);
      const targetOffset = -scrollProgress * maxVerticalShift;

      setVerticalPerspective(targetOffset);
    };

    updatePerspective();
    window.addEventListener('scroll', updatePerspective, { passive: true });

    return () => {
      window.removeEventListener('scroll', updatePerspective);
      gsap.killTweensOf(verticalPerspectiveState);
    };
  }, [applyGeometry, viewportSize.height]);

  const runDepthAnimation = useCallback((onComplete?: () => void) => {
    const animatedScaleState = animatedBackPlaneScaleRef.current;
    const grid = gridRef.current;

    gsap.killTweensOf(animatedScaleState);
    animatedScaleState.value = 1;
    applyGeometry();

    if (grid) {
      gsap.killTweensOf(grid);
      gsap.set(grid, { opacity: 1 });
    }

    gsap.to(animatedScaleState, {
      value: resolvedBackPlaneScale,
      duration: DEPTH_ANIMATION_DURATION_SECONDS,
      ease: 'power3.out',
      onComplete,
      onUpdate: applyGeometry,
    });

    if (grid) {
      gsap.to(grid, {
        opacity: resolvedEndOpacity,
        duration: DEPTH_ANIMATION_DURATION_SECONDS,
        ease: 'power3.out',
      });
    }
  }, [applyGeometry, resolvedBackPlaneScale, resolvedEndOpacity]);

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

  useEffect(() => {
    const routePulse = routePulseRef.current;
    if (!routePulse) {
      return;
    }

    if (!hasSeenPathnameRef.current) {
      hasSeenPathnameRef.current = true;
      gsap.set(routePulse, {
        autoAlpha: 0,
        height: 0,
        width: 0,
      });
      return;
    }

    if (showEnterButton) {
      return;
    }

    const { start, end } = routePulseRectsRef.current;
    if (!start || !end) {
      return;
    }

    gsap.killTweensOf(routePulse);
    gsap.set(routePulse, {
      autoAlpha: 1,
      height: start.height,
      left: start.left,
      top: start.top,
      width: start.width,
    });

    gsap.to(routePulse, {
      duration: ROUTE_PULSE_DURATION_SECONDS,
      ease: 'sine.out',
      height: end.height,
      left: end.left,
      top: end.top,
      width: end.width,
      onComplete: () => {
        gsap.set(routePulse, {
          autoAlpha: 0,
          height: 0,
          width: 0,
        });
      },
    });
  }, [pathname, showEnterButton]);

  const rings: ReactNode[] = Array.from({ length: safeRingCount }, (_, index) => {
    const isBackPlane = index === safeRingCount - 1;
    const isFrontRing = index === 0;

    return (
      <div
        key={index}
        ref={(node) => {
          ringRefs.current[index] = node;
        }}
        className={styles.ring}
        style={{ opacity: isFrontRing ? 0 : 1 }}
      >
        {!capAtBackPlane &&
          isBackPlane &&
          verticalFractions.map((fraction) => (
            <div
              key={`v-${index}-${fraction}`}
              className={styles.ringVertical}
              style={{ left: `${fraction * 100}%` }}
            />
          ))}
        {!capAtBackPlane &&
          isBackPlane &&
          horizontalFractions.map((fraction) => (
            <div
              key={`h-${index}-${fraction}`}
              className={styles.ringHorizontal}
              style={{ top: `${fraction * 100}%` }}
            />
          ))}
      </div>
    );
  });

  return (
    <>
      <div
        ref={rootRef}
        className={styles.root}
        data-version="backgrid"
        aria-hidden="true"
      >
        <div ref={gridRef} className={styles.grid}>
          <div ref={routePulseRef} className={styles.routePulse} />
          {connectorDescriptors.map((descriptor, index) => (
            <div
              key={descriptor.key}
              ref={(node) => {
                connectorRefs.current[index] = node;
              }}
              className={styles.connector}
            />
          ))}
          {rings}
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
